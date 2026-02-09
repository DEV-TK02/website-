import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { guildId } = req.query;
  if (!guildId) return res.status(400).json({ error: 'guildId required' });

  if (!/^\d{6,}$/.test(guildId)) return res.status(400).json({ error: 'Invalid guildId' });

  // Rate limiting: per IP (Vercel provides x-forwarded-for header)
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const key = `widget_${ip}`;
  
  // Store in function memory (simple, but resets on each deploy; use Redis for production)
  if (!handler._rateLimits) handler._rateLimits = {};
  const last = handler._rateLimits[key] || 0;
  if (now - last < 5000) {
    return res.status(429).json({ error: 'Rate limited: max 1 request per 5 seconds' });
  }
  handler._rateLimits[key] = now;
  
  // Caching: set short TTL so responses are cached by CDN
  res.setHeader('Cache-Control', 'public, max-age=300');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const r = await fetch(`https://discord.com/api/guilds/${encodeURIComponent(guildId)}/widget.json`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!r.ok) {
      return res.status(r.status).json({ error: 'Failed to fetch widget from Discord' });
    }

    const payload = await r.text();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    return res.status(200).send(payload);
  } catch (err) {
    const code = err.name === 'AbortError' ? 504 : 502;
    return res.status(code).json({ error: 'Failed to fetch widget from Discord' });
  }
}
