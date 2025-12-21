const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
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
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const r = await fetch(`https://discord.com/api/guilds/${encodeURIComponent(guildId)}/widget.json`, { 
      timeout: 10000,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!r.ok) {
      console.warn(`Discord widget fetch returned status ${r.status}`);
      return res.status(r.status).json({ error: 'Failed to fetch widget from Discord' });
    }
    
    const text = await r.text();
    res.status(r.status);
    res.set('Content-Type', 'application/json');
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(text);
  } catch (err) {
    console.warn('Proxy fetch failed:', err.message);
    const statusCode = err.name === 'AbortError' ? 504 : 502;
    return res.status(statusCode).json({ error: 'Failed to fetch widget from Discord' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
