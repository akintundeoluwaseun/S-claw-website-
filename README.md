# S-CLAW website

Landing and download page for S-CLAW. Plain HTML, CSS and JavaScript with a Three.js 3D hero — no build step.

## Deploy on Vercel
Import this repo in Vercel → Framework preset **Other** → Deploy. Nothing else to set.

## Download links
All links live in **`downloads.js`**. They point to the app's newest release
(`.../releases/latest/download/<file>`), so clicking downloads the file straight
away and **nothing needs changing when a new version is published**.

- Apps: Windows (`.exe`), Mac (`.dmg`, M-series only), Linux (`.AppImage`)
- Android: marked "Coming soon" (`soon: true`) — add a build and remove `soon` when ready
- Brains (Light / Standard / Pro): only for offline installs; each brain is several files

## Files
- `index.html` — the page
- `styles.css` — light/dark themes, animated logo
- `app.js` — theme switch, menu, download panel, card tilt, counters
- `hero3d.js` — the 3D hero: laptop running S-CLAW tasks, living orb, floating app windows
- `vendor/` — Three.js bundled locally (no outside connections at runtime)
- `downloads.js` — download links and version
- `vercel.json` — makes `/downloads/*` files download instead of opening

Made by Oluwaseun Joshua.
