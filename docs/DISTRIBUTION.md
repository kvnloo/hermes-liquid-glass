# Distribution

How people get **hermes-liquid-glass** today — and what “store” means.

## Reality check

There is **no Hermes Desktop plugin marketplace** / central plugin store yet.

| Channel | Status |
|---------|--------|
| Disk install into `$HERMES_HOME/desktop-plugins/<id>/` | **Canonical** |
| Settings → Plugins (enable / disable / open folder) | Manage only |
| VS Code Marketplace in Desktop | **Themes only**, not plugins |
| `hermes plugins install …` | **CLI/gateway** plugins, not Desktop UI |
| Nous Discord `#plugins-skills-and-skins` | Community discovery |
| Upstream monorepo bundle | Rare; core stays uncluttered |

Official SDK:  
https://hermes-agent.nousresearch.com/docs/developer-guide/desktop-plugin-sdk

## End-user install (recommended)

### One-liner

```bash
curl -fsSL https://raw.githubusercontent.com/kvnloo/hermes-liquid-glass/main/scripts/install.sh | bash
```

Default clone path: `~/.local/share/hermes-liquid-glass`  
Override: `HERMES_LIQUID_GLASS_HOME=/path curl … | bash`

### From a checkout

```bash
git clone https://github.com/kvnloo/hermes-liquid-glass.git
cd hermes-liquid-glass
./scripts/install.sh
```

### Manual

```bash
mkdir -p ~/.hermes/desktop-plugins
ln -sfn /path/to/hermes-liquid-glass/plugin ~/.hermes/desktop-plugins/liquid-glass-wal
./scripts/apply.sh   # needs pywal colors.json
```

Then in Desktop: **Reload desktop plugins** → enable if needed → **Liquid Glass: sync from pywal now**.

## Hyprland (frost)

```conf
source = /path/to/hermes-liquid-glass/hypr/liquid-glass.conf

decoration {
    blur {
        enabled = true
        ignore_opacity = true
    }
}
```

Without `ignore_opacity`, translucent Electron often looks muddy, not frosted.

## pywal hook

After every `wal` run:

```bash
/path/to/hermes-liquid-glass/scripts/apply.sh
```

[kvnloo/.files](https://github.com/kvnloo/.files) already calls this from `scripts/apply-pywal-theme.sh` when the package is linked.

## Community listing checklist

Post to **#plugins-skills-and-skins** with:

1. One-line pitch  
2. Install one-liner  
3. Requirements (Linux, Hyprland, pywal, Hermes Desktop)  
4. Privacy-safe screenshot or trailer (`trailer/`)  
5. Link: https://github.com/kvnloo/hermes-liquid-glass  

Draft: [docs/COMMUNITY.md](./COMMUNITY.md)

## boplog / portfolio

Public authored-commit archive: https://kvnloo.github.io/boplog/  

Repo is listed under product · agent tooling when present in year data + hierarchy overrides.

## What not to do

- Do not publish real session content in trailers
- Do not claim Marketplace / `hermes plugins install` support for this Desktop plugin
- Do not `location.reload()` on a timer inside the plugin
