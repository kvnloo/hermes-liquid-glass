# Contributing to hermes-liquid-glass

Thanks for helping. This repo is a **Linux-native** Hermes Desktop runtime
plugin + pywal/Hyprland bridge. Keep the footprint small.

## Layout

| Path | Role |
|------|------|
| `plugin/plugin.js` | Desktop runtime plugin (plain ESM, **no JSX/TS**) |
| `scripts/build_theme.py` | pywal `colors.json` → Hermes `DesktopTheme` |
| `scripts/apply.sh` | Build + publish theme JSON for the plugin poller |
| `scripts/install.sh` | End-user install (clone/link/apply) |
| `scripts/sync-layout.sh` | Local single-source links (Hermes + optional `.files`) |
| `hypr/liquid-glass.conf` | Compositor opacity fragment |
| `trailer/` | Privacy-safe Remotion promo (synthetic UI only) |

## Development

### Prerequisites

- Hermes Desktop (packaged is fine)
- Node not required for the plugin itself
- `python3` + `wal` (pywal) for theme builds
- Hyprland for real frost glass

### Load against your Desktop

```bash
git clone https://github.com/kvnloo/hermes-liquid-glass.git
cd hermes-liquid-glass
./scripts/install.sh
# or: ./scripts/sync-layout.sh
```

In Hermes:

1. **Cmd/Ctrl+K → Reload desktop plugins**
2. **Settings → Plugins** — enable `liquid-glass-wal`
3. **Liquid Glass: sync from pywal now**

Edit `plugin/plugin.js`, save, reload plugins. Prove load with:

```bash
node --check plugin/plugin.js
node --test tests/plugin.test.mjs
# Live proof = plugin appears in Settings → Plugins + palette commands work
```

### Hard rules (Desktop disk door)

- **ESM only** in `plugin/plugin.js` — no JSX (`<div>`), no TypeScript
- Imports only: `@hermes/plugin-sdk`, `react`, `react/jsx-runtime`
- Folder name under `desktop-plugins/` **must** equal plugin `id` (`liquid-glass-wal`)
- **Never** `location.reload()` on the poll path — live CSS seeds only (flash bug)
- Trailer / demos must stay **synthetic** — blur/omit real chats, paths, sessions

### Theme pipeline

```text
wal / wallpaper change
  → scripts/apply.sh
  → ~/.cache/wal/hermes-liquid-glass-theme.json
  → ~/.hermes/liquid-glass-wal/theme.json
  → plugin poll (~4s) hash-diff → install + paint
```

Regenerate once:

```bash
./scripts/apply.sh
```

### Single-source local layout

On a machine that also has `kvnloo/.files`:

```bash
./scripts/sync-layout.sh
```

That points:

- `~/.hermes/desktop-plugins/liquid-glass-wal` → this repo’s `plugin/`
- `~/.files/config/hermes-liquid-glass` → this repo

Do not duplicate package files in `.files` — symlink only.

## Pull requests

1. Fork + branch from `main`
2. Keep PRs focused (plugin fix **or** docs **or** trailer — not all three)
3. Include:
   - what changed
   - how you verified (`node --check`, Desktop reload, screenshot if visual)
4. No secrets, no real user session dumps in trailer/docs assets

### Commit style

Conventional-ish is fine:

```text
fix: avoid reload on theme poll
docs: clarify Hyprland ignore_opacity
chore: install.sh default home path
```

## Shipping / “store”

There is **no** Hermes Desktop plugin marketplace yet.

Distribution path:

1. This public git repo
2. `scripts/install.sh` (or manual symlink into `$HERMES_HOME/desktop-plugins/`)
3. Optional: share in Nous Research Discord **`#plugins-skills-and-skins`**
4. Optional later: docs PR / example upstream in `NousResearch/hermes-agent`

`hermes plugins install` is for **CLI/gateway** plugins, not Desktop `plugin.js`.

See [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md).

## Upstream Hermes docs

When linking official docs, prefer:

- [Desktop Plugin SDK](https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk)
- [Hermes Desktop](https://hermes-agent.nousresearch.com/docs/user-guide/desktop)

## License

By contributing you agree your changes are MIT-licensed (see [LICENSE](./LICENSE)).
