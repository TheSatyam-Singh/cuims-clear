# CUIMS Glass Privacy

CUIMS Glass processes portal data on your device to help you sign in to CUIMS,
reduce interruptions, and navigate LMS courses. The developer does not receive,
sell, or share your personal data. There is no developer-operated server,
analytics, advertising, or remote executable code. Nothing is uploaded to any
cloud or external server: the only network requests the extension makes are to
the university's own `https://students.cuchd.in/*` and `https://lms.cuchd.in/*`
using your existing signed-in session.

## Login and preferences

Saving a login in the extension popup stores your student UID and CUIMS password
on this device. Saving credentials is optional. Use Clear login in the popup to
remove them, or uninstall the extension to remove its local storage.

**Optional encrypted vault (recommended).** The Login and Settings tabs offer an
encrypted vault: your UID and password are encrypted with AES-GCM-256 using a
key derived from your passphrase (PBKDF2-SHA256, 250,000 iterations). Only the
ciphertext is kept in extension local storage. The key and decrypted values
live only in memory and session storage, which the browser clears when it
closes, and the vault auto-locks after 15 minutes. The passphrase never leaves
your device and cannot be recovered. All encryption runs locally with WebCrypto;
no data is sent anywhere to enable it.

Without the vault, saved values are stored unencrypted in extension local
storage and are readable by anyone with access to this browser profile. They
are never synchronized through sync services by the extension.

The extension fills saved credentials into the university login form and can
advance or submit it according to your automation settings. Credentials are
submitted to the university's CUIMS service as part of login, not to the developer.
You can instead enter credentials directly on the portal without saving them.
The browser's own password manager is managed separately by the browser.

Local storage also holds login automation, quiet-mode, and LMS-view preferences.
Temporary login-attempt counters are kept in the portal tab's session storage;
they do not contain credentials.

## On-device page processing

CAPTCHA images and text are processed locally by the extension's own
JavaScript. Images are not uploaded.
The extension reads page text and structure to hide optional event and feedback
overlays and to organize LMS course names and links. This content is not sent
to the developer or saved in extension storage.

When you select Open CUIMS or Open LMS, the extension checks your CUIMS session
and, if it has ended, signs in with your saved UID and password in the background
(unlock the vault first when it is enabled).
For the LMS it makes the university's own CU LMS request and opens the LMS URL
CUIMS returns, or opens CUIMS and uses its CU LMS control. SSO URLs and tokens are
not saved in extension storage. The LMS course directory may fetch
additional same-origin /my/courses.php pages using your existing university
session to pair syllabus materials with semester work.

## Attendance

When you use the Attendance tab, the extension reads your own attendance report,
timetable, and duty and medical leave applications from CUIMS with your browser's CUIMS session, signing in with your
saved UID and password in the background when needed. It talks to CUIMS only when
you use the popup; nothing runs in the background on a timer. Attendance figures are
stored only in extension local storage on this device and are removed by Clear login.

Access is limited to https://students.cuchd.in/* and https://lms.cuchd.in/*.
The extension does not maintain a browsing-history record. Its content security
policy allows scripts only from itself (`script-src 'self'`); there is no
remote code.

## Limited use

Data is used only to provide the portal features described above, in accordance
with the Chrome Web Store User Data Policy, including its Limited Use
requirements. It is not used for advertising, unrelated purposes, creditworthiness,
or lending. The developer does not have access to your portal data.

Contact: arshgill6120@gmail.com

Last updated: 8 October 2026 (0.10.0: encrypted vault, 32 themes, redesigned popup).
