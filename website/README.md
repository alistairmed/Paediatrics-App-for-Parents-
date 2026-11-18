# Paeds Pouch marketing website

Static site served at https://paedspouch.vercel.app (Vercel project "paedspouch", root directory `website/`).
Separate from the app itself (repo root), which is served at https://paeds-pouch.vercel.app.

- `index.html`: home page (waitlist form posts to Kit form 10192472)
- `privacy.html`, `terms.html`: website Privacy Policy and Terms of Use
- `links.html`: link-in-bio page for Instagram (https://paedspouch.vercel.app/links)
- `og-image.png`: link preview image (1200 x 630)
- `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`: icons
- `free-sheet-preview.jpg`: preview of the free When to worry sheet

No build step: Vercel serves the files as they are (`vercel.json` sets clean URLs).
