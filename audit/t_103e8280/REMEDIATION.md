# o8 convergence remediation

Task: `t_103e8280`
Product revision: `b92f9f8c35b6b2358fd9219caf4907cc235f3455`
Safety: separate headless Chromium synthetic probe only (`/tmp/hermes-liquid-glass-t_103e8280`, CDP 9541); the live Hermes Desktop was not touched, focused, reloaded, installed into, or launched.

## Confirmed findings remediated

- Replaced the permanent 112–136 px phone rail model with explicit full-width `sessions` and `conversation` pane ownership at 520 px and below.
- Added session-row activation, accessible contextual Back, composer focus transfer, and return-focus restoration.
- Preserved the bounded two-pane compatibility fallback when runtime ownership is unavailable.
- Updated evidence fixtures to use product semantic selected/unread hooks instead of legacy `.active` styling.
- Captured a disabled, visibly muted composer in the empty state rather than an enabled-looking control.

## Verification

- `node --test tests/plugin.test.mjs` — PASS, 3/3.
- `node --check plugin/plugin.js` — PASS.
- `python -m py_compile scripts/build_theme.py` — PASS.
- `bash -n scripts/apply.sh scripts/install.sh scripts/sync-layout.sh` — PASS.
- `node audit/t_7584592c/verify-plugin-load.mjs` — PASS; isolated startup/teardown, zero reloads, no live Desktop.
- `git diff --check` — PASS.
- `node audit/t_103e8280/capture-matrix.mjs` — PASS; seven deterministic candidate states plus baseline; CDP port closed after capture.

## Pixel evidence inspected

- `screenshots/candidate-populated-wide.png` — bounded 259.19 / 860.81 / 320 px panes; no viewport overflow, clipping, or cross-pane overlap.
- `screenshots/candidate-empty-wide.png` — coherent three-pane empty state with disabled/muted composer; no overlay collision.
- `screenshots/candidate-phone-sessions.png` — sessions own all 430×932 px; chat and composer bounds are zero.
- `screenshots/candidate-phone-conversation.png` — conversation owns all 430×932 px, session rail bounds are zero, contextual Back is visible, composer is bounded at x=8, width=414, bottom=920.
- `screenshots/candidate-hover.png` and `screenshots/candidate-focus.png` — selected/unread and composer focus states remain visible and bounded.
- Exact geometry and state counts are in `matrix.json` (24 sessions, 10 messages, 17 review rows).

## Candid residuals

- No genuine same-state external o8 source capture is available, so strict external pixel parity remains unproven.
- Renderer evidence does not certify native Electron chrome or Hyprland compositor frost.
- Authenticated Hermes data, long-content autoscroll behavior, and multiple live pywal palettes remain outside this synthetic probe.
- The trailer lock retains the previously reported 15 npm advisories (11 critical, 3 high, 1 low), and default Remotion browser discovery remains flaky; explicit Chromium rendering passed in the parent validation packet. These are pre-existing, unrelated to this plugin remediation, and were not dependency-upgraded here.
