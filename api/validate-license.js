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
    const dodoResponse = await fetch('https://api.dodopayments.com/licenses/validate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
      },
      body: JSON.stringify({ license_key: licenseKey.trim() }),
    });

    // If Dodo Payments returns non-200, key is invalid
    if (!dodoResponse.ok) {
      res.status(200).json({ valid: false });
      return;
    }

    const data = await dodoResponse.json();

    // Check if the payment/subscription is active and valid
    const isValid = data.valid === true || data.status === 'active';
    if (!isValid) {
      res.status(200).json({ valid: false });
      return;
    }

    // Check if it belongs to our store using process.env.DODO_WEBHOOK_SECRET for verification
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
