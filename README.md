# Website (static preview)

This repository is a small static site that shows a Discord widget and invite UI.

Quick deploy options

- Deploy to Vercel (one-click):

  <a href="https://vercel.com/new?utm_source=github&utm_medium=button&repository-url=https://github.com/DEV-TK02/website-"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

- GitHub Pages (automatic via Actions):

  This repo includes a GitHub Actions workflow that will publish the repository root to the `gh-pages` branch whenever you push to `main`. Ensure GitHub Pages is enabled for the `gh-pages` branch in the repository Settings → Pages. After the first successful push the site will be available at `https://<your-username>.github.io/website-` (or configure a custom domain).

Local preview

- If you have Python installed, run:

```powershell
py -3 -m http.server 8000
# or
python -m http.server 8000
```

- Open `http://localhost:8000` in your browser.

Notes

- The project includes a `vercel.json` configuration for safe CSP headers when deployed to Vercel.
- If you want the server-side proxy (`/api/widget/:guildId`) to run, you'll need Node.js >= 18 and then run `npm start`.
