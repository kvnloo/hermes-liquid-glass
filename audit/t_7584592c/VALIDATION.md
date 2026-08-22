# Strict plugin tests and isolated load report

Task: `t_7584592c`
Revision: `fdb2182ff3765cde19d8d30012d7a97b67f12b4d`
Branch: `feat/o8-ui`
Verdict: **PASS for plugin behavior, isolated synthetic load/startup/teardown, syntax, TypeScript, and explicit-browser trailer packaging. FAIL for the default trailer build's browser discovery and SECURITY FAIL for the pre-existing trailer dependency lock.**

## Isolation and environment

- Linux `7.1.5-1-cachyos` x86_64, glibc 2.44
- Node `v26.4.0`; npm `12.0.1`; Python `3.11.14`; Chromium `150.0.7871.186`
- Plugin load used `audit/t_7584592c/verify-plugin-load.mjs`: a separate Node VM host with synthetic pywal-shaped data. The real plugin source was transformed only in memory to inject the SDK host. It did not install, inspect, focus, reload, launch, or mutate the live Hermes Desktop.
- Browser geometry in `tests/plugin.test.mjs` used test-owned ephemeral Chromium profiles under `/tmp/liquid-glass-rendered-*`; the test removes them in `finally`.
- `desktop/plugin.js` resolves to this revision's `plugin/plugin.js`.

## Final strict run

Raw logs: `strict-checks-rerun.log` (all green) and `strict-checks-final.log` (repeat exposing default-build browser discovery failure). Machine-readable final environment, commands, exit codes, and output: `check-results.json`.

1. `node --test tests/plugin.test.mjs` — PASS, 3/3. Covers opt-in persistence/disposal, reload-free pywal poll, nested inspector structure, responsive 1440/900/700/430 geometry, overflow, composer visibility, and pane priorities.
2. `node audit/t_7584592c/verify-plugin-load.mjs` — PASS. Synthetic theme replaced the seed theme; four host contributions registered; compact style loaded; zero reloads; polling interval started. Teardown removed the style, cleared the interval exactly once, and disposed both plugin-owned theme registrations (seed replacement plus final active contribution). Three palette contributions remain host-owned by contract. Exact result: `load-result.json`.
3. `node --check plugin/plugin.js` — PASS.
4. `python -m py_compile scripts/build_theme.py` — PASS.
5. `bash -n scripts/apply.sh scripts/install.sh scripts/sync-layout.sh` — PASS.
6. `git diff --check` — PASS.
7. `git diff HEAD^ HEAD --check` — PASS for the implemented revision.
8. `(cd trailer && npm exec tsc -- --noEmit)` — PASS after deterministic `npm ci` from the committed lockfile.
9. `(cd trailer && npm run build)` — FLAKY/FAIL on the final repeat: Remotion could not auto-discover a browser. An earlier identical run passed. The README-documented explicit-browser form below passed and rendered all 540 frames: `npm exec remotion -- render src/index.tsx LiquidGlassTrailer out/liquid-glass-trailer.mp4 --log=error --browser-executable=/usr/bin/chromium`.
10. `(cd trailer && npm audit --json)` — FAIL, exit 1: 15 advisories (1 low, 3 high, 11 critical). Raw report: `npm-audit.json`.

## Hidden-output inspection

- Plugin/load/schema/selector/runtime: no plugin exception, missing contribution, missing stylesheet, reload, leaked polling interval, or teardown failure in the final isolated run.
- Headless Chromium emitted transient `SharedImageManager::ProduceMemory` GPU mailbox errors despite `--disable-gpu`; the browser test completed all four viewports and passed. These are Chromium headless diagnostics, not an observed plugin failure.
- Manifest smoke inspection: `plugin.yaml` declares `liquid-glass-wal` v1.0.0, no Python hooks/provides; `desktop/plugin.js` resolves to `plugin/plugin.js`.
- npm install noted blocked `esbuild@0.25.0` postinstall, but TypeScript and the full Remotion render still completed successfully.

## Failures and reproducibility

### Pre-existing security failure — trailer dependencies

The committed `trailer/package-lock.json` pins Remotion `4.0.314`. `npm audit --json` reports 15 vulnerable packages: 11 critical, 3 high, 1 low. Direct vulnerable dependencies include `@remotion/cli`, `@remotion/google-fonts`, and `remotion`; the Remotion advisory includes RCE (`GHSA-2jqp-f4gr-44fr`) and arbitrary file write (`GHSA-g6pc-6676-c23j`). npm proposes the non-major `4.0.515` line for remediation. This is pre-existing dependency state and was not introduced by revision `fdb2182` (which changed only `plugin/plugin.js` and `tests/plugin.test.mjs`). No dependency files were changed because this task forbids product remediation.

Reproduce:

`cd trailer && npm ci && npm audit --json`

### Pre-existing packaging ergonomics failure — browser discovery

The committed `npm run build` does not pass a browser executable. It succeeded once and then failed on repeat with `TypeError: No browser found for rendering frames!` even though `/usr/bin/chromium` is installed. The README already documents the deterministic explicit-browser invocation, which passed and rendered all 540 frames. This is not caused by revision `fdb2182`; `trailer/package.json` was unchanged.

Reproduce the failing/default and passing/deterministic paths:

`cd trailer && npm run build`

`npm exec remotion -- render src/index.tsx LiquidGlassTrailer out/liquid-glass-trailer.mp4 --log=error --browser-executable="$(command -v chromium)"`

### Harness-only first-pass failures — resolved, not product regressions

- Before `npm ci`, TypeScript and Remotion commands failed because `node_modules` was absent. Both passed after installing the committed lockfile.
- The first new verifier incorrectly expected the plugin disposer to own all four host registrations. Source inspection showed the plugin owns dynamic theme disposal while the host owns palette contribution cleanup. The verifier was corrected and the final lifecycle passed. This was an evidence-harness assumption, not a product defect.

## Scope limits

This report certifies the plugin contract and synthetic isolated renderer/load surfaces at the named revision. It does not certify authenticated Hermes data, native Electron chrome, live Hyprland compositor frost, or reference-level pixel parity. Those remain separate evidence lanes. No product code, live Desktop, install target, push, merge, or publication was touched.
