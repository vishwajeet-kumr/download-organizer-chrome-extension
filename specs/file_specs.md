# file_specs.md — Download Organizer Pro

## Per-File Implementation Specifications

> Read this file when writing a specific file.
> Each section is self-contained. Read only the section for the file you are building.
> For design tokens → ui_spec.md | For Pro gates → monetization.md | For storage schema → tech_stack.md

---

## manifest.json

```json
{
  "manifest_version": 3,
  "name": "Download Organizer Pro",
  "version": "1.0.0",
  "description": "Automatically sorts every download into the right folder. Images, videos, documents — always in their place.",
  "permissions": ["downloads", "storage", "alarms"],
  "host_permissions": ["https://api.dodopayments.com/*"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Download Organizer Pro",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

---

## background.js

### Top-level constants (define once, at the top of the file)

```js
const DEFAULT_FOLDER_MAP = {
  images: 'Images', videos: 'Videos', documents: 'Documents',
  audio: 'Music', archives: 'Archives', code: 'Code',
};

const DEFAULT_STATS = {
  total: 0, images: 0, videos: 0, documents: 0,
  audio: 0, archives: 0, code: 0,
};

const FREE_CATEGORIES = ['images', 'videos', 'documents'];
const PRO_CATEGORIES  = ['audio', 'archives', 'code'];

const EXTENSION_MAP = {
  // Images
  jpg:'images', jpeg:'images', png:'images', gif:'images', webp:'images',
  svg:'images', bmp:'images', ico:'images', tiff:'images', tif:'images',
  avif:'images', heic:'images', raw:'images', psd:'images', ai:'images', eps:'images',
  // Videos
  mp4:'videos', avi:'videos', mov:'videos', mkv:'videos', webm:'videos',
  flv:'videos', wmv:'videos', m4v:'videos', '3gp':'videos', ogv:'videos',
  ts:'videos', vob:'videos', mpg:'videos', mpeg:'videos',
  // Documents
  pdf:'documents', doc:'documents', docx:'documents', xls:'documents', xlsx:'documents',
  ppt:'documents', pptx:'documents', txt:'documents', csv:'documents', odt:'documents',
  ods:'documents', odp:'documents', rtf:'documents', epub:'documents', md:'documents',
  pages:'documents', numbers:'documents', key:'documents', djvu:'documents',
  // Audio
  mp3:'audio', wav:'audio', flac:'audio', aac:'audio', ogg:'audio',
  m4a:'audio', wma:'audio', opus:'audio', aiff:'audio', alac:'audio',
  mid:'audio', midi:'audio',
  // Archives
  zip:'archives', rar:'archives', '7z':'archives', tar:'archives', gz:'archives',
  bz2:'archives', xz:'archives', dmg:'archives', iso:'archives', pkg:'archives',
  deb:'archives', rpm:'archives', cab:'archives', z:'archives', lz:'archives',
  // Code
  js:'code', jsx:'code', ts:'code', tsx:'code', py:'code', html:'code',
  css:'code', json:'code', xml:'code', php:'code', java:'code', c:'code',
  cpp:'code', h:'code', go:'code', rs:'code', rb:'code', sh:'code',
  yml:'code', yaml:'code', toml:'code', sql:'code', swift:'code', kt:'code',
  dart:'code', vue:'code',
};

const MIME_RULES = [
  { prefix: 'image/',                                         category: 'images'    },
  { prefix: 'video/',                                         category: 'videos'    },
  { prefix: 'audio/',                                         category: 'audio'     },
  { prefix: 'application/pdf',                                category: 'documents' },
  { prefix: 'application/msword',                             category: 'documents' },
  { prefix: 'application/vnd.openxmlformats-officedocument',  category: 'documents' },
  { prefix: 'application/vnd.ms-excel',                       category: 'documents' },
  { prefix: 'application/vnd.ms-powerpoint',                  category: 'documents' },
  { prefix: 'application/vnd.oasis.opendocument',             category: 'documents' },
  { prefix: 'application/rtf',                                category: 'documents' },
  { prefix: 'application/epub+zip',                           category: 'documents' },
  { prefix: 'application/zip',                                category: 'archives'  },
  { prefix: 'application/x-rar-compressed',                   category: 'archives'  },
  { prefix: 'application/x-7z-compressed',                    category: 'archives'  },
  { prefix: 'application/gzip',                               category: 'archives'  },
  { prefix: 'application/x-tar',                              category: 'archives'  },
  { prefix: 'text/javascript',                                 category: 'code'      },
  { prefix: 'text/typescript',                                 category: 'code'      },
  { prefix: 'text/html',                                       category: 'code'      },
  { prefix: 'text/css',                                        category: 'code'      },
  { prefix: 'text/x-python',                                   category: 'code'      },
  { prefix: 'application/x-sh',                                category: 'code'      },
  { prefix: 'application/json',                                category: 'code'      },
  { prefix: 'application/xml',                                 category: 'code'      },
  { prefix: 'text/xml',                                        category: 'code'      },
];
```

### Helper functions

```
getCategoryFromMime(mimeType)
  - If mimeType is falsy or === 'application/octet-stream' → return null
  - Normalise: mimeType.toLowerCase().split(';')[0].trim()
  - Loop MIME_RULES, return category on first prefix match
  - Return null if no match

getCategoryFromExtension(filename)
  - If filename is falsy → return null
  - Split by '.', take last segment, lowercase
  - Return EXTENSION_MAP[ext] ?? null

getBasename(filepath)
  - Split by /[\\/]/, return last non-empty segment

getDatePath()
  - const now = new Date()
  - return `${now.getFullYear()}/${now.toLocaleString('en-US', { month: 'long' })}`
  - e.g. '2026/October'
```

### chrome.runtime.onInstalled handler

```
1. chrome.storage.sync.get(['enabled', 'isPro', 'licenseKey', 'folderMap', 'dateSubfolders', 'apiUrl'])
2. Build updates object with only keys that are undefined (never overwrite existing settings)
3. Defaults: enabled=true, isPro=false, licenseKey=null, dateSubfolders=false, apiUrl='', folderMap=DEFAULT_FOLDER_MAP
4. If updates has any keys → chrome.storage.sync.set(updates)
5. chrome.storage.local.get(['stats']) → if !stats → chrome.storage.local.set({ stats: DEFAULT_STATS })
6. chrome.alarms.create('revalidate-license', { periodInMinutes: 10080 }) (7 days)
```

### chrome.alarms.onAlarm handler

```
1. If alarm.name !== 'revalidate-license' → return
2. chrome.storage.sync.get(['licenseKey', 'apiUrl'])
3. If !licenseKey || !apiUrl → return
4. fetch(apiUrl, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ licenseKey }) })
5. If response ok → response.json() → if data.valid → chrome.storage.sync.set({ isPro: true })
6. If response not ok OR data.valid === false → do nothing (offline grace period, do not revoke)
7. Wrap in try/catch → on error do nothing
```

### chrome.downloads.onDeterminingFilename listener

```
1. Read from chrome.storage.sync: ['enabled', 'isPro', 'folderMap', 'dateSubfolders']
2. If !enabled → suggest() → return
3. Merge folderMap with DEFAULT_FOLDER_MAP as fallback
4. category = getCategoryFromMime(item.mime) ?? getCategoryFromExtension(item.filename)
5. If !category → suggest() → return
6. If PRO_CATEGORIES.includes(category) && !isPro → suggest() → return
7. folderName = mergedFolderMap[category]
8. If isPro && dateSubfolders → folderName = folderName + '/' + getDatePath()
9. basename = getBasename(item.filename)
10. suggest({ filename: folderName + '/' + basename, conflictAction: 'uniquify' })
11. If isPro → increment stats in chrome.storage.local (read → increment total + category → write back)
IMPORTANT: return true at the end of the listener (not inside the callback)
```

---

## popup.html

Single file. Inline all CSS. No external CDNs. Reference only popup.js.
See ui_spec.md for all colors, dimensions, and component CSS.

### HTML structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Download Organizer Pro</title>
  <style>/* all CSS inline here — see ui_spec.md for tokens */</style>
</head>
<body>
  <!-- Screen 1: Main -->
  <div id="screen-main">
    <!-- header: title + toggle -->
    <!-- plan banner: free or pro -->
    <!-- folder rows: 6 inputs with emoji + label + input + optional lock -->
    <!-- date subfolder checkbox -->
    <!-- action buttons: Save, Activate License, View Stats -->
  </div>

  <!-- Screen 2: Stats -->
  <div id="screen-stats" hidden>
    <!-- back link -->
    <!-- total count -->
    <!-- per-category rows -->
    <!-- reset button -->
  </div>

  <!-- Screen 3: License -->
  <div id="screen-license" hidden>
    <!-- back link -->
    <!-- two pricing buttons -->
    <!-- divider -->
    <!-- license key input -->
    <!-- activate button -->
    <!-- error message (hidden) -->
    <!-- success message (hidden) -->
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script src="popup.js"></script>
</body>
</html>
```

Build the full HTML per the screen layouts in ui_spec.md.
Every input must have `data-category` attribute matching the category key (images, videos, etc).

---

## popup.js

### Constants (at top of file)

```js
const DODO_URLS = {
  oneTime: 'REPLACE_WITH_DODO_ONETIME_CHECKOUT_URL',
  monthly: 'REPLACE_WITH_DODO_MONTHLY_CHECKOUT_URL',
};
const VALIDATION_API_URL = 'REPLACE_WITH_VERCEL_URL/api/validate-license';

const DEFAULT_FOLDER_MAP = {
  images: 'Images', videos: 'Videos', documents: 'Documents',
  audio: 'Music', archives: 'Archives', code: 'Code',
};
const PRO_CATEGORIES = ['audio', 'archives', 'code'];
```

### Functions to implement (all fully, no stubs)

```
showScreen(screenId)
  - Hide all screens (screen-main, screen-stats, screen-license) via hidden attribute
  - Remove hidden from the screen matching screenId

showToast(message, durationMs = 2000)
  - Set toast text content to message
  - Add 'visible' class
  - setTimeout to remove 'visible' after durationMs
  - Clear any previous timer before setting new one

renderProState(isPro)
  - Show/hide plan banner based on isPro
  - If isPro: unlock all inputs, uncheck lock badges, show stats button
  - If !isPro: lock PRO_CATEGORIES inputs (opacity 0.4, pointer-events none), show lock badges

loadSettings()
  - chrome.storage.sync.get(['enabled', 'isPro', 'folderMap', 'dateSubfolders'])
  - Set toggle checked state from enabled
  - Set folder input values from folderMap (fall back to DEFAULT_FOLDER_MAP per key)
  - Set dateSubfolders checkbox state
  - Call renderProState(isPro)

getFolderMapFromInputs()
  - querySelectorAll('[data-category]')
  - For each: { [el.dataset.category]: el.value.trim() || DEFAULT_FOLDER_MAP[el.dataset.category] }
  - Return the resulting object

handleSave()
  - chrome.storage.sync.set({ folderMap: getFolderMapFromInputs(), dateSubfolders: checkbox.checked })
  - showToast('Settings saved ✓')

handleToggle()
  - chrome.storage.sync.set({ enabled: toggle.checked })

handleActivateLicense()
  - Read license key input value, trim it
  - If empty → show error 'Please enter a license key'
  - Set button text to 'Validating…', disable button
  - fetch VALIDATION_API_URL with POST { licenseKey }
  - On success { valid: true }: chrome.storage.sync.set({ isPro: true, licenseKey }) → renderProState(true) → show success message → showToast('Pro activated!')
  - On { valid: false }: show error message 'Invalid or expired license key'
  - On network error: show error message 'Could not connect. Check your internet.'
  - Always restore button text and re-enable button in finally block

loadStats()
  - chrome.storage.local.get(['stats'])
  - Populate each stat element by id
  - If stats is null/undefined → show zeros

handleResetStats()
  - chrome.storage.local.set({ stats: { total:0, images:0, videos:0, documents:0, audio:0, archives:0, code:0 } })
  - loadStats()
  - showToast('Stats reset')
```

### Event wiring (at bottom of file, outside all functions)

```js
document.addEventListener('DOMContentLoaded', loadSettings);
toggleEl.addEventListener('change', handleToggle);
saveBtn.addEventListener('click', handleSave);
activateBtn.addEventListener('click', handleActivateLicense);
resetStatsBtn.addEventListener('click', handleResetStats);
// Navigation links
document.getElementById('nav-to-license').addEventListener('click', () => showScreen('screen-license'));
document.getElementById('nav-to-stats').addEventListener('click', () => { loadStats(); showScreen('screen-stats'); });
document.getElementById('back-from-stats').addEventListener('click', () => showScreen('screen-main'));
document.getElementById('back-from-license').addEventListener('click', () => showScreen('screen-main'));
// Dodo Payments buttons
document.getElementById('btn-onetime').addEventListener('click', () => chrome.tabs.create({ url: DODO_URLS.oneTime }));
document.getElementById('btn-monthly').addEventListener('click', () => chrome.tabs.create({ url: DODO_URLS.monthly }));
```

---

## api/validate-license.js

```
Export default async function handler(req, res)

CORS headers — set on every response before anything else:
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

If req.method === 'OPTIONS' → res.status(200).end() → return

If req.method !== 'POST' → res.status(405).json({ valid: false }) → return

Extract licenseKey from req.body
If !licenseKey or typeof licenseKey !== 'string' or licenseKey.trim() === ''
  → res.status(400).json({ valid: false }) → return

try {
  const dodoResponse = await fetch('https://api.dodopayments.com/licenses/validate', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
    },
    body: JSON.stringify({ license_key: licenseKey.trim() }),
  })

  if (!dodoResponse.ok) → res.status(200).json({ valid: false }) → return

  const data = await dodoResponse.json()

  if (process.env.DODO_WEBHOOK_SECRET) {
    if (data.store_id && String(data.store_id) !== String(process.env.DODO_WEBHOOK_SECRET))
      → res.status(200).json({ valid: false }) → return
  }

  const isValid = data.valid === true || data.status === 'active'
  if (!isValid)
    → res.status(200).json({ valid: false }) → return

  const variantName = data.meta?.variant_name || data.variant_name || data.product_name || data.plan || ''
  const plan = variantName.toLowerCase().includes('month') ? 'monthly' : 'onetime'

  res.status(200).json({ valid: true, plan })

} catch (err) {
  res.status(500).json({ valid: false, error: 'Validation failed' })
}
```

---

## vercel.json

```json
{
  "version": 2,
  "functions": {
    "api/validate-license.js": {
      "maxDuration": 10
    }
  }
}
```

CORS headers are set inside the function itself — no need for headers config in vercel.json.

---

## privacy-policy.html

A static HTML page. Apply the same #353545 theme from ui_spec.md.
Host it on Vercel alongside the API (place in project root as a static file).

### Required content sections

1. **What we collect:**
   - Download filenames — processed locally in the browser, never sent to our servers
   - Folder preferences — stored in chrome.storage.sync (Google's infrastructure)
   - License key — sent to our server only during activation and 7-day re-validation

2. **What we do NOT collect:**
   - Browsing history
   - URLs you visit
   - File contents
   - Any personally identifiable information

3. **Third parties:**
   - Dodo Payments (dodopayments.com) — payment processing and license validation
   - Google Chrome sync — stores your folder preferences across Chrome profiles

4. **Data retention:**
   - License key stored locally in your browser extension storage
   - No data is retained on our servers

5. **Contact:**
   - [YOUR EMAIL ADDRESS]

6. **Last updated:** [DATE]
