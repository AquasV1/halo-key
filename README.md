# Halo key portal

A responsive glass portal for Halo 2.7. Solve a Lights Out puzzle or a randomized math problem, copy the server-signed key, return to Halo, and select Unlock. Keys last exactly 24 hours from successful issuance. Each challenge expires after 15 minutes and allows five failed attempts.

## Challenges

The default challenge is a keyboard-accessible 4 × 4 Lights Out board. Each tile flips itself and its orthogonal neighbors. Reset restores the same initial board; New challenge requests a different board. The server replays the submitted legal move history against its stored initial board before issuing a key.

Math ranges from pre-algebra through calculus, with a mixed option. Numeric answers accept signed decimals and fractions. The server stores and checks the correct answer; the challenge response does not include it. The browser only validates numeric input syntax.

## Signed key lifecycle

`access.js` calls the Halo Key Service at `https://halo-key-service.gsrisun19.chatgpt.site`. The service signs a `HALO2` key with ECDSA P-256. This repository contains only the public verification point. It has no key generation function or signing secret. The desktop application verifies the same signature, issuer, audience, and exact lifetime.

The portal verifies a key before storing it as `halo.access.v2`, restores the same unexpired key after refresh, and displays a live countdown. Refreshing and retrying a successful claim do not extend expiry. Expired or invalid stored keys are cleared. Storage failures leave the challenge and copy flow usable. The app separately remembers valid access and rechecks expiry across launches. No permanent owner key or fingerprint is included here.

## Deployment

GitHub Pages serves `main` from the root folder. `.nojekyll` allows the static files to be served directly. There is no build step or dependency installation.

- `index.html` / `style.css`: responsive portal, countdown, editor guide, release notes, and FAQ.
- `puzzles.js`: local board display rules.
- `challenges.js`: numeric parsing and legacy question helpers; authoritative questions and answers come from the server.
- `access.js`: strict service client and public signature verification.
- `app.js`: challenge UI, move tracking, storage, countdown, copying, and recovery.
- `halo.svg`: original glass halo artwork.

Release this client only after the new service is public and the matching Halo 2.7 app is available. Old `HALO24` checksum keys are not accepted by the new app.

## Page and service protections

The Content Security Policy restricts scripts, styles, and images to this origin, and API connections to the exact Halo service origin. Inline scripts, eval, plugins, injected base URLs, and form navigation are blocked. Referrers are suppressed. Dynamic text uses textContent; tiles are created with DOM methods. No third-party scripts, fonts, analytics, or AI services are loaded. API requests omit cookies and refuse redirects.

The server binds challenges to a random browser session, enforces attempt limits and rate limits, caps JSON bodies, and validates solutions against stored state. CORS restricts browser access to this GitHub origin, but is not authentication. Puzzles and math are access challenges, not CAPTCHA or a strong anti-bot defense. Signed keys are transferable until expiry; this release does not implement accounts, device binding, or immediate revocation.
