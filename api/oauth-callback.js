export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No authorization code provided' });

  // Exchange code for access token
  try {
    const DISCORD_CLIENT_ID = '1470233920095125656';
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const REDIRECT_URI = new URL(req.headers.referer || 'https://nightclub-indol.vercel.app/').origin + '/oauth-callback';

    if (!DISCORD_CLIENT_SECRET) {
      console.error('⚠️ DISCORD_CLIENT_SECRET not set in environment');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error('Discord token error:', err);
      return res.status(400).json({ error: 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();

    // Join user to guild (requires bot to have permission)
    const GUILD_ID = '1383549875010146505'; // your guild ID
    const joinRes = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userData.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (joinRes.ok || joinRes.status === 204) {
      // Redirect to success page with welcome message
      return res.redirect(`/?success=joined&user=${encodeURIComponent(userData.username)}`);
    } else {
      const err = await joinRes.json();
      console.error('Failed to join user to guild:', err);
      return res.redirect('/?error=join_failed');
    }
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
