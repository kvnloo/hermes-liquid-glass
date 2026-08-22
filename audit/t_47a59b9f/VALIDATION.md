# Strict load, interaction, and pixel gate

Task: `t_47a59b9f`  
Branch: `feat/o8-ui`  
Validated implementation revision: `9abf6fc` (visual product change at `01df1b6`)  
Verdict: **CONDITIONAL PASS for the named validation slice; still FIX-FIRST against strict o8 reference parity**

## Safety and provenance

- All rendered state evidence came from a deterministic synthetic HTML fixture in a separate headless Chromium CDP probe on `127.0.0.1:9474`, using `/tmp/hermes-liquid-glass-t_47a59b9f-r8` as isolated browser data.
- The probe extracted the current `COMPACT_LAYOUT_CSS` from `plugin/plugin.js`; it did not install, focus, inspect, reload, or mutate the live Hermes Desktop.
- `audit/t_ac5f9357/round8-reference-candidate.png` remains the compositor-backed reference/candidate evidence for wallpaper transmission. Renderer captures in this directory certify geometry, overflow, state styling, and literal pixel sanity, not Hyprland blur.
- No push, merge, publish, live install, or external state mutation was performed.

## Commands and outcomes

- `node audit/t_47a59b9f/capture-matrix.mjs` — PASS; six matched synthetic states captured at revision `a492e41`.
- `node audit/t_47a59b9f/verify-plugin-load.mjs` — PASS; plugin registered one theme plus three palette contributions, compact CSS loaded, and disposal removed it.
- `node --test tests/plugin.test.mjs` — PASS, 3/3.
- `for i in 1 2 3 4 5; do node --test tests/plugin.test.mjs || exit 1; done` — PASS, 15/15 after headless-gate hardening.
- `node --check plugin/plugin.js` — PASS.
- `bash -n scripts/apply.sh scripts/install.sh scripts/sync-layout.sh` — PASS.
- `python -m py_compile scripts/build_theme.py` — PASS.
- `git diff --check` — PASS.
- SHA-256 manifest: `audit/t_47a59b9f/SHA256SUMS`.

## Rendered geometry and state matrix

All states have viewport-size document bounds and zero document overflow.

- Populated wide, 1440×900: sessions `259.19px` (18.0%), center `860.81px` (59.8%), review `320px` (22.2%); composer `817.63×84px`, bounded at `x=280.78..1098.41`; 24 session rows, 10 transcript beats, 17 review rows.
- Empty wide, 1440×900: same pane/composer closure; centered synthetic empty copy is readable in all panes.
- Narrow, 700×900: sessions `192px`, center `508px`, inspector hidden, composer `492×84px` at `x=200..692`; transcript and composer remain visible with no horizontal overflow.
- Hover, 1440×900: CDP forced the real `:hover` pseudo-state on row 1; the bordered hover is visible and distinct from the filled/left-rim active row 3 without layout shift.
- Focus, 1440×900: CDP forced `:focus` and `:focus-visible` on the composer textarea; after the fix, a cyan two-pixel perimeter plus three-pixel halo is unambiguous and unclipped.
- Same-state baseline/candidate: `baseline-candidate.png` uses identical fixture, viewport, palette, DPR, and probe sequence; both halves are internally labeled.

## Pixel findings

### Passes

- No blank/error/wrong-app frame after correcting the audit harness to match the production center selector and base theme surfaces.
- Wide pane geometry closes exactly; no pane, row, composer, or inspector overlap or horizontal clipping was found.
- Candidate materially beats the unstyled baseline in compact density, 18/60/22 geometry, dark shared material hierarchy, inset composer, readable rows, dividers, and inspector rhythm.
- Empty state is readable and centered; narrow mode preserves populated conversation/composer and hides the inspector rather than taking over the conversation.
- Hover and focus are now positive interaction evidence rather than merely declared CSS.
- Pywal/Hermes variables remain the sole production color authority; no replacement fixed palette was added to `plugin/plugin.js`.

### Validation fixes made

1. `01df1b6 fix: strengthen compact keyboard focus` — increased focus perimeter from 1px/76% to 2px/88% and halo from 2px/14% to 3px/24%, with regression assertions.
2. `a492e41` + `9abf6fc` — hardened the rendered geometry gate after reproducing intermittent zero-size Chromium viewports: removed the conflicting explicit Ozone headless platform, added deterministic headless flags, bounded viewport polling/retries, and a larger virtual-time budget. Five consecutive full post-fix runs passed.

## Residual gaps

These are candid residuals, not hidden passes:

- Strict reference parity is not met. The reference still has richer rounded perimeter closure, native chrome/icon semantics, pane-local frost/rims, transcript semantics, inspector hierarchy, and layered depth. The candidate is cleaner and darker but still reads flatter and more ledger-like.
- The synthetic empty fixture leaves a dimmed composer visible with “No conversation selected.” Product-owned empty-state hooks are required before certifying whether the real app should disable, hide, or replace it; the theme must not guess arbitrary DOM semantics.
- At 700px, the sessions rail remains permanently visible and no explicit drawer/back affordance is shown. Geometry and continuity pass, but phone-like navigation semantics are not certified.
- The synthetic fixture validates production selectors and style behavior, not authenticated application data, exact Electron native chrome, or live Hermes session semantics.
- Renderer screenshots cannot certify compositor wallpaper blur; that claim remains scoped to the labeled compositor-backed round-8 artifact.

## Evidence inventory

- `audit/t_47a59b9f/baseline-candidate.png`
- `audit/t_47a59b9f/screenshots/candidate-populated-wide.png`
- `audit/t_47a59b9f/screenshots/candidate-empty-wide.png`
- `audit/t_47a59b9f/screenshots/candidate-narrow-700.png`
- `audit/t_47a59b9f/screenshots/candidate-hover.png`
- `audit/t_47a59b9f/screenshots/candidate-focus.png`
- Per-state JSON geometry beside each PNG
- `audit/t_47a59b9f/matrix.json`
- `audit/t_47a59b9f/load-result.json`
- `audit/t_ac5f9357/round8-reference-candidate.png`
