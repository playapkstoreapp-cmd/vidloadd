import ytdl from '@distube/ytdl-core';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'No url' });

  // YOUTUBE - use ytdl-core (works 100% on Vercel)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    try {
      const info = await ytdl.getInfo(url);
      const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
      const picker = formats.slice(0, 8).map(f => ({
        url: f.url,
        type: f.qualityLabel || f.quality,
        ext: f.container
      }));
      // also add audio only
      const audio = ytdl.filterFormats(info.formats, 'audioonly');
      if (audio[0]) picker.push({ url: audio[0].url, type: 'mp3 audio', ext: 'mp3' });

      return res.json({ picker, title: info.videoDetails.title });
    } catch (e) {
      return res.status(500).json({ error: 'YT error: ' + e.message });
    }
  }

  // INSTAGRAM / TIKTOK - use cobalt (these work for IG/TT, not YT)
  const INSTANCES = ['https://co.wuk.sh/api/json','https://api.cobalt.tools/api/json'];
  for (let api of INSTANCES) {
    try {
      const r = await fetch(api, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({url}) });
      const j = await r.json();
      if (j.url || j.picker) return res.json(j);
    } catch {}
  }
  return res.status(500).json({ error: 'Link not public or unsupported' });
}
