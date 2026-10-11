# monetization.md — Download Organizer Pro

## Pricing, Feature Gates, License Flow & Dodo Payment Setup

---

## Pricing

| Plan | Price | Type | Target User |
| ------ | ------- | ------ | ------------- |
| Free | $0 | Forever | Casual users — builds install base |
| Pro One-Time | $4.99 | Lifetime license | Users who hate subscriptions |
| Pro Monthly | $1.99/month | Recurring | Users who want to try before committing |

Both paid plans deliver identical Pro features. Pricing is the only difference.

---

## Free vs Pro Feature Gate

| Feature | Free | Pro |
| --------- | ------ | ----- |
| Auto-sort: Images | ✅ | ✅ |
| Auto-sort: Videos | ✅ | ✅ |
| Auto-sort: Documents | ✅ | ✅ |
| Auto-sort: Audio | ❌ | ✅ |
| Auto-sort: Archives | ❌ | ✅ |
| Auto-sort: Code files | ❌ | ✅ |
| Custom folder names | ❌ | ✅ |
| Date-based subfolders | ❌ | ✅ |
| Download stats dashboard | ❌ | ✅ |
| Priority email support | ❌ | ✅ |

### In Code — Category Constants

```js
const FREE_CATEGORIES = ['images', 'videos', 'documents'];
const PRO_CATEGORIES  = ['audio', 'archives', 'code'];
```

Gate logic in background.js:

```js
if (PRO_CATEGORIES.includes(category) && !isPro) {
  suggest(); // fall through to default Chrome behaviour
  return;
}
```

Gate logic in popup.js (UI lock):

```js
// Lock inputs for Pro categories if user is not Pro
if (!isPro) {
  proInputs.forEach(input => {
    input.disabled = true;
    input.style.opacity = '0.4';
    input.style.cursor = 'not-allowed';
  });
}
```

---

## License Validation Flow

```1. User opens popup → clicks "Upgrade to Pro"
2. Popup shows license screen (screen 3)
3. User clicks "$4.99 One-Time" or "$1.99/mo" button
4. chrome.tabs.create opens Dodo Payment checkout in new tab
5. User completes purchase → Dodo Payment emails license key
6. User pastes license key into input in popup
7. User clicks "Activate License"
8. popup.js POSTs { licenseKey } to VALIDATION_API_URL
9. Vercel function calls Dodo Payment API to verify key
10. Response { valid: true, plan: 'onetime' | 'monthly' } returned
11. popup.js writes { isPro: true, licenseKey } to chrome.storage.sync
12. popup.js re-renders UI to Pro state — locked inputs unlock immediately
13. background.js re-validation alarm runs every 7 days silently
14. On re-validation failure → do NOT revoke (offline grace period)
```

---

## Dodo Payment Setup (Manual Steps — Phase 4)

1. Create account at dodopayments.com
2. Go to Settings → Store → note your numeric Store ID
3. Create Product 1:
   - Name: Download Organizer Pro — Lifetime
   - Price: $4.99 USD
   - Type: One-time purchase
   - Enable: License Keys → set Activations Limit to 3 (covers reinstalls)
4. Create Product 2:
   - Name: Download Organizer Pro — Monthly
   - Price: $1.99 USD/month
   - Type: Subscription
   - Enable: License Keys → Activations Limit: 3
5. Go to Developer → API Keys → Create API key (read-only scope sufficient)
6. Copy API key → add to Vercel env as DODO_API_KEY
7. Go to Developer → Webhooks → copy Webhook Secret → add to Vercel env as DODO_WEBHOOK_SECRET
8. Copy checkout URL for each product → update popup.js constants

---

## Vercel API Spec — validate-license.js

**Endpoint:** POST /api/validate-license
**Request body:** `{ licenseKey: string }`
**Response (success):** `{ valid: true, plan: "onetime" | "monthly" }`
**Response (failure):** `{ valid: false }`
**Response (error):** `{ valid: false, error: "Validation failed" }` with HTTP 500

### Validation Logic (in order)

1. Handle OPTIONS preflight — return 200 with CORS headers immediately
2. Reject non-POST methods with 405
3. Parse JSON body → extract licenseKey
4. Validate licenseKey is a non-empty string — reject with { valid: false } if not
5. POST to `https://api.dodopayments.com/licenses/validate`
   - Body: `{ license_key: licenseKey }`
   - Headers: `Authorization: Bearer ${process.env.DODO_API_KEY}`
6. If response status is not 200 → return { valid: false }
7. Verify store using `process.env.DODO_WEBHOOK_SECRET`
8. If `data.attributes.status !== 'active'` → return { valid: false }
9. Determine plan:
   - Check `data.attributes.variant_name` (or `meta.variant_name`)
   - If contains 'Month' or 'month' → plan = 'monthly'
   - Otherwise → plan = 'onetime'
10. Return `{ valid: true, plan }`
11. Wrap all steps 5–10 in try/catch → on error return { valid: false, error: 'Validation failed' } with 500

### Required CORS Headers on Every Response

```Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Constants in popup.js

```js
const DODO_PAYMENT_URLS = {
  oneTime: 'REPLACE_WITH_DODO_PAYMENT_ONETIME_CHECKOUT_URL',
  monthly: 'REPLACE_WITH_DODO_PAYMENT_MONTHLY_CHECKOUT_URL',
};

const VALIDATION_API_URL = 'REPLACE_WITH_VERCEL_URL/api/validate-license';
```

Replace these values in Phase 3 (API URL) and Phase 4 (checkout URLs).
