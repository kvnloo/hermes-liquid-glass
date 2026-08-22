# Hermes Liquid Glass o8 UI audit

Task: `t_25e8281b`  
Candidate: `feat/o8-ui` at `c3ec43866e464cd76b40b5b2da9e3c054b23b361`  
Verdict: **FIX-FIRST / not reference-parity**

## Scope and safety

The audit used the existing isolated Electron probe at CDP `127.0.0.1:9342`, with:

- isolated `HERMES_HOME`: `/tmp/o8-second-mate-v5/home`
- isolated Electron data: `/tmp/o8-second-mate-v5/user-data`
- deterministic synthetic fixtures: `/tmp/o8-second-mate-v5/fixture-wide-dense.js` and `/tmp/o8-second-mate-v5/fixture.js`
- current CSS injected directly from `/workspace/zer0/oss/hermes-liquid-glass-o8/plugin/plugin.js`
- no plugin installation, reload, focus, or mutation of the live Hermes Desktop

`/tmp/o8-second-mate-v5/cdp.mjs` connects only to port 9342, optionally sets a synthetic viewport, injects the current compact CSS, mutates only the synthetic probe DOM, forces pseudo states through CDP, and captures renderer pixels. The prior wide compositor capture used the same isolated probe on a hidden Hypr workspace and `grim`; the renderer captures in this packet do not prove compositor blur by themselves.

## Evidence

All task artifacts are under `audit/t_25e8281b/screenshots/`.

| Artifact | State | Notes |
|---|---|---|
| `round7-reference-candidate.png` | Reference vs current wide candidate | Internally labeled; candidate side is isolated compositor evidence. |
| `round7-baseline-candidate.png` | Same dense fixture baseline vs current candidate | Internally labeled; verifies the material-only delta. |
| `populated-wide-renderer.png` | Current populated 1896×979 | 24 session rows, 10 transcript beats, 17 inspector rows; 1896×979 document and viewport. |
| `empty-wide-renderer.png` | Current synthetic empty 1896×979 | Explicitly inserted empty copy for all three panes. |
| `narrow-700-renderer.png` | Current 700×900 responsive | Inspector hidden; conversation/composer retained. |
| `hover-renderer.png` | Forced hover | Current CSS, isolated probe. Evidence is invalid as a positive hover proof because fixture mutation/state sequencing left the target visually ambiguous. |
| `focus-renderer.png` | Focused composer | Current CSS, isolated probe. Evidence is invalid as a positive focus proof because the intended focus ring is not visibly distinguishable. |

SHA-256 values were recorded during capture; the source temporary files and copied artifacts are byte-identical.

## Reference gap, candidly

The candidate materially improved from the rejected baseline: the detached white native strip and pale center slab are gone, the shell is near the accepted 18/60/22 silhouette, all three major panes share a darker wallpaper-reactive family, and the dense synthetic fixture closes the earlier vacancy problem. It still does **not** read as the same design at normal view.

The reference is a rounded, floating, nested-glass window with strong perimeter closure, localized frost/rims, richer wallpaper color transmission, compact but information-rich chrome, denser semantic controls, and a weighted inspector. The candidate remains a rectangular full-bleed application shell with broad low-contrast fields, generic text glyphs, weak pane-local elevation, and limited semantic hierarchy.

## State-by-state findings

### Populated wide

- **Geometry / pane proportions:** approximately the intended 18/60/22 split and no document overflow. This is the strongest part of the candidate. The reference has a visibly closed rounded perimeter and more deliberate internal insets; the candidate extends to screen edges and reads as three adjacent sheets.
- **Chrome:** the formerly detached pale strip is corrected, but the top bar is still extremely thin and visually underweighted. Window and global controls are tiny, dark, and nearly disappear.
- **Icons:** fixture rows use generic Unicode diamonds/grids rather than a coherent 16 px optical icon set. Production CSS only normalizes SVG size/stroke; it cannot create missing semantic icons or status affordances.
- **Rows / density:** 24 left rows and 17 inspector rows satisfy count preconditions, but their rhythm is mechanically uniform. The reference distinguishes navigation, agents, activity status, timestamps, chips, and actions more clearly.
- **Transcript:** 10 beats exist, but the first-to-second beat gap is very large and the transcript occupies only the lower half. Content density by count therefore overstates visible density.
- **Spacing / dividers:** alignment is clean and there is no obvious clipping, but the repeated hairlines flatten every message into the same tier. The reference uses grouping, local cards, and status blocks rather than a uniform ledger.
- **Composer:** 84 px minimum and lateral inset are correct. It remains an oversized dark rectangle with low-contrast placeholder/tools and weak integration with the transcript. The right edge/action is visually cramped near the pane boundary.
- **Inspector:** readable and populated, but still a flat text list. Group headings, rows, state markers, timestamps, action affordances, and status severity are insufficiently differentiated.
- **Glass:** wallpaper texture is visible, but the center behaves as a large uniform gray veil; rails are much darker and hard-bounded. Pane-local rims, refraction rolloff, perimeter shadow, and nested floating surfaces remain weaker than the reference.
- **Typography / color:** body text is small and low-contrast. CSS explicitly sets 13 px body, 12 px rows, 10 px group labels, and 11 px inspector text. Pywal remains authoritative, but the selected dark palette compresses foreground hierarchy and interactive contrast.

### Empty wide

- No overlap or clipping; the three empty strings are readable.
- The state is not intentionally composed. All copy is pinned near pane top edges, with a huge dead center and a stale composer still visible despite “No conversation selected.”
- There is no primary action, illustration/icon, centered focal grouping, or explanation of what remains usable.
- “Activity” and “No activity yet” preserve semantics, but the right pane does not visually connect to the center empty state.
- This synthetic mutation proves how the theme treats empty DOM; it does not prove the real product emits these exact empty nodes. A production-selector empty-state test is still required.

### Narrow 700×900

- The current rule correctly hides the inspector and preserves conversation/composer, fixing the prior inspector takeover.
- The screenshot is an empty conversation because the earlier audit mutation persisted in the isolated probe; it therefore certifies geometry but not populated text wrapping.
- The sessions rail is not visible in the captured viewport, so its promised 12 rem behavior and return/navigation semantics are not proven by pixels.
- Composer remains visible and bounded, but nearly fills the width and its controls/placeholder are very low contrast.
- A bright uncovered vertical strip remains at the far right, breaking full-window material closure.
- No explicit responsive Back/open-rail affordance is visible. Narrow continuity is therefore only partially solved.

### Hover

- The forced target is not visibly identifiable in the resulting current capture; no unambiguous hover fill/border can be tied to a specific row.
- The capture also exposes an unrelated very pale left navigation surface with nearly invisible text, proving the color hierarchy is not robust across all active shell surfaces.
- No layout shift or clipping is visible, but the state **fails as interaction evidence**. Hover remains uncertified.

### Focus

- Programmatic focus did not produce a visibly identifiable focus ring in the capture.
- No layout shift or clipping is visible.
- The CSS declares only a 1 px outline plus 2 px low-alpha halo; this is weaker than the required clear keyboard focus perimeter and can disappear against the dark composer. Focus remains uncertified.

## Relevant source and harness files

- `plugin/plugin.js:35-265` — compact CSS: geometry, pywal-derived material tokens, rows, composer, inspector, responsive, hover/focus.
- `plugin/plugin.js:267-301` — opt-in compact-layout persistence and style lifecycle.
- `plugin/plugin.js:397-469` — live pywal seed painting and compact style reassertion without reload.
- `tests/plugin.test.mjs:64-138` — lifecycle, selector contracts, pywal polling/no-reload.
- `tests/plugin.test.mjs:140-181` — Chromium rendered geometry/overflow/inspector structure test.
- `scripts/build_theme.py` — pywal to Hermes theme generation.
- `hypr/liquid-glass.conf` — compositor opacity/blur rules required for real frost.
- `/tmp/o8-second-mate-v5/cdp.mjs` — isolated CDP capture helper.
- `/tmp/o8-second-mate-v5/fixture-wide-dense.js` — deterministic wide reference-density fixture.
- `/tmp/o8-second-mate-v5/fixture.js` — smaller interaction/responsive fixture.

## Verification result

Command:

`node --test tests/plugin.test.mjs && node --check plugin/plugin.js && bash -n scripts/apply.sh scripts/install.sh scripts/sync-layout.sh && python -m py_compile scripts/build_theme.py && git diff --check`

Result at `c3ec438`: **FAIL**. Tests 1–2 pass; rendered browser test 3 fails at `tests/plugin.test.mjs:161` because the wide sessions width is outside its asserted 258–262 px range. The command stops at that failure, so later syntax/diff commands in the chain were not executed in that run. The earlier checkpoint’s “3/3 pass” claim is stale relative to the current source/test pair and must not be repeated.

## Prioritized code-level changes

### P0 — restore truthful geometry verification

1. Reconcile `tests/plugin.test.mjs:159-176` with the production clamp geometry in `plugin/plugin.js:62-78`; assert ratios and computed clamp outcomes from the same viewport contract rather than stale exact widths.
2. Extend the rendered fixture to record actual pane rectangles by stable selectors, all viewport/document overflow, composer bounds, and right-edge closure at 1896, 1440, 1040, 720, 700, 430, 390, 375, and 320 px.
3. Add a populated narrow case and a real empty-state selector case; do not reuse a mutated probe state across captures without resetting fixture provenance.

### P1 — fix shell closure and nested material hierarchy

1. Add a theme-scoped outer-shell/perimeter treatment using existing pywal/Hermes variables: rounded closure where platform permits, a local 1 px rim, and a bounded outer shadow/refraction rolloff.
2. Reduce the center’s uniform gray veil and soften the hard rail boundaries while retaining enough pane luminance separation for hierarchy.
3. Cover the bright uncovered strip at narrow widths and verify all major surfaces, chrome, center, rails, and composer use the same dark wallpaper-reactive token family.
4. Keep color authority variable-only; no fixed palette values.

### P1 — make transcript/composer density honest

1. Remove the oversized upper transcript pause by defining a consistent content start/alignment rule instead of relying on fixture distribution.
2. Replace uniform message hairlines with semantic group spacing and fewer stronger dividers.
3. Raise body/composer text and controls to readable contrast and size without returning to the detached pale slab.
4. Tighten composer tool alignment, establish a clear action hierarchy, and keep its right edge safely inset.

### P1 — make narrow navigation coherent

1. Preserve the now-correct conversation/composer path, but add a visible open/back control for the hidden sessions rail and verify keyboard focus restoration.
2. Prove the 12 rem rail as an actual drawer/overlay or explicit mode, not an off-screen implicit width.
3. Add no-overlap and no-horizontal-overflow assertions at phone widths.

### P2 — controls, icons, and inspector hierarchy

1. Replace fixture Unicode glyphs in visual evidence with production-equivalent SVG/icon components; normalize to the existing 13–16 px optical box and 1.5–1.75 px stroke family.
2. Give inspector groups distinct headings, status shape/text, row pitch, and local action affordances; avoid broad selectors that infer information architecture from arbitrary direct children.
3. Add rendered hover/focus/pressed/selected/disabled/error evidence for representative session row, inspector control, and composer action.
4. Increase focus to a clearly visible >=2 px perimeter with >=3:1 adjacent contrast; make hover identifiable without layout shift.

### P2 — intentional empty states

1. Add product-owned empty-state hooks rather than styling arbitrary injected copy.
2. Center/weight the conversation empty state, provide one primary action, and decide whether the composer is enabled, disabled, or replaced when no conversation is selected.
3. Coordinate left and right empty semantics with the center state and test them in the rendered fixture.

## Final verdict

The current branch has a materially better wide silhouette and material family than its rejected baseline, and it avoids obvious populated-wide clipping. It is not reference-parity: shell closure, nested glass depth, transcript rhythm, semantic controls, inspector hierarchy, empty-state composition, narrow navigation, and hover/focus evidence remain below the intended o8 language. The current rendered test is red, so implementation should begin with the P0 evidence contract before further visual claims.
