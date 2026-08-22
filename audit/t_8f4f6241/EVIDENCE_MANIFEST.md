# Independent same-state pixel evidence

Task: `t_8f4f6241`
Revision: `fdb2182ff3765cde19d8d30012d7a97b67f12b4d`
Pixel-gate verdict: **FAIL / FIX-FIRST**

## Scope and isolation

The capture used only a fresh headless Chromium process, temporary profile `/tmp/hermes-liquid-glass-t_8f4f6241`, synthetic 24-session / 10-message / 17-inspector-row data, DPR 1, deterministic palette/background, and loopback CDP port 9539. The harness read `COMPACT_LAYOUT_CSS` directly from the tested `plugin/plugin.js`. It did not inspect, focus, reload, install into, or launch the live Hermes Desktop. The port was verified closed after capture.

“Reference” below means the exact same synthetic fixture with compact layout disabled. It is a valid same-state before/after control, not the external o8 product reference and not proof of strict visual convergence. Renderer pixels do not prove native chrome or compositor frost.

## Pair manifest

Every listed pair shares fixture, state, viewport, DPR, palette, capture process, crop, and capture order. Each PNG has adjacent geometry JSON.

| Scenario | Reference | Candidate | Result |
|---|---|---|---|
| populated wide 1896×979 | `screenshots/reference-populated-wide-1896x979.png` | `screenshots/candidate-populated-wide-1896x979.png` | bounded |
| populated wide 1440×900 | `screenshots/reference-populated-wide-1440x900.png` | `screenshots/candidate-populated-wide-1440x900.png` | bounded |
| populated medium 1040×900 | `screenshots/reference-populated-medium-1040x900.png` | `screenshots/candidate-populated-medium-1040x900.png` | bounded |
| populated tablet 900×900 | `screenshots/reference-populated-tablet-900x900.png` | `screenshots/candidate-populated-tablet-900x900.png` | inspector hidden; bounded |
| populated tablet 720×900 | `screenshots/reference-populated-tablet-720x900.png` | `screenshots/candidate-populated-tablet-720x900.png` | inspector hidden; bounded |
| populated narrow 700×900 | `screenshots/reference-populated-narrow-700x900.png` | `screenshots/candidate-populated-narrow-700x900.png` | bounded two-pane geometry only |
| populated phone 430×932 | `screenshots/reference-populated-phone-430x932.png` | `screenshots/candidate-populated-phone-430x932.png` | rejected as phone UX |
| populated phone 390×844 | `screenshots/reference-populated-phone-390x844.png` | `screenshots/candidate-populated-phone-390x844.png` | rejected as phone UX |
| populated phone 375×812 | `screenshots/reference-populated-phone-375x812.png` | `screenshots/candidate-populated-phone-375x812.png` | rejected as phone UX |
| populated phone 320×700 | `screenshots/reference-populated-phone-320x700.png` | `screenshots/candidate-populated-phone-320x700.png` | rejected as phone UX |
| empty wide 1440×900 | `screenshots/reference-empty-wide-1440x900.png` | `screenshots/candidate-empty-wide-1440x900.png` | geometry only; semantics rejected |
| empty phone 430×932 | `screenshots/reference-empty-phone-430x932.png` | `screenshots/candidate-empty-phone-430x932.png` | rejected |
| hover 1440×900 | `screenshots/reference-interaction-hover-1440x900.png` | `screenshots/candidate-interaction-hover-1440x900.png` | forced row hover; bounded |
| composer focus 1440×900 | `screenshots/reference-interaction-focus-1440x900.png` | `screenshots/candidate-interaction-focus-1440x900.png` | focus target recorded; bounded |

`state-matrix.png` is the legible contact sheet. `matrix.json` records exact geometry and state. `screenshots/diff-*.png` and `pixel-ae.txt` prove every candidate differs materially from its same-state control; none is characterized as external-reference convergence. `SHA256SUMS` binds harness, ledger, and pixels.

## Geometry findings

All 28 frames have document bounds equal to viewport bounds and retain exact 24/10/17 fixture counts. No pane or composer escapes the viewport. At 1440×900 the candidate panes are 259.19 / 860.81 / 320 px. At 1040×900 they are 224 / 528 / 288 px. The inspector is absent from 900 px downward. Composer focus records `composer-rich-input`.

## Concrete residual defects

1. **Critical — phone model is not product-valid.** At 430 px the permanently visible session rail is 136 px and leaves 294 px for conversation; at 320 px it is 112 px and leaves 208 px. There is no drawer-open/closed ownership, contextual Back, or focus restoration. Reproduce with any `populated-phone-*` candidate.
2. **High — valid empty behavior is unproven and the fixture remains enabled-looking.** Empty captures merely hide synthetic content and dim the composer; they do not establish a product decision to hide, disable, or replace it. Reproduce with both `empty-*` candidates.
3. **High — required semantic interaction matrix is incomplete.** The fixture’s selected row uses a legacy `.active` class rather than the new `aria-current` / `aria-selected` / `data-state="selected"` hooks. Pressed, disabled, unread, error, toolbar-focus, inspector-action-focus, and clipped-halo cases are not honestly represented. Fabricating those pixels would be worse than rejecting the gate.
4. **High — no external o8 same-state reference exists.** The paired control is unstyled baseline only; source app/state/crop parity with the o8 reference is unavailable. Therefore pane/chrome/icon/detail convergence cannot receive a strict pass.
5. **Medium — icon and information richness remain synthetic.** Session icons are generic circles, composer controls are text buttons, and the inspector is repetitive ledger rows. The packet cannot certify production icon assets, native chrome, rich inspector hierarchy, or row semantics.
6. **Medium — long-content/final-message acceptance is unproven.** The transcript starts at the top; the capture does not establish product auto-scroll, final-message visibility above the composer, long-title truncation, expanded inspector sections, or multiline composer behavior.
7. **Medium — palette robustness is unproven.** Only one fixed dark pywal-shaped palette is captured; bright-accent and warm palette pairs are absent.
8. **Medium — compositor glass is unproven.** No isolated Hyprland compositor capture was made. Renderer gradients and `backdrop-filter` cannot establish wallpaper transmission, perimeter frost, or native chrome.

## Required follow-up before PASS

Capture product-valid selected/unread/pressed/disabled/error and multi-target keyboard-focus states; valid empty semantics; long-content/autoscroll; three recorded pywal palettes; product-owned phone drawer/back/focus restoration; a genuine same-state external o8 reference; and a separately labeled isolated compositor-frost pair. Until then the explicit visual verdict remains **FAIL / FIX-FIRST**.
