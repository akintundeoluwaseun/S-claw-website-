# S-CLAW website

Landing and download page for S-CLAW. Plain HTML, CSS and JavaScript with a Three.js 3D hero — no build step.

## Deploy on Vercel
Import this repo in Vercel → Framework preset **Other** → Deploy. Nothing else to set.

## Update the download links
Edit **`downloads.js`** only. Each platform has a `url`, `size` and `note`.

- Small files (under ~100 MB, e.g. the Android `.apk`) can go in `/downloads/` in this repo.
- Big installers (Windows Standard ~3.6 GB, Pro ~6.5 GB, Mac, Linux) are too large for Vercel or Git.
  Upload them to file storage (Cloudflare R2, Backblaze B2, Bunny CDN) and paste the direct public link.

The download button on the hero detects the visitor's device and downloads the right file straight away.

## Files
- `index.html` — the page
- `styles.css` — light/dark themes, animated logo
- `app.js` — theme switch, menu, download panel, card tilt, counters
- `hero3d.js` — the 3D hero: laptop running S-CLAW tasks, living orb, floating app windows
- `vendor/` — Three.js bundled locally (no outside connections at runtime)
- `downloads.js` — download links and version
- `vercel.json` — makes `/downloads/*` files download instead of opening

Made by Oluwaseun Joshua.
