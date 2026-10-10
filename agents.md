# AGENTS.md — Download Organizer Pro
## Spec-Driven Development Document for AI IDE Agent

> **READ THIS FIRST.**
> This file is the single source of truth for this entire project.
> Read it completely before writing a single line of code.
> Build in the exact phase order specified. Do not skip phases.
> Do not invent features not listed here. Do not ask clarifying questions — all decisions are made.

---

## 1. WHAT WE ARE BUILDING

**Product Name:** Download Organizer Pro
**Type:** Chrome Browser Extension (Manifest V3)
**Tagline:** "Every download, in its place. Automatically."

### The Problem
Chrome dumps every single download — images, PDFs, videos, ZIP files — into one flat Downloads folder. Users waste time manually sorting files. Power users download hundreds of files per week.

### The Solution
A Chrome Extension that intercepts every download the moment Chrome starts it, detects the file type using MIME type + file extension, and automatically routes it into the correct subfolder inside the user's Downloads directory. Zero clicks. Zero friction. It just works.

### Who It's For
- Students who download lecture slides, videos, and assignments daily
- Designers who download reference images, fonts, and assets constantly
- Professionals who manage PDFs, spreadsheets, and reports
- Anyone who has ever opened their Downloads folder and felt overwhelmed

---

## 2. MONETIZATION MODEL

### Pricing
| Plan | Price | Type | What It Unlocks |
|------|-------|------|-----------------|
| Free | $0 | Forever free | Core auto-sort for Images, Videos, Documents |
| Pro One-Time | $4.99 | Lifetime license | All features, forever, no subscription |
| Pro Monthly | $1.99/month | Recurring subscription | All features, cancel anytime |

### Payment Processor
**Lemon Squeezy** — handles USD payments, international VAT, Indian GST compliance, and license key generation automatically.

- One-Time product: $4.99 → generates a license key on purchase
- Subscription product: $1.99/month → generates a license key, revokes on cancellation
- Both plans deliver the same Pro features — pricing choice only

### License Validation Architecture
```
User enters license key in popup
→ Extension sends key to Vercel API endpoint
→ API calls Lemon Squeezy /v1/licenses/validate
→ Returns { valid: boolean, plan: 'onetime' | 'monthly' }
→ Extension stores result in chrome.storage.sync
→ Pro features unlock immediately
→ Extension re-validates every 7 days silently in background
```

### Free vs Pro Feature Gate
| Feature | Free | Pro |
|---------|------|-----|
| Auto-sort: Images, Videos, Documents | ✅ | ✅ |
| Auto-sort: Audio, Archives, Code | ❌ | ✅ |
| Custom folder names | ❌ | ✅ |
| Date-based subfolders (Images/2026/Oct/) | ❌ | ✅ |
| Stats: total files sorted, by category | ❌ | ✅ |
| Priority email support | ❌ | ✅ |

---

## 3. TECH STACK

### Extension
- **Manifest Version:** 3 (MV3) — required for all new Chrome extensions
- **Language:** Vanilla JavaScript (ES2022) — no build step, no bundler, no npm required
- **Storage:** `chrome.storage.sync` for settings + license; `chrome.storage.local` for stats
- **Key APIs:** `chrome.downloads.onDeterminingFilename`, `chrome.storage`, `chrome.runtime`

### License Validation Backend
- **Runtime:** Vercel Serverless Functions (Node.js 20)
- **Language:** JavaScript (ES modules)
- **External API:** Lemon Squeezy REST API v1
- **Deploy:** Vercel free tier — zero cost

### UI Design System
```
Background Primary:    #353545
Background Secondary:  #2a2a3a
Background Card:       #1e1e2e
Accent Primary:        #6366f1  (indigo)
Accent Hover:          #4f46e5
Accent Active:         #4338ca
Success:               #22c55e
Error:                 #ef4444
Warning:               #f59e0b
Text Primary:          #ffffff
Text Secondary:        #94a3b8
Text Muted:            #475569
Border:                #1a1a26
Border Focus:          #6366f1
Border Radius:         8px (cards), 6px (inputs), 20px (pills/badges)
Font:                  -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Popup Width:           340px
```

---

## 4. PROJECT FILE STRUCTURE

Build this exact structure. Every file listed below must be created.

```
download-organizer-pro/
├── manifest.json                  # MV3 manifest — extension config
├── background.js                  # Service worker — download interception + license re-validation
├── popup.html                     # Popup UI shell
├── popup.js                       # Popup logic — settings, license activation, stats
├── icons/
│   ├── icon16.png                 # 16×16 extension icon
│   ├── icon32.png                 # 32×32 extension icon
│   ├── icon48.png                 # 48×48 extension icon
│   └── icon128.png                # 128×128 store icon
├── api/
│   └── validate-license.js        # Vercel serverless function
├── vercel.json                    # Vercel deployment config
└── privacy-policy.html            # Required by Chrome Web Store
```

---

## 5. COMPLETE FILE SPECIFICATIONS

### 5.1 manifest.json

```json
{
  "manifest_version": 3,
  "name": "Download Organizer Pro",
  "version": "1.0.0",
  "description": "Automatically sorts every download into the right folder. Images, videos, documents — always in their place.",
  "permissions": ["downloads", "storage"],
  "host_permissions": ["https://api.lemonsqueezy.com/*"],
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

### 5.2 background.js

This is the core logic file. Build it with these exact requirements:

**Constants:**
```
DEFAULT_FOLDER_MAP = {
  images: 'Images',
  videos: 'Videos',
  documents: 'Documents',
  audio: 'Music',
  archives: 'Archives',
  code: 'Code'
}

FREE_CATEGORIES = ['images', 'videos', 'documents']
PRO_CATEGORIES  = ['audio', 'archives', 'code']
```

**Extension-to-category map — every extension listed here:**
```
Images:    jpg, jpeg, png, gif, webp, svg, bmp, ico, tiff, tif, avif, heic, raw, psd, ai, eps
Videos:    mp4, avi, mov, mkv, webm, flv, wmv, m4v, 3gp, ogv, ts, vob, mpg, mpeg
Documents: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, odt, ods, odp, rtf, epub, md, pages, numbers, key, djvu
Audio:     mp3, wav, flac, aac, ogg, m4a, wma, opus, aiff, alac, mid, midi
Archives:  zip, rar, 7z, tar, gz, bz2, xz, dmg, iso, pkg, deb, rpm, cab, z, lz
Code:      js, jsx, ts, tsx, py, html, css, json, xml, php, java, c, cpp, h, go, rs, rb, sh, yml, yaml, toml, sql, swift, kt, dart, vue, env, gitignore, dockerfile
```

**MIME rules — check MIME first, extension second. Exclude application/octet-stream.**

**Date subfolder logic (Pro only):**
- When `dateSubfolders` setting is enabled
- Append `/{year}/{monthName}` to the folder path
- Example: `Images/2026/October/photo.png`
- Get year and month from `new Date()` at time of download

**Stats tracking (Pro only):**
- On every successful sort, read `chrome.storage.local` key `stats`
- Increment `stats.total` and `stats[category]`
- Write back to `chrome.storage.local`
- Stats object shape: `{ total: 0, images: 0, videos: 0, documents: 0, audio: 0, archives: 0, code: 0 }`

**License re-validation:**
- On `chrome.alarms.onAlarm` for alarm named `'revalidate-license'`
- Read `licenseKey` from `chrome.storage.sync`
- If key exists, POST to the Vercel API endpoint stored in `chrome.storage.sync` as `apiUrl`
- On success update `isPro` in `chrome.storage.sync`
- On failure do nothing — don't revoke offline (grace period)

**onInstalled:**
- Set defaults only if keys don't already exist
- Create alarm: `chrome.alarms.create('revalidate-license', { periodInMinutes: 10080 })` (7 days)

**onDeterminingFilename listener:**
- Must `return true` (async)
- Read `enabled`, `isPro`, `folderMap`, `dateSubfolders` from `chrome.storage.sync`
- If not enabled: `suggest()` and return
- Detect category from MIME then extension
- If category is in `PRO_CATEGORIES` and `isPro` is false: `suggest()` and return (silently skip, don't block)
- Build the final path: `folderName/basename` or `folderName/year/monthName/basename`
- Call `suggest({ filename: finalPath, conflictAction: 'uniquify' })`
- Track stats if isPro

---

### 5.3 popup.html

Single HTML file. Inline all CSS. Reference only `popup.js`. No external CDNs.

**Layout — 3 screens rendered as sections, shown/hidden with JS:**

**Screen 1: Main (default view)**
```
┌─────────────────────────────────┐  background: #353545
│  [icon] Download Organizer Pro  │
│         [ON/OFF toggle]         │
├─────────────────────────────────┤
│  FREE PLAN  [Upgrade to Pro →]  │  or  PRO PLAN ✓  if isPro
├─────────────────────────────────┤
│  SORTING FOLDERS                │
│  🖼 Images     [Images    ]     │  always shown (free)
│  🎬 Videos     [Videos    ]     │  always shown (free)
│  📄 Documents  [Documents ]     │  always shown (free)
│  🎵 Music      [Music  🔒 ]     │  locked if free
│  📦 Archives   [Archives🔒]     │  locked if free
│  💻 Code       [Code    🔒]     │  locked if free
├─────────────────────────────────┤
│  [ ] Date subfolders (Pro)      │  checkbox, locked if free
├─────────────────────────────────┤
│  [Save Settings]                │
│  [Enter License Key]            │
└─────────────────────────────────┘
```

**Screen 2: Stats (Pro only — shown as a tab or link from main)**
```
┌─────────────────────────────────┐
│  ← Back     STATS               │
├─────────────────────────────────┤
│  Total files sorted: 247        │
│                                 │
│  🖼 Images      124             │
│  🎬 Videos       38             │
│  📄 Documents    55             │
│  🎵 Music        12             │
│  📦 Archives     10             │
│  💻 Code          8             │
├─────────────────────────────────┤
│  [Reset Stats]                  │
└─────────────────────────────────┘
```

**Screen 3: License Activation**
```
┌─────────────────────────────────┐
│  ← Back     ACTIVATE PRO        │
├─────────────────────────────────┤
│  Upgrade to Pro                 │
│                                 │
│  [$4.99 One-Time]  [$1.99/mo]   │  buttons → open Lemon Squeezy
│                                 │
│  Already have a key?            │
│  [____________________]  input  │
│  [Activate License]             │
│                                 │
│  [error message if invalid]     │
└─────────────────────────────────┘
```

**Locked input style:**
- Input has `opacity: 0.4`, `cursor: not-allowed`, `pointer-events: none`
- Show a 🔒 icon or small "PRO" pill badge to the right of the input

**Design rules:**
- Background: `#353545` everywhere
- All text: white or `#94a3b8` for secondary
- Inputs: background `#2a2a3a`, border `#1a1a26`, focus border `#6366f1`
- Buttons: `#6366f1` primary, white text
- Popup width: `340px`, no fixed height (grows with content)
- Padding: `16px` everywhere
- All transitions: `0.15s ease`
- Toast notification on save: fixed bottom, `#22c55e` green background

---

### 5.4 popup.js

**LEMON_SQUEEZY_URLS constant at top of file:**
```js
const LEMON_SQUEEZY_URLS = {
  oneTime: 'REPLACE_WITH_LEMON_SQUEEZY_ONETIME_CHECKOUT_URL',
  monthly: 'REPLACE_WITH_LEMON_SQUEEZY_MONTHLY_CHECKOUT_URL',
};

const VALIDATION_API_URL = 'REPLACE_WITH_VERCEL_API_URL/api/validate-license';
```

**On load:**
1. Read all settings from `chrome.storage.sync`
2. Render correct UI state (free vs pro, enabled/disabled)
3. Populate folder inputs from stored `folderMap`
4. Load stats from `chrome.storage.local` if isPro

**Save button:**
1. Read all input values
2. Trim whitespace, fall back to defaults for empty values
3. Write to `chrome.storage.sync`
4. Show toast "Settings saved ✓"

**Toggle:**
- Immediately write `enabled` to `chrome.storage.sync` on change

**License activation flow:**
1. User clicks "Activate License"
2. Show loading state on button ("Validating…")
3. POST license key to `VALIDATION_API_URL`
4. On success `{ valid: true }`: write `{ isPro: true, licenseKey: key }` to `chrome.storage.sync`, re-render UI to Pro state, show success message
5. On failure: show red error message "Invalid or expired license key"
6. Always restore button text after response

**Lemon Squeezy buttons:**
- One-Time button → `chrome.tabs.create({ url: LEMON_SQUEEZY_URLS.oneTime })`
- Monthly button → `chrome.tabs.create({ url: LEMON_SQUEEZY_URLS.monthly })`

**Stats screen:**
- Read from `chrome.storage.local` key `stats`
- Display each category count and total
- Reset button: write zeroed stats object back to storage, re-render

**Navigation:**
- `showScreen(screenId)` function that hides all screens, shows target
- Screens: `'main'`, `'stats'`, `'license'`

---

### 5.5 api/validate-license.js (Vercel Serverless Function)

```
Method:  POST
Path:    /api/validate-license
Body:    { licenseKey: string }
Returns: { valid: boolean, plan: 'onetime' | 'monthly' | null, error?: string }
```

**Logic:**
1. Parse body, extract `licenseKey`
2. Validate `licenseKey` is a non-empty string, matches UUID format
3. POST to `https://api.lemonsqueezy.com/v1/licenses/validate` with `{ license_key: licenseKey }`
4. Authorization header: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`
5. If response `meta.store_id` doesn't match `process.env.LEMON_SQUEEZY_STORE_ID` → return `{ valid: false }`
6. If `data.attributes.status !== 'active'` → return `{ valid: false }`
7. Determine plan from `data.attributes.meta.variant_name`:
   - Contains 'Monthly' or 'month' → `plan: 'monthly'`
   - Otherwise → `plan: 'onetime'`
8. Return `{ valid: true, plan }`
9. Wrap in try/catch — on any error return `{ valid: false, error: 'Validation failed' }` with status 500
10. Set CORS headers: `Access-Control-Allow-Origin: *`

**Environment variables required:**
```
LEMON_SQUEEZY_API_KEY=your_api_key_here
LEMON_SQUEEZY_STORE_ID=your_store_id_here
```

---

### 5.6 vercel.json

```json
{
  "version": 2,
  "functions": {
    "api/validate-license.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

---

### 5.7 privacy-policy.html

Required by Chrome Web Store. Must be hosted publicly.

**Content to include:**
- What data is collected: download filenames (processed locally, never sent anywhere), folder preferences (stored in chrome.storage.sync — synced to your Google account, not our servers), license key (sent to our validation API only)
- What is NOT collected: browsing history, URLs, file contents, personal information
- License validation: key is sent to our server only to verify validity — not stored or logged
- Analytics: none
- Third parties: Lemon Squeezy (payment processor) for license validation only
- Contact email: placeholder for developer email
- Style with the same `#353545` theme

---

## 6. BUILD PHASES — EXECUTE IN ORDER

### PHASE 1 — Core Extension (No Monetization)
**Goal:** A working extension that sorts downloads. Test this manually before moving on.

Tasks:
1. Create `download-organizer-pro/` folder
2. Create `manifest.json` per spec 5.1
3. Create `background.js` — FREE categories only first (images, videos, documents), no Pro logic yet
4. Create `popup.html` + `popup.js` — main screen only, no license screen yet
5. Create placeholder icons (even 1px PNGs at correct sizes so extension loads)
6. Load in Chrome: `chrome://extensions` → Developer mode → Load unpacked
7. Verify: download a JPG → goes to `Images/`, download a PDF → goes to `Documents/`, download an MP4 → goes to `Videos/`

### PHASE 2 — Full Extension with Pro Feature Gates
**Goal:** Complete background.js with all categories, date subfolders, stats tracking, and Pro gates.

Tasks:
1. Expand `background.js` with all 6 categories and full extension map
2. Add Pro gate logic (check `isPro` from storage before routing PRO_CATEGORIES)
3. Add date subfolder logic (Pro only)
4. Add stats tracking (Pro only)
5. Add license re-validation alarm
6. Complete `popup.html` with all 3 screens
7. Complete `popup.js` with all interactions
8. Test: verify free plan blocks audio/archives/code routing
9. Test: verify settings persist across popup close/open

### PHASE 3 — Vercel License API
**Goal:** Working backend that validates Lemon Squeezy license keys.

Tasks:
1. Create `api/validate-license.js` per spec 5.5
2. Create `vercel.json` per spec 5.6
3. Deploy to Vercel: `vercel deploy --prod`
4. Set environment variables in Vercel dashboard
5. Update `VALIDATION_API_URL` in `popup.js` with live Vercel URL
6. Test the API directly with curl:
   ```
   curl -X POST https://your-api.vercel.app/api/validate-license \
     -H "Content-Type: application/json" \
     -d '{"licenseKey":"test-key-123"}'
   ```

### PHASE 4 — Lemon Squeezy Products
**Goal:** Create the two products and wire up checkout URLs.

Tasks:
1. Create Lemon Squeezy account at lemonsqueezy.com
2. Create Store, set currency to USD
3. Create Product: "Download Organizer Pro — Lifetime" at $4.99 (one-time)
4. Create Product: "Download Organizer Pro — Monthly" at $1.99/month (subscription)
5. Enable "License Keys" on both products in Lemon Squeezy settings
6. Copy checkout URLs for both products
7. Update `LEMON_SQUEEZY_URLS` in `popup.js` with real URLs
8. Get API key from Lemon Squeezy Settings → API → Create key
9. Add API key to Vercel environment variables
10. Test full purchase flow: buy test product → receive license key → paste in extension → Pro unlocks

### PHASE 5 — Chrome Web Store Submission
**Goal:** Extension live in the Store.

Tasks:
1. Create real icons at all 4 sizes (use Figma or any tool)
2. Create 3 screenshots at 1280×800 showing: popup UI, Downloads folder before, Downloads folder after
3. Create `privacy-policy.html` per spec 5.7
4. Host privacy policy — push to GitHub and use GitHub Pages, or deploy as a Vercel static page
5. Pay $5 Chrome Web Store developer fee at chrome.google.com/webstore/devconsole
6. Create new item, upload ZIP of `download-organizer-pro/` folder (without `api/` and `vercel.json`)
7. Fill in store listing:
   - **Name:** Download Organizer Pro
   - **Short description (132 chars max):** Auto-sort every download into the right folder. Images, videos, documents, music — always in their place. Instant. Automatic. Free.
   - **Category:** Productivity
   - **Privacy Policy URL:** your hosted URL
8. Submit for review — expect 1–3 business days

---

## 7. ENVIRONMENT VARIABLES MASTER LIST

```
# Vercel API
LEMON_SQUEEZY_API_KEY=           # From Lemon Squeezy → Settings → API
LEMON_SQUEEZY_STORE_ID=          # From Lemon Squeezy → Settings → Store → ID
```

---

## 8. POST-LAUNCH GROWTH CHECKLIST

These are NOT part of the build. Do these after the Store listing is live:

- [ ] Post on Reddit: r/productivity, r/chrome, r/webdev (show before/after Downloads folder)
- [ ] Post on Product Hunt as a new product launch
- [ ] Create a 60-second demo video for Twitter/X and LinkedIn
- [ ] Add extension to extension directories: alternativeto.net, extensiondirectory.com
- [ ] Respond to every Chrome Web Store review — drives ranking
- [ ] Track installs in Chrome Developer Dashboard weekly
- [ ] A/B test the Store listing short description after 30 days

---

## 9. DEFINITION OF DONE

The project is complete when ALL of the following are true:

- [ ] Extension loads in Chrome with no errors in `chrome://extensions`
- [ ] Downloading a JPG routes to `Images/` folder automatically
- [ ] Downloading a PDF routes to `Documents/` folder automatically
- [ ] Downloading an MP3 on free plan saves to default location (not sorted)
- [ ] Downloading an MP3 on Pro plan routes to `Music/` folder automatically
- [ ] License key input → validates → Pro features unlock without restart
- [ ] Stats screen shows accurate counts for Pro users
- [ ] Custom folder names persist after popup close
- [ ] Toggle disables all sorting when OFF
- [ ] Vercel API returns `{ valid: true }` for a real active Lemon Squeezy license key
- [ ] Vercel API returns `{ valid: false }` for an invalid key
- [ ] Extension ZIP passes Chrome Web Store submission validation
- [ ] Privacy Policy page is live at a public URL
- [ ] Both Lemon Squeezy checkout URLs are live and working

---

## 10. KNOWN CONSTRAINTS — READ BEFORE BUILDING

1. **MV3 service workers are not persistent.** Do not store state in JavaScript variables in `background.js`. All state must go in `chrome.storage`. The service worker can be killed and restarted at any time.

2. **`onDeterminingFilename` must `return true`** when using async callbacks (storage reads). Missing this causes the listener to fail silently and downloads fall back to default location.

3. **`chrome.tabs.create` is not available in service workers.** Opening Lemon Squeezy checkout URLs must be triggered from `popup.js`, not `background.js`.

4. **Folder paths are relative to the user's default Downloads directory.** `suggest({ filename: 'Images/photo.jpg' })` creates `Downloads/Images/photo.jpg` automatically. Do not construct absolute paths.

5. **`conflictAction: 'uniquify'` is mandatory.** Without it, a duplicate filename silently overwrites the existing file.

6. **The Vercel API must handle OPTIONS preflight requests** for CORS. Return 200 with correct headers on OPTIONS method — handle this in `validate-license.js`.

7. **Pro status must be re-checked on every popup open**, not cached in a variable. Read from `chrome.storage.sync` each time.

---

*End of AGENTS.md — Download Organizer Pro v1.0*
*Build in phase order. Ship Phase 1 before starting Phase 2. Momentum over perfection.*
