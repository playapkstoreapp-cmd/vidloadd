export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'No url' });

  const getYTId = (u) => {
    let m = u.match(/(?:v=|be\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m? m[1] : null;
  };
  const id = getYTId(url);

  // 1) If YouTube, try Piped from SERVER (no CORS, works on Vercel)
  if (id) {
    const hosts = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.privacy.com.de',
      'https://pipedapi.adminforge.de',
      'https://pipedapi.moomoo.me'
    ];
    for (let h of hosts) {
      try {
        const r = await fetch(`${h}/streams/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const j = await r.json();
        if (j.videoStreams) {
          const picker = [...j.videoStreams,...j.audioStreams].slice(0, 6).map(s => ({
            url: s.url,
            type: s.height? s.height + 'p' : 'audio',
            ext: s.mimeType
          }));
          return res.json({ picker, title: j.title });
        }
      } catch (e) {}
    }
  }

  // 2) For IG / TikTok / FB + fallback YouTube, try cobalt
  const INSTANCES = [
    'https://co.wuk.sh/api/json',
    'https://api.cobalt.tools/api/json',
    'https://cobalt-api.kwiatekmiki.com/api/json'
  ];
  for (let api of INSTANCES) {
    try {
      const r = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const j = await r.json();
      if (j.url || j.picker) return res.json(j);
    } catch (e) {}
  }

  return res.status(500).json({ error: 'Busy. Make sure link is PUBLIC and try again.' });
}
