export default async function handler(req, res) {
  // CORS headers — set on every response before anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Reject non-POST methods
  if (req.method !== 'POST') {
    res.status(405).json({ valid: false });
    return;
  }

  // Extract and validate licenseKey
  const { licenseKey } = req.body || {};
  if (!licenseKey || typeof licenseKey !== 'string' || licenseKey.trim() === '') {
    res.status(400).json({ valid: false });
    return;
  }

  try {
    // Call Lemon Squeezy license validation API
    const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({ license_key: licenseKey.trim() }),
    });

    // If Lemon Squeezy returns non-200, key is invalid
    if (!lsResponse.ok) {
      res.status(200).json({ valid: false });
      return;
    }

    const data = await lsResponse.json();

    // Verify the license belongs to our store
    if (data.meta?.store_id !== Number(process.env.LEMON_SQUEEZY_STORE_ID)) {
      res.status(200).json({ valid: false });
      return;
    }

    // Verify the license is active
    if (data.meta?.status !== 'active') {
      res.status(200).json({ valid: false });
      return;
    }

    // Determine plan type from variant name
    const variantName = data.meta?.variant_name ?? '';
    const plan = variantName.toLowerCase().includes('month') ? 'monthly' : 'onetime';

    res.status(200).json({ valid: true, plan });

  } catch (err) {
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
}
