# Strict load tests and pixel sanity gate

Task: `t_72972269`
Branch/revision under test: `feat/o8-ui` at `5da806b6822517e4a86a157987395240c8ba100c`
Verdict: **PASS for implementation integrity, deterministic renderer geometry, and the bounded responsive CSS slice; conditional/FIX-FIRST for genuine phone navigation, product-owned empty semantics, and current-revision compositor frost.**

## Isolation and evidence contract

- Used only a separate headless Chromium probe on CDP `127.0.0.1:9527` with ephemeral runtime `/tmp/hermes-liquid-glass-t_72972269`.
- The probe reads `COMPACT_LAYOUT_CSS` directly from this revision's `plugin/plugin.js`; it did not install, inspect, focus, reload, mutate, or launch the live Hermes Desktop.
- Exact frozen inputs were retained: 24 session rows, 10 transcript messages, 17 inspector rows; fixed pywal-shaped variables `#111821`, `#18232d`, `#e5eef2`, `#536575`, `#78c7d8`; DPR 1; deterministic radial background; identical interaction and viewport sequence.
- Renderer pixels certify CSS geometry/state styling, not authenticated product semantics, Electron native chrome, or Hyprland compositor blur.

## Functional gate — PASS

Raw output: `strict-checks.log`.

- `node --test tests/plugin.test.mjs` — PASS, 3/3, including real-browser responsive geometry.
- `node audit/t_72972269/verify-plugin-load.mjs` — PASS; four contributions registered, compact stylesheet loaded and disposed, `liveDesktopTouched: false`.
- `node --check plugin/plugin.js` — PASS.
- `python -m py_compile scripts/build_theme.py` — PASS.
- `bash -n scripts/apply.sh scripts/install.sh scripts/sync-layout.sh` — PASS.
- `git diff --check` — PASS.
- `git diff HEAD^ HEAD --check` — PASS.

No implementation defect was found and no implementation fix was required.

## Geometry/state gate — PASS within stated scope

`matrix.json` binds the packet to the full tested revision and records all rectangles, state, fixture counts, viewport/document dimensions, and CDP port.

- 1896×979: 341.27px sessions / 1138.73px chat / 416px inspector; composer bounded.
- 1440×900: 259.19px sessions / 860.81px chat / 320px inspector; composer bounded.
- 1040×900: 224px sessions / 528px chat / 288px inspector; composer bounded.
- 700×900: 192px sessions / 508px chat; inspector hidden; composer bounded.
- 430×932: 136px sessions / 294px chat; inspector hidden; composer bounded. This materially improves the prior 192px/238px split but does not create drawer/back/focus-restoration semantics.
- Every state reports document bounds equal to viewport bounds and exact 24/10/17 fixture counts. Focus records `composer-rich-input`.

## Literal pixel sanity — PASS with explicit quarantines

Inspected actual pixels in `state-matrix.png`, `baseline-candidate.png`, `prior-current.png`, the full-resolution 430px state, and `reference-current.png`.

Passes:

- No blank, error, wrong-surface, horizontal overflow, pane escape, unintended overlap, or broken divider frame.
- Pane proportions close at every captured viewport. Composer and inspector remain inside their panes.
- Desktop row/control density, card alignment, icon placement, dividers, and header rhythm remain coherent.
- Hover is distinct from active without layout shift. Focus-visible is bright, visible, and unclipped.
- The exact same-state candidate materially beats the unstyled baseline in pane hierarchy, transcript grouping, density, composer treatment, inspector bounds, and readability.
- Frozen unstyled baseline reproducibility is pixel exact: ImageMagick AE `0 (0)`.
- The current 1440×900 candidate is pixel-identical to the prior candidate: AE `0 (0)`, expected because `5da806b` changes only breakpoints at or below 900/520/380px. No desktop regression exists.

Quarantines/residual gaps:

- 430×932 geometry now passes as a bounded two-pane CSS stress state, but genuine phone UX still fails acceptance: the rail remains permanently visible and no product-owned drawer, contextual Back, or focus restoration exists.
- Synthetic empty states remain geometry-only evidence. The dimmed composer is still enabled-looking and the fixture cannot certify real product empty-state semantics.
- The populated transcript is top-positioned; this does not certify product auto-scroll or final-message visibility.
- Generic circle glyphs, plain buttons, repeated cards, and ledger-like inspector rows do not establish strict reference parity or production semantic richness.
- `reference-current.png` is principles-only because source app/state/crop differ; it is not quantitative same-state evidence.
- No current-revision compositor-backed capture was taken because the task forbids touching the live Desktop. Renderer screenshots cannot certify real wallpaper transmission/frost.

## Evidence inventory

- `capture-matrix.mjs`, `verify-plugin-load.mjs`
- `strict-checks.log`, `capture.log`, `load-result.json`, `matrix.json`
- ten PNGs and ten adjacent geometry JSON files under `screenshots/`
- `state-matrix.png` — ten-state literal sanity sheet
- `baseline-candidate.png` — exact same-state baseline/current pair
- `baseline-repro-diff.png`, `baseline-repro-ae.txt` — frozen baseline integrity
- `prior-current.png`, `prior-current-diff.png`, `prior-current-ae.txt` — prior/current desktop regression check
- `reference-current.png` — labeled principles-only comparison
- `image-identify.txt`, `provenance.txt`, `SHA256SUMS`

## Safety

No push, merge, publication, live installation, live Desktop interaction, or external state mutation occurred.
