export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url || req.body?.url;
  if (!url) return res.status(400).json({ error: 'No url' });

  // Try 3 cobalt instances from server (not browser, so no CORS block)
  const INSTANCES = [
    'https://api.cobalt.tools/api/json',
    'https://co.wuk.sh/api/json',
    'https://cobalt-api.kwiatekmiki.com/api/json'
  ];

  for (let api of INSTANCES) {
    try {
      const r = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: url })
      });
      const j = await r.json();
      if (j.status !== 'error' && !j.error) {
        return res.status(200).json(j);
      }
    } catch (e) {
      console.log('fail', api);
    }
  }
  return res.status(500).json({ error: 'All APIs busy, try public link' });
}
