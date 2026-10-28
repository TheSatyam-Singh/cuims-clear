import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../outputs/cuims-clear-firefox/vault.js", import.meta.url), "utf8");

test("the vault never touches the network", () => {
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|https?:\/\/|wss?:\/\//i);
});

function loadVault(sessionValue = null) {
  const sessionStore = new Map(sessionValue ? [["vaultSession", sessionValue]] : []);
  const context = vm.createContext({
    console,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    Buffer,
    chrome: {
      storage: {
        local: {
          get: (defaults, callback) => {
            const out = { ...defaults };
            if (typeof callback === "function") callback(out);
            return Promise.resolve(out);
          },
          set: () => {},
          remove: () => {},
        },
        session: {
          get: async (defaults) => {
            const out = { ...defaults };
            for (const [key, value] of sessionStore) out[key] = value;
            return out;
          },
          set: async (values) => {
            for (const [key, value] of Object.entries(values)) sessionStore.set(key, value);
          },
          remove: async (key) => {
            sessionStore.delete(key);
          },
        },
      },
    },
  });
  context.globalThis = context;
  vm.runInContext(source, context);
  return context.CuimsVault;
}

test("vault encrypts and decrypts offline with AES-GCM + PBKDF2", async () => {
  const vault = loadVault();
  assert.equal(vault.isAvailable(), true);
  const blob = await vault.createVault("24BCS10000", "secret-pass", "correct horse battery staple");
  assert.equal(blob.v, 1);
  assert.ok(blob.salt && blob.iv && blob.data);
  assert.doesNotMatch(JSON.stringify(blob), /secret-pass/);
  const creds = await vault.openVault(blob, "correct horse battery staple");
  assert.equal(creds.uid, "24BCS10000");
  assert.equal(creds.password, "secret-pass");
  await assert.rejects(() => vault.openVault(blob, "wrong passphrase here"), /Wrong passphrase/);
  await assert.rejects(() => vault.createVault("24BCS10000", "x", "short"), /at least 8/);
});

test("effective credentials prefer the session and report a locked vault", async () => {
  const vault = loadVault();
  const locked = await vault.effectiveCreds({
    get: (defaults, callback) => callback({ ...defaults, vault: { v: 1 } }),
  });
  assert.equal(locked.locked, true);
  assert.equal(locked.uid, "");
});
