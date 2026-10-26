# Halo key website

A responsive glass key page for Halo's local workspace demo. Copy `HALO-DEMO-2026`, return to Halo, paste it into the key field, and select **Unlock**.

The site is plain HTML, CSS, and JavaScript. It includes a responsive layout, original glass halo artwork, a three-step setup guide, an editor preview, a copyable Luau example, version 2.2 release notes, and an expandable FAQ. Keyboard focus states, reduced-motion support, and clipboard confirmation with a manual-copy fallback are included. It makes no external script, font, analytics, or API requests.

## GitHub Pages

Publish from the `main` branch and the `/(root)` folder in **Settings → Pages**. The `.nojekyll` file allows GitHub Pages to serve these static files directly. No installation or build command is required.

Edit `index.html`, `style.css`, `app.js`, and `halo.svg`, then push to `main` to update the page.

The displayed key is the existing local demo key. This page does not provide server-side licensing or generate unique keys.

Halo 2.2 remembers a successful unlock locally. **File → Forget saved key** clears remembered access. Code suggestions use faint inline text at the end of the current line; Tab accepts, Escape dismisses, and Enter inserts a new line. The website explains these controls and the scope of the local runtime.
