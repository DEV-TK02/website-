const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// simple in-memory rate limiter per IP for the widget proxy endpoint
const rateLimitMap = new Map(); // ip -> timestamp(ms)
const WIDGET_RATE_LIMIT_MS = 8000;

app.use((req, res, next) => {
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  // modern browsers ignore X-XSS-Protection; prefer CSP
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  // Content Security Policy: allow self, specific external hosts, fonts, and restrict frame-ancestors
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://pagead2.googlesyndication.com; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: https://cdn.discordapp.com https://discord.com; connect-src 'self' https://discord.com https://cdn.discordapp.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  // Encourage HTTPS when served over TLS
  res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  next();
});

app.use(compression());

app.use(express.static(path.join(__dirname), {
  maxAge: '1h',
  etag: false
}));

app.get('/api/widget/:guildId', async (req, res) => {
  const guildId = req.params.guildId;
  if(!guildId) return res.status(400).json({ error: 'guildId required' });

  // validate guildId: Discord snowflakes are numeric (basic check)
  if(!/^\d{6,}$/.test(guildId)) return res.status(400).json({ error: 'Invalid guildId' });

  // simple per-IP rate limit to avoid abuse of the proxy endpoint
  const ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : (req.ip || req.socket.remoteAddress || 'unknown');
  const last = rateLimitMap.get(ip) || 0;
  const now = Date.now();
  if(now - last < WIDGET_RATE_LIMIT_MS){
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  rateLimitMap.set(ip, now);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const r = await fetch(`https://discord.com/api/guilds/${encodeURIComponent(guildId)}/widget.json`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!r.ok) {
      console.warn(`Discord widget fetch returned status ${r.status}`);
      return res.status(r.status).json({ error: 'Failed to fetch widget from Discord' });
    }

    const text = await r.text();
    res.status(r.status);
    res.set('Content-Type', r.headers.get('content-type') || 'application/json');
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(text);
  } catch (err) {
    console.warn('Proxy fetch failed:', err && err.message ? err.message : err);
    const statusCode = err && err.name === 'AbortError' ? 504 : 502;
    return res.status(statusCode).json({ error: 'Failed to fetch widget from Discord' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
