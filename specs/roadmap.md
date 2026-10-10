# roadmap.md — Download Organizer Pro
## Build Phases & Task Order

> Execute phases in strict order. Do not start Phase N+1 until Phase N is verified working.
> For tech details on any task → read tech_stack.md
> For file implementation specs → read file_specs.md

---

## Phase 1 — Core Extension (Free Features Only)

**Goal:** A working extension that sorts Images, Videos, and Documents automatically.
**Verify before moving on:** Download a JPG, PDF, and MP4. Each must land in the correct subfolder.

Tasks (in order):
1. Create folder `download-organizer-pro/`
2. Create `manifest.json` — per file_specs.md
3. Create `background.js` — FREE categories only (images, videos, documents), no Pro logic
4. Create `popup.html` — main screen only, no license screen, no stats screen
5. Create `popup.js` — toggle + folder name inputs + save button only
6. Place icons in `icons/` folder (icon16.png, icon32.png, icon48.png, icon128.png)
7. Load in Chrome: chrome://extensions → Developer mode ON → Load unpacked
8. Manual test: download JPG → Images/, PDF → Documents/, MP4 → Videos/
9. Manual test: rename Images/ to "My Images" in popup → save → re-download JPG → goes to My Images/

**Phase 1 is done when all 2 manual tests pass.**

---

## Phase 2 — Full Extension with Pro Feature Gates

**Goal:** All 6 categories work. Pro gate blocks audio/archives/code on free plan.
**Verify before moving on:** Free plan must NOT sort MP3s. Pro plan must sort MP3s.

Tasks (in order):
1. Expand `background.js`:
   - Add all 6 categories (audio, archives, code) with full extension maps
   - Add isPro check — if category is PRO and isPro is false, call suggest() and return
   - Add date subfolder logic (Pro only) — read dateSubfolders from storage
   - Add stats tracking after every successful sort (Pro only)
   - Add chrome.alarms for 7-day license re-validation
   - Add onInstalled handler with all defaults + alarm creation
2. Expand `popup.html` — add all 3 screens (main, stats, license)
3. Expand `popup.js` — add license activation flow, stats screen, navigation
4. Manual test: MP3 download on free plan → goes to default location
5. Manual test: set isPro = true in chrome.storage manually via DevTools console → MP3 → goes to Music/
6. Manual test: stats increment correctly after each sorted download
7. Manual test: custom folder names persist after closing and reopening popup

**Phase 2 is done when all 4 manual tests pass.**

---

## Phase 3 — Vercel License Validation API

**Goal:** A live API endpoint that validates Lemon Squeezy license keys.
**Verify before moving on:** curl test returns correct valid/invalid responses.

Tasks (in order):
1. Create `api/validate-license.js` — per file_specs.md
2. Create `vercel.json` — per file_specs.md
3. Run `vercel deploy --prod` from project root
4. Set environment variables in Vercel dashboard:
   - LEMON_SQUEEZY_API_KEY
   - LEMON_SQUEEZY_STORE_ID
5. Update VALIDATION_API_URL constant in popup.js with live Vercel URL
6. Test with curl:
   ```
   curl -X POST https://YOUR_PROJECT.vercel.app/api/validate-license \
     -H "Content-Type: application/json" \
     -d '{"licenseKey":"invalid-key-test"}'
   ```
   Expected: `{"valid":false}`
7. Test OPTIONS preflight (CORS check):
   ```
   curl -X OPTIONS https://YOUR_PROJECT.vercel.app/api/validate-license \
     -H "Origin: chrome-extension://anyid"
   ```
   Expected: 200 with Access-Control-Allow-Origin header

**Phase 3 is done when both curl tests return expected responses.**

---

## Phase 4 — Lemon Squeezy Products & Payment Flow

**Goal:** Real checkout URLs, real license keys, real Pro unlock.
**This phase is mostly manual setup — no code changes needed except updating 2 URL constants.**

Tasks (in order):
1. Create account at lemonsqueezy.com
2. Create a Store, set currency to USD
3. Create Product 1: "Download Organizer Pro — Lifetime" → $4.99 → one-time purchase → enable License Keys
4. Create Product 2: "Download Organizer Pro — Monthly" → $1.99/month → subscription → enable License Keys
5. Copy checkout URL for Product 1
6. Copy checkout URL for Product 2
7. Update LEMON_SQUEEZY_URLS in popup.js with both real URLs
8. Get API key: Lemon Squeezy → Settings → API → Create key (read-only scope is enough)
9. Get Store ID: Lemon Squeezy → Settings → Store → copy numeric ID
10. Add both to Vercel environment variables → redeploy
11. Test purchase flow: buy test product using Lemon Squeezy test mode → receive license key → paste in extension → Pro unlocks

**Phase 4 is done when a real license key activates Pro features in the extension.**

---

## Phase 5 — Chrome Web Store Submission

**Goal:** Extension live in the public Chrome Web Store.
**This phase is all manual admin work — no code.**

Tasks (in order):
1. Create `privacy-policy.html` — per file_specs.md — deploy as Vercel static page
2. Create store screenshots (1280×800 px, minimum 1, maximum 5):
   - Screenshot 1: popup UI open (main screen)
   - Screenshot 2: Downloads folder after sorting (before/after)
   - Screenshot 3: Pro features screen
3. Confirm icons exist at all 4 sizes in icons/ folder
4. Pay $5 Chrome Web Store developer fee at chrome.google.com/webstore/devconsole
5. Create new item → upload ZIP of extension folder (exclude api/ and vercel.json)
6. Fill store listing:
   - Name: Download Organizer Pro
   - Short description (132 chars): Auto-sort every download into the right folder. Images, videos, documents, music — always in their place. Free forever.
   - Category: Productivity
   - Privacy Policy URL: your Vercel-hosted privacy-policy URL
7. Submit for review
8. Wait 1–3 business days for approval

**Phase 5 is done when the extension has a live Chrome Web Store URL.**
