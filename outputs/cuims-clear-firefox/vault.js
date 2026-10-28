// Encrypted credential vault for CUIMS Glass. Fully offline: AES-GCM-256
// with a PBKDF2-SHA256 key derived from a student-chosen passphrase.
// The ciphertext lives in chrome.storage.local; the derived key and the
// decrypted login live only in memory / chrome.storage.session, which the
// browser clears when it closes. Nothing is ever sent anywhere: there is no
// server, no analytics, and no remote code in this extension.
(function (root) {
  const VERSION = 1;
  const ITERATIONS = 250000;
  const SALT_LEN = 16;
  const IV_LEN = 12;
  const SESSION_KEY = "vaultSession";
  const AUTOLOCK_MS = 15 * 60 * 1000;

  // In-memory fallback when chrome.storage.session is unavailable (older
  // browsers, some test VMs). Cleared on unload like a session would be.
  let memorySession = null;

  function subtle() {
    const crypto = root.crypto || globalThis.crypto;
    if (!crypto || !crypto.subtle) throw new Error("WebCrypto is unavailable in this browser.");
    return crypto.subtle;
  }

  function bytesToB64(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    // btoa exists in extension pages and content scripts.
    if (typeof root.btoa === "function") return root.btoa(binary);
    return Buffer.from(binary, "binary").toString("base64");
  }

  function b64ToBytes(b64) {
    let binary;
    if (typeof root.atob === "function") binary = root.atob(String(b64));
    else binary = Buffer.from(String(b64), "base64").toString("binary");
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  }

  function randomBytes(length) {
    const crypto = root.crypto || globalThis.crypto;
    const out = new Uint8Array(length);
    if (crypto && crypto.getRandomValues) crypto.getRandomValues(out);
    else for (let i = 0; i < length; i += 1) out[i] = Math.floor(Math.random() * 256);
    return out;
  }

  async function deriveKey(passphrase, saltBytes) {
    const enc = new TextEncoder();
    const base = await subtle().importKey("raw", enc.encode(String(passphrase || "")), "PBKDF2", false, ["deriveKey"]);
    return subtle().deriveKey(
      { name: "PBKDF2", salt: saltBytes, iterations: ITERATIONS, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async function createVault(uid, password, passphrase) {
    if (!passphrase || String(passphrase).length < 8) throw new Error("Choose a passphrase of at least 8 characters.");
    const cleanUid = String(uid || "").trim();
    if (!cleanUid) throw new Error("Enter your UID first.");
    const salt = randomBytes(SALT_LEN);
    const iv = randomBytes(IV_LEN);
    const key = await deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const payload = enc.encode(JSON.stringify({ uid: cleanUid, password: String(password || "") }));
    const cipher = new Uint8Array(await subtle().encrypt({ name: "AES-GCM", iv }, key, payload));
    return {
      v: VERSION,
      salt: bytesToB64(salt),
      iv: bytesToB64(iv),
      data: bytesToB64(cipher),
      createdAt: new Date().toISOString(),
    };
  }

  async function openVault(blob, passphrase) {
    if (!blob || blob.v !== VERSION || !blob.salt || !blob.iv || !blob.data) throw new Error("This vault cannot be read.");
    const key = await deriveKey(passphrase, b64ToBytes(blob.salt));
    let plain;
    try {
      plain = await subtle().decrypt({ name: "AES-GCM", iv: b64ToBytes(blob.iv) }, key, b64ToBytes(blob.data));
    } catch {
      throw new Error("Wrong passphrase. Try again.");
    }
    const parsed = JSON.parse(new TextDecoder().decode(plain));
    return { uid: String(parsed.uid || ""), password: String(parsed.password || "") };
  }

  function sessionStore() {
    try {
      const session = root.chrome?.storage?.session;
      if (session && typeof session.get === "function") return session;
    } catch {}
    return null;
  }

  async function sessionSet(creds) {
    const value = { ...creds, unlockedAt: Date.now(), until: Date.now() + AUTOLOCK_MS };
    const store = sessionStore();
    if (store) {
      try {
        await store.set({ [SESSION_KEY]: value });
        return value;
      } catch {}
    }
    memorySession = value;
    return value;
  }

  async function sessionGet() {
    const store = sessionStore();
    if (store) {
      try {
        const got = await store.get({ [SESSION_KEY]: null });
        const value = got?.[SESSION_KEY] || null;
        if (!value) return memorySession && memorySession.until > Date.now() ? memorySession : null;
        if (Number(value.until || 0) <= Date.now()) {
          try {
            await store.remove(SESSION_KEY);
          } catch {}
          return null;
        }
        return value;
      } catch {}
    }
    return memorySession && memorySession.until > Date.now() ? memorySession : null;
  }

  async function sessionClear() {
    memorySession = null;
    const store = sessionStore();
    if (store) {
      try {
        await store.remove(SESSION_KEY);
      } catch {}
    }
  }

  // Overlay helper for background/content: session credentials win, legacy
  // plaintext storage.local is the fallback so older saves keep working.
  // Supports both promise-style (MV3) and callback-style storage.get.
  async function effectiveCreds(storageLocal) {
    const session = await sessionGet().catch(() => null);
    if (session && (session.uid || session.password)) return { uid: session.uid, password: session.password, locked: false };
    try {
      let local = null;
      if (storageLocal && typeof storageLocal.get === "function") {
        try {
          const maybe = storageLocal.get({ uid: "", password: "", vault: null });
          if (maybe && typeof maybe.then === "function") local = await maybe;
          else if (maybe && typeof maybe === "object") local = maybe;
        } catch {}
        if (!local) {
          local = await new Promise((resolve) => {
            try {
              storageLocal.get({ uid: "", password: "", vault: null }, resolve);
            } catch {
              resolve(null);
            }
          });
        }
      }
      if (local && local.vault) return { uid: "", password: "", locked: true };
      return { uid: String(local?.uid || ""), password: String(local?.password || ""), locked: false };
    } catch {
      return { uid: "", password: "", locked: false };
    }
  }

  root.CuimsVault = {
    VERSION,
    AUTOLOCK_MS,
    SESSION_KEY,
    isAvailable() {
      try {
        subtle();
        return true;
      } catch {
        return false;
      }
    },
    createVault,
    openVault,
    sessionSet,
    sessionGet,
    sessionClear,
    effectiveCreds,
  };
})(globalThis);
