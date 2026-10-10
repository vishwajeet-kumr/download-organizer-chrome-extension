# tech_stack.md — Download Organizer Pro
## Technology Stack, File Structure & MV3 Constraints

---

## Stack Decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| Extension standard | Manifest V3 | Required for all new Chrome extensions — MV3 only |
| Language | Vanilla JavaScript (ES2022) | No build step, no bundler, no npm. Load unpacked and it runs. |
| Storage | chrome.storage.sync + chrome.storage.local | sync for settings/license, local for stats |
| Backend | Vercel Serverless Functions (Node.js 20) | Free tier, zero infra, deploys in one command |
| Backend language | JavaScript ES modules | Matches extension language, no transpilation needed |
| Package manager | None for extension. npm for Vercel function only if needed. | Keep it zero-dependency where possible |

---

## Complete File Structure

Build this exact structure. Every file listed must be created.

```
download-organizer-pro/
├── AGENTS.md                      ← index (already exists)
├── manifest.json                  ← MV3 manifest
├── background.js                  ← service worker: download interception + re-validation
├── popup.html                     ← popup UI: all 3 screens in one file
├── popup.js                       ← popup logic: settings, license, stats, navigation
├── privacy-policy.html            ← required by Chrome Web Store — deploy to Vercel
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── api/
│   └── validate-license.js        ← Vercel serverless function
└── vercel.json                    ← Vercel deployment config
```

When zipping for Chrome Web Store: exclude `api/` and `vercel.json`.

---

## Chrome Storage Schema

### chrome.storage.sync (syncs across user's Chrome profiles)
```js
{
  enabled: boolean,          // default: true
  isPro: boolean,            // default: false
  licenseKey: string | null, // default: null
  apiUrl: string,            // Vercel validate-license endpoint URL
  dateSubfolders: boolean,   // default: false — Pro only feature
  folderMap: {
    images: string,          // default: 'Images'
    videos: string,          // default: 'Videos'
    documents: string,       // default: 'Documents'
    audio: string,           // default: 'Music'
    archives: string,        // default: 'Archives'
    code: string             // default: 'Code'
  }
}
```

### chrome.storage.local (device only — for stats volume)
```js
{
  stats: {
    total: number,
    images: number,
    videos: number,
    documents: number,
    audio: number,
    archives: number,
    code: number
  }
}
```

---

## Environment Variables

These live in Vercel dashboard → Project Settings → Environment Variables.
Never hardcode them. Never commit them.

```
LEMON_SQUEEZY_API_KEY=       # From Lemon Squeezy → Settings → API → Create key
LEMON_SQUEEZY_STORE_ID=      # From Lemon Squeezy → Settings → Store → numeric ID
```

---

## MV3 Constraints — Read Before Writing background.js

These are the most common failure points. Violating any one of them causes silent failures.

**Constraint 1 — Service workers are not persistent.**
The background service worker can be killed by Chrome at any time and restarted on demand.
Never store state in JavaScript variables inside background.js.
All state must live in chrome.storage. On every event, read from storage first.

**Constraint 2 — onDeterminingFilename must return true.**
When using async callbacks inside this listener (which we always do for storage.get),
the listener must synchronously return true to keep the response channel open.
If it returns undefined (implicit), the suggest() call from inside the callback is ignored.
```js
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  chrome.storage.sync.get([...], (result) => {
    suggest({ filename: '...' }); // this only works because of the return below
  });
  return true; // REQUIRED — do not remove
});
```

**Constraint 3 — chrome.tabs.create is not available in service workers.**
Opening URLs (Lemon Squeezy checkout) must be done from popup.js, not background.js.

**Constraint 4 — Folder paths are relative to the user's Downloads directory.**
suggest({ filename: 'Images/photo.jpg' }) creates Downloads/Images/photo.jpg.
Do not construct absolute system paths. Chrome handles the Downloads root automatically.

**Constraint 5 — conflictAction: 'uniquify' is mandatory.**
Without it, a duplicate filename silently overwrites the existing file.
Always pass conflictAction: 'uniquify' in every suggest() call that specifies a filename.

**Constraint 6 — application/octet-stream must be excluded from MIME matching.**
This is the generic binary MIME type. It matches almost everything including executables.
Relying on it would misroute files. Always skip it and fall through to extension matching.

**Constraint 7 — chrome.alarms requires the 'alarms' permission in manifest.**
Add "alarms" to the permissions array if using chrome.alarms for re-validation.
Without it, chrome.alarms is undefined and throws silently.
