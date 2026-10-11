export default async function handler(req, res) {
  // CORS headers — set on every response before anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 1. Handle OPTIONS preflight — return 200 with CORS headers immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Reject non-POST with 405
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false });
    return;
  }

  // 3. Extract licenseKey from request body
  const { licenseKey } = req.body || {};

  // 4. Validate licenseKey is a non-empty string — reject with { valid: false } if not
  if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim() === '') {
    res.status(400).json({ valid: false });
    return;
  }

  try {
    // 5. Call Dodo Payments API to validate the license/subscription
    // Note: Dodo Payments routes live licenses through live.dodopayments.com
    // and test licenses through test.dodopayments.com. We support both seamlessly.
    const isTestMode =
      process.env.DODO_ENV === 'test' ||
      (typeof process.env.DODO_API_KEY === 'string' && process.env.DODO_API_KEY.startsWith('test_')) ||
      licenseKey.trim().startsWith('test_');

    const endpoints = isTestMode
      ? [
          'https://test.dodopayments.com/licenses/validate',
          'https://live.dodopayments.com/licenses/validate',
          'https://api.dodopayments.com/licenses/validate',
        ]
      : [
          'https://live.dodopayments.com/licenses/validate',
          'https://test.dodopayments.com/licenses/validate',
          'https://api.dodopayments.com/licenses/validate',
        ];

    let data = null;

    for (const endpoint of endpoints) {
      try {
        const dodoResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
          },
          body: JSON.stringify({ license_key: licenseKey.trim() }),
        });

        if (dodoResponse.ok) {
          const json = await dodoResponse.json();
          data = json;
          // If valid response found, stop searching
          if (json && (json.valid === true || json.status === 'active')) {
            break;
          }
        }
      } catch (err) {
        // Fallback to next endpoint in case of DNS or network issue
      }
    }

    // If no endpoint could be reached or no response data
    if (!data) {
      res.status(200).json({ valid: false });
      return;
    }

    // Check if the payment/subscription is active and valid
    const isValid = data.valid === true || data.status === 'active';
    if (!isValid) {
      res.status(200).json({ valid: false });
      return;
    }

    // Check if it belongs to our store using process.env.DODO_WEBHOOK_SECRET for verification (if configured)
    if (process.env.DODO_WEBHOOK_SECRET) {
      if (data.store_id && String(data.store_id) !== String(process.env.DODO_WEBHOOK_SECRET)) {
        res.status(200).json({ valid: false });
        return;
      }
      if (data.business_id && String(data.business_id) !== String(process.env.DODO_WEBHOOK_SECRET)) {
        res.status(200).json({ valid: false });
        return;
      }
    }

    // Determine plan type from variant/product name
    const variantName = data.meta?.variant_name || data.variant_name || data.product_name || data.plan || '';
    const plan = typeof variantName === 'string' && variantName.toLowerCase().includes('month')
      ? 'monthly'
      : 'onetime';

    // 6. Return { valid: true, plan: 'onetime' | 'monthly' } on success
    res.status(200).json({ valid: true, plan });

  } catch (err) {
    // 8. Error handling
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
}
