# Transcript surface convergence slice

Task: `t_19c18011`

Verdict: **PASS for this bounded CSS-only slice; FIX-FIRST for full o8 reference convergence.**

## Change

- Replaced uniform transcript ledger dividers on production message wrappers with subtle pywal-derived local glass surfaces.
- Added a restrained alternating hierarchy step without fixed replacement colors.
- Raised primary transcript copy to 14px/1.48 and composer input copy to 13px/1.4.
- Kept the accepted 18/60/22 wide geometry, 84px composer, responsive behavior, and existing interaction treatments unchanged.

## Verification

- `node --test tests/plugin.test.mjs` — 3/3 pass.
- `node --check plugin/plugin.js` — pass.
- `node audit/t_47a59b9f/verify-plugin-load.mjs` — four registrations; style load/dispose pass.
- Shell syntax, Python compile, and `git diff --check` — pass.
- `node audit/t_47a59b9f/capture-matrix.mjs` — populated, empty, 700px, hover, and focus states recaptured from the isolated synthetic Chromium probe; all document bounds equal viewport bounds.

## Pixel sanity

The populated wide candidate is no longer one flat ledger: transcript beats are visibly grouped into local dark glass surfaces with clearer alternating hierarchy and more readable primary copy. No new overlap, pane escape, horizontal clipping, or composer clipping is visible. The last message remains partially obscured by the fixed composer at the synthetic fixture's scroll position; this pre-existing capture-state limitation does not establish real-product scroll padding.

## Evidence

- `screenshots/candidate-populated-wide.png`
- `screenshots/candidate-empty-wide.png`
- `screenshots/candidate-narrow-700.png`
- `screenshots/candidate-hover.png`
- `screenshots/candidate-focus.png`
- `matrix.json`
- `SHA256SUMS`

## Residual gaps

- Full o8 parity remains unmet: native chrome/icon semantics, rounded floating perimeter, richer inspector semantics, and exact product-owned empty/phone navigation behavior cannot be certified by this theme-only synthetic fixture.
- Renderer screenshots certify CSS geometry and state styling, not Hypr compositor blur.
- Live Hermes Desktop was never touched, focused, inspected, reloaded, or installed into.
