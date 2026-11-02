# S-CLAW website

Website for S-CLAW: Home, What it can do, How it works, Download and Questions.
Plain HTML, CSS and JavaScript with a Three.js 3D hero. No build step needed to deploy.

## Deploy on Vercel
Import this repo in Vercel, choose framework preset **Other**, deploy. Pages are served as
`/`, `/features`, `/how-it-works`, `/download`, `/faq`.

## Edit
- **Download links:** `downloads.js` only. Links always point to the newest release, so
  nothing changes when a new version is published. Downloads start in the background and
  visitors stay on the site.
- **Page text:** edit `tools/pages/<page>.html`, then run `python3 tools/build.py`
  (it adds the shared header and footer and writes the real pages).
- **Look:** `styles.css`. Colours have meaning: blue = S-CLAW working, orange = needs
  your OK, green = done.

## Files
- `index.html`, `features.html`, `how-it-works.html`, `download.html`, `faq.html` — built pages
- `app.js` — theme, menu, download page, background downloads
- `hero3d.js` — the 3D laptop animation on Home
- `vendor/` — Three.js (MIT); `fonts/` — Bricolage Grotesque and Figtree (OFL), self-hosted

Made by Oluwaseun Joshua.
