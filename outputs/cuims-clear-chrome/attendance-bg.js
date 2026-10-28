// Connects the attendance daemon to the browser: popup refreshes and the
// shared login guard. There is no timer: CUIMS only hears from the extension
// when the student uses the popup. Runs in the Firefox background page and in
// Chrome's service worker.

const CUIMS_ORIGINS = { origins: ["https://students.cuchd.in/*"] };

function startAttendanceBackground(solveCaptcha) {
  // Session overlay: when the vault is enabled, decrypted credentials live
  // only in storage.session (auto-cleared, never synced). The daemon prefers
  // them and treats a locked vault as "no login" instead of reading stale
  // plaintext. Legacy plaintext saves pass through unchanged. All offline.
  const vault = globalThis.CuimsVault;
  const baseGet = (defaults) => chrome.storage.local.get(defaults);
  const storage = {
    get: async (defaults) => {
      const local = await baseGet(defaults);
      if (!vault) return local;
      try {
        const creds = await vault.effectiveCreds(chrome.storage.local);
        if (creds.locked) return { ...local, uid: "", password: "" };
        if (creds.uid || creds.password) return { ...local, uid: creds.uid, password: creds.password };
      } catch {}
      return local;
    },
    set: (values) => chrome.storage.local.set(values),
  };
  const attendance = CuimsAttendance.createDaemon({
    storage,
    fetchImpl: (url, options) => fetch(url, options),
    solveCaptcha,
  });

  const hasAccess = () => chrome.permissions.contains(CUIMS_ORIGINS);

  // Only this extension's own pages. A content script's sender URL is the
  // web page it runs in.
  function fromExtensionPage(sender) {
    return sender?.id === chrome.runtime.id && String(sender.url || "").startsWith(chrome.runtime.getURL(""));
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "cuims-clear:attendance-refresh" || !fromExtensionPage(sender)) return;
    hasAccess()
      .then((granted) => {
        if (!granted) return { error: "The browser has switched off access to CUIMS. Use Allow access at the top.", code: "no-access" };
        return attendance.refresh("manual");
      })
      .then(sendResponse)
      .catch((error) => sendResponse({ error: String(error?.message || error), code: "network" }));
    return true;
  });

  // The student opened a leave page on CUIMS; its content script sends it.
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.type !== "cuims-clear:leave-page" || !/^https:\/\/students\.cuchd\.in\//i.test(String(sender?.url || sender?.tab?.url || ""))) return;
    if (sender?.id && sender.id !== chrome.runtime.id) return;
    attendance.ingestLeavePage(message.which, String(message.html || "")).catch(() => {});
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    // A changed UID or password lifts the "rejected login" pause.
    if (changes.uid || changes.password) {
      chrome.storage.local.get({ loginGuard: null }, ({ loginGuard }) => {
        if (loginGuard?.rejectedUid) chrome.storage.local.set({ loginGuard: { ...loginGuard, rejectedUid: "" } });
      });
    }
    // A CUIMS tab finished signing in after a refresh gave way to it.
    if (changes.sessionAlive?.newValue === true) {
      hasAccess()
        .then((granted) => (granted ? attendance.afterTabSignIn() : null))
        .catch(() => {});
    }
  });

  // lms-open.js asks for a signed-in session before it opens a tab.
  globalThis.cuimsEnsureSession = (options) =>
    hasAccess().then((granted) => (granted ? attendance.ensureSession(options) : { alive: false, reason: "no-access" }));

  return attendance;
}

// The captcha solver is plain JavaScript (captcha-solver.js), so it runs
// right here: Firefox's background page and Chrome's service worker alike.
startAttendanceBackground((bytes) => CuimsCaptcha.readBytes(bytes));
