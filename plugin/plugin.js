/**
 * liquid-glass-wal — Hermes Desktop runtime plugin (ESM only, no JSX).
 *
 * Polls pywal-built theme JSON and installs/activates `liquid-glass-wal`
 * with glass mix knobs. Wired from .files apply-pywal-theme.sh.
 *
 * IMPORTANT: never location.reload() on the poll path — that caused a 2.5–5s
 * full-window flash. Wallpaper changes apply live via CSS seeds + localStorage.
 *
 * Theme files (first hit wins):
 *   ~/.hermes/liquid-glass-wal/theme.json
 *   ~/.cache/wal/hermes-liquid-glass-theme.json
 */
import { host, PALETTE_AREA, THEMES_AREA } from '@hermes/plugin-sdk'

const ID = 'liquid-glass-wal'
const THEME_NAME = 'liquid-glass-wal'

const USER_THEMES_KEY = 'hermes-desktop-user-themes-v1'
const SKIN_KEY = 'hermes-desktop-theme-v2'
const MODE_KEY = 'hermes-desktop-mode-v1'
const PROFILE_SKINS_KEY = 'hermes-desktop-profile-themes-v1'
const PROFILE_MODES_KEY = 'hermes-desktop-profile-modes-v1'
const GLASS_KNOBS_KEY = 'hermes-desktop-glass-knobs-v1'
const AUTO_KEY = 'hermes.liquid-glass-wal.auto'
const LAST_HASH_KEY = 'hermes.liquid-glass-wal.lastHash'
const PATH_CACHE_KEY = 'hermes.liquid-glass-wal.themePath'
const COMPACT_LAYOUT_KEY = 'hermes.liquid-glass-wal.compactLayout'
const COMPACT_STYLE_ID = 'hermes-liquid-glass-o8-style'
const POLL_MS = 4000

// Layout only: every color remains derived from Hermes/pywal variables.
// These data-slot hooks are the contracts rendered by the current Desktop;
// older #app-sidebar / #chat-side-panel ids do not exist there.
const COMPACT_LAYOUT_CSS = `
:root[data-hermes-liquid-glass-layout="compact"] {
  --sidebar-width: 16rem;
  --sidebar-content-inline-padding: 0.625rem;
  --o8-compact-radius: 0.25rem;
  --o8-pane-header-height: 3rem;
  --composer-surface-pad-x: 0.625rem;
  --composer-surface-pad-y: 0.3125rem;
  --composer-row-gap: 0.25rem;
  --o8-glass-sidebar: linear-gradient(135deg, color-mix(in srgb, var(--dt-card, var(--card, var(--dt-background, var(--background)))) 92%, transparent), color-mix(in srgb, var(--dt-background, var(--background)) 88%, transparent));
  --o8-glass-center: radial-gradient(ellipse at 52% 38%, color-mix(in srgb, var(--dt-background, var(--background)) 94%, transparent), color-mix(in srgb, var(--dt-card, var(--card, var(--dt-background, var(--background)))) 90%, transparent) 64%, transparent 118%);
  --o8-glass-review: linear-gradient(225deg, color-mix(in srgb, var(--dt-card, var(--card, var(--dt-background, var(--background)))) 94%, transparent), color-mix(in srgb, var(--dt-background, var(--background)) 90%, transparent));
  --o8-glass-elevated: linear-gradient(160deg, color-mix(in srgb, var(--dt-card, var(--card, var(--dt-background, var(--background)))) 96%, transparent), color-mix(in srgb, var(--dt-background, var(--background)) 94%, transparent));
}
:root[data-hermes-liquid-glass-layout="compact"] body {
  font-size: 0.8125rem;
  line-height: 1.42;
  letter-spacing: -0.008em;
  color: var(--dt-foreground, var(--foreground)) !important;
  background: transparent !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="sidebar-wrapper"] [class*="h-[34px]"] {
  background: var(--o8-glass-sidebar) !important;
  border-bottom: 1px solid color-mix(in srgb, var(--dt-foreground) 10%, transparent);
  box-shadow: 0 16px 32px color-mix(in srgb, var(--dt-background, var(--background)) 24%, transparent);
  backdrop-filter: blur(32px) saturate(126%);
}
@media (min-width: 720px) {
  :root[data-hermes-liquid-glass-layout="compact"] :has(> [data-tree-group="grp-sessions"]) {
    flex: 0 0 clamp(16rem, 18vw, 22rem) !important;
    width: clamp(16rem, 18vw, 22rem) !important;
    min-width: 16rem !important;
    background: var(--o8-glass-sidebar) !important;
    box-shadow: 1px 0 0 color-mix(in srgb, var(--dt-foreground) 12%, transparent), 14px 0 42px color-mix(in srgb, var(--dt-background, var(--background)) 32%, transparent), -1px 0 0 color-mix(in srgb, var(--dt-foreground) 4%, transparent) inset;
    backdrop-filter: blur(32px) saturate(126%);
  }
  :root[data-hermes-liquid-glass-layout="compact"] :has(> [data-tree-group="grp-review"]):not([style*="display: none"]) {
    flex: 0 0 clamp(20rem, 22vw, 26rem) !important;
    width: clamp(20rem, 22vw, 26rem) !important;
    min-width: 20rem !important;
    background: var(--o8-glass-review) !important;
    box-shadow: -1px 0 0 color-mix(in srgb, var(--dt-foreground) 12%, transparent), -14px 0 42px color-mix(in srgb, var(--dt-background, var(--background)) 32%, transparent), 1px 0 0 color-mix(in srgb, var(--dt-foreground) 4%, transparent) inset;
    backdrop-filter: blur(34px) saturate(124%);
  }
  :root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-sessions"],
  :root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-review"] {
    border-right: 1px solid color-mix(in srgb, var(--dt-border) 74%, transparent) !important;
    background: transparent !important;
  }
  :root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-review"] {
    border-right: 0 !important;
    border-left: 1px solid color-mix(in srgb, var(--dt-border) 74%, transparent) !important;
    padding: 0.5rem 0.75rem;
  }
  :root[data-hermes-liquid-glass-layout="compact"] :where([data-tree-group="grp-sessions"], [data-tree-group="grp-review"], [data-slot="aui_thread-content"]) {
    color: var(--dt-foreground, var(--foreground)) !important;
  }
  :root[data-hermes-liquid-glass-layout="compact"] :where([data-tree-group="grp-sessions"], [data-tree-group="grp-review"], [data-slot="aui_thread-content"]) :where(button, strong, p, span, small, h2, h3, h4) {
    color: inherit !important;
  }
}
:root[data-hermes-liquid-glass-layout="compact"] :has(> [data-slot="aui_thread-content"]) {
  background: var(--o8-glass-center) !important;
  backdrop-filter: blur(24px) saturate(116%);
}
:root[data-hermes-liquid-glass-layout="compact"] :where(:has(> [data-tree-group="grp-sessions"]), :has(> [data-slot="aui_thread-content"]), :has(> [data-tree-group="grp-review"])) > header {
  min-height: var(--o8-pane-header-height) !important;
  height: var(--o8-pane-header-height) !important;
  padding-block: 0.4375rem !important;
  border-bottom-color: color-mix(in srgb, var(--dt-border) 72%, transparent) !important;
  background: color-mix(in srgb, var(--dt-card, var(--card, var(--dt-background, var(--background)))) 24%, transparent) !important;
  backdrop-filter: blur(30px) saturate(124%);
}
@media (max-width: 1040px) {
  :root[data-hermes-liquid-glass-layout="compact"] :has(> [data-tree-group="grp-sessions"]) {
    flex-basis: 14rem !important;
    width: 14rem !important;
    min-width: 14rem !important;
  }
  :root[data-hermes-liquid-glass-layout="compact"] :has(> [data-tree-group="grp-review"]):not([style*="display: none"]) {
    flex-basis: 18rem !important;
    width: 18rem !important;
    min-width: 18rem !important;
  }
}
:root[data-hermes-liquid-glass-layout="compact"] [data-tree-tab] {
  min-height: 1.75rem !important;
  border-radius: var(--o8-compact-radius) !important;
  font-size: 0.6875rem !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="sidebar-content"] {
  padding-inline: var(--sidebar-content-inline-padding) !important;
  gap: 0 !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="sidebar-group"] {
  min-height: 0 !important;
  padding-block: 0.1875rem !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="sidebar-group-label"] {
  min-height: 1.375rem !important;
  padding-inline: 0.375rem !important;
  font-size: 0.625rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--dt-foreground) 54%, transparent) !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="sidebar-group-content"] {
  gap: 0 !important;
  padding-bottom: 0.125rem !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="context-menu-trigger"]:has(> [data-slot="row-button"]) {
  min-height: 1.625rem !important;
  height: 1.625rem;
  border-radius: var(--o8-compact-radius) !important;
  border: 1px solid transparent;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="row-button"] {
  padding: 0.1875rem 0.375rem !important;
  gap: 0.375rem !important;
  font-size: 0.75rem !important;
  font-weight: 450;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="composer-root"] {
  padding-inline: clamp(1rem, 1.5vw, 1.5rem) !important;
  padding-bottom: clamp(0.75rem, 1.2vw, 1.25rem) !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="composer-surface"] {
  min-height: 5.25rem !important;
  border-radius: 0.5rem !important;
  border: 1px solid color-mix(in srgb, var(--dt-border) 82%, transparent) !important;
  box-shadow: 0 1px 0 color-mix(in srgb, var(--dt-foreground) 12%, transparent) inset, 0 18px 52px color-mix(in srgb, var(--dt-background, var(--background)) 48%, transparent), 0 0 0 1px color-mix(in srgb, var(--dt-foreground) 3%, transparent) !important;
  background: var(--o8-glass-elevated) !important;
  color: var(--dt-foreground, var(--foreground)) !important;
  backdrop-filter: blur(18px) saturate(112%);
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="composer-surface"] :where(input, textarea, [contenteditable="true"]) {
  color: inherit !important;
  caret-color: var(--dt-ring, var(--ring, currentColor));
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="composer-rich-input"] {
  min-height: 1.5rem !important;
  font-size: 0.75rem !important;
  line-height: 1.4 !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="aui_thread-content"] {
  width: min(100%, 58rem) !important;
  max-width: 58rem !important;
  padding-inline: 1.25rem !important;
  margin-inline: auto !important;
}
@media (max-width: 719px) {
  :root[data-hermes-liquid-glass-layout="compact"] :has(> [data-tree-group="grp-sessions"]) {
    flex: 0 0 12rem !important;
    width: 12rem !important;
    min-width: 12rem !important;
  }
  :root[data-hermes-liquid-glass-layout="compact"] :has(> [data-tree-group="grp-review"]):not([style*="display: none"]) {
    display: none !important;
  }
  :root[data-hermes-liquid-glass-layout="compact"] [data-slot="aui_thread-content"] {
    padding-inline: 0.75rem !important;
  }
  :root[data-hermes-liquid-glass-layout="compact"] [data-slot="composer-root"] {
    padding-inline: 0.5rem !important;
  }
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="aui_thread-content"] > :where(p, div) {
  padding-block: 0.4375rem;
  border-bottom: 1px solid color-mix(in srgb, var(--dt-border) 38%, transparent);
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="aui_thread-content"] > :where(section, article, [data-message-id]) {
  padding-block: 0.4375rem !important;
  margin-block: 0 !important;
  border-bottom: 1px solid color-mix(in srgb, var(--dt-border) 44%, transparent);
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="aui_thread-viewport"] {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--dt-foreground) 18%, transparent) transparent;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="profile-rail"] {
  border-top: 1px solid color-mix(in srgb, var(--dt-border) 68%, transparent);
  padding-top: 0.25rem;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-review"] aside {
  font-size: 0.6875rem;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-review"] > :where(h2, h3, h4, p) {
  margin-block: 0.375rem !important;
  line-height: 1.28 !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-review"] > :where(div, section, article):not(:has(> :where(div, section, article))) {
  min-height: 2.5rem;
  padding-block: 0.375rem !important;
  border-bottom: 1px solid color-mix(in srgb, var(--dt-border) 44%, transparent);
}
:root[data-hermes-liquid-glass-layout="compact"] [data-tree-group="grp-review"] :where([role="treeitem"], [role="option"]) {
  min-height: 1.5rem !important;
  line-height: 1.25 !important;
}
:root[data-hermes-liquid-glass-layout="compact"] :where(button, input, textarea, select) {
  border-radius: var(--o8-compact-radius) !important;
}
:root[data-hermes-liquid-glass-layout="compact"] :where(button, a) svg {
  width: 0.8125rem;
  height: 0.8125rem;
  stroke-width: 1.65;
}
:root[data-hermes-liquid-glass-layout="compact"] :where(.rounded-lg, .rounded-xl, .rounded-2xl) {
  border-radius: 0.375rem !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="context-menu-trigger"]:has(> [data-slot="row-button"]):hover {
  background: color-mix(in srgb, var(--dt-foreground) 5%, transparent) !important;
  border-color: color-mix(in srgb, var(--dt-border) 55%, transparent);
}
:root[data-hermes-liquid-glass-layout="compact"] :where(button, [role="button"]):focus-visible,
:root[data-hermes-liquid-glass-layout="compact"] :where(input, textarea, select, [contenteditable="true"]):focus-visible {
  outline: 1px solid color-mix(in srgb, var(--dt-ring) 76%, transparent) !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dt-ring) 14%, transparent) !important;
}
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="context-menu-trigger"]:has(> [data-slot="row-button"])[class*="active"],
:root[data-hermes-liquid-glass-layout="compact"] [data-slot="context-menu-trigger"]:has(> [data-slot="row-button"])[class*="open"] {
  box-shadow: inset 2px 0 0 var(--dt-ring);
  background: color-mix(in srgb, var(--dt-primary) 10%, transparent) !important;
}
:root[data-hermes-liquid-glass-layout="compact"] :where(hr, [role="separator"]) {
  border-color: var(--dt-border);
  opacity: 0.62;
}
`

function readCompactLayout() {
  try {
    const value = localStorage.getItem(COMPACT_LAYOUT_KEY)
    return value === '1' || value === 'true'
  } catch {
    return false
  }
}

function applyCompactLayout(on = readCompactLayout()) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  let style = document.getElementById(COMPACT_STYLE_ID)
  if (on) {
    if (!style) {
      style = document.createElement('style')
      style.id = COMPACT_STYLE_ID
      style.textContent = COMPACT_LAYOUT_CSS
      document.head.appendChild(style)
    }
    root.dataset.hermesLiquidGlassLayout = 'compact'
  } else {
    style?.remove()
    delete root.dataset.hermesLiquidGlassLayout
  }
}

function setCompactLayout(on) {
  try {
    localStorage.setItem(COMPACT_LAYOUT_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
  applyCompactLayout(on)
}

function readAuto() {
  try {
    const v = localStorage.getItem(AUTO_KEY)
    return v === null ? true : v === '1' || v === 'true'
  } catch {
    return true
  }
}

function setAuto(on) {
  try {
    localStorage.setItem(AUTO_KEY, on ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function guessHomes() {
  const homes = []
  try {
    const cached = localStorage.getItem(PATH_CACHE_KEY)
    if (cached && cached.includes('/')) {
      const m = cached.match(/^(.*)\/(?:\.hermes|\.cache)\//)
      if (m) homes.push(m[1])
    }
  } catch {
    /* ignore */
  }
  homes.push('/home/kvn')
  return [...new Set(homes)]
}

function themeCandidates() {
  const out = []
  try {
    const cached = localStorage.getItem(PATH_CACHE_KEY)
    if (cached) out.push(cached)
  } catch {
    /* ignore */
  }
  for (const home of guessHomes()) {
    out.push(
      `${home}/.hermes/liquid-glass-wal/theme.json`,
      `${home}/.cache/wal/hermes-liquid-glass-theme.json`
    )
  }
  return [...new Set(out)]
}

function themeHash(theme) {
  try {
    const c = theme?.colors || {}
    const g = theme?.hermesGlass || {}
    const w = theme?.hermesWal || {}
    return [
      c.background,
      c.foreground,
      c.primary,
      c.sidebarBackground,
      c.card,
      g.chrome,
      g.card,
      w.wallpaper,
      w.builtAt
    ].join('|')
  } catch {
    return String(Math.random())
  }
}

function applyGlassKnobs(knobs) {
  if (typeof document === 'undefined' || !knobs) return
  const root = document.documentElement
  if (knobs.chrome) root.style.setProperty('--theme-mix-chrome', knobs.chrome)
  if (knobs.sidebar) root.style.setProperty('--theme-mix-sidebar', knobs.sidebar)
  if (knobs.card) root.style.setProperty('--theme-mix-card', knobs.card)
  if (knobs.elevated) root.style.setProperty('--theme-mix-elevated', knobs.elevated)
  if (knobs.bubble) root.style.setProperty('--theme-mix-bubble', knobs.bubble)
  root.style.setProperty('--dt-input-bg', '0%')
}

function stripPluginFields(theme) {
  const next = { ...theme }
  delete next.hermesGlass
  delete next.hermesWal
  return next
}

function textFromRead(res) {
  if (typeof res === 'string') return res
  if (!res || typeof res !== 'object') return null
  return res.content || res.text || res.data || null
}

/** Live-paint seeds so ThemeProvider does not need a full reload. */
function paintSeeds(theme) {
  try {
    const c = theme.colors || {}
    const root = document.documentElement
    const mode = theme.hermesWal?.isDark === false ? 'light' : 'dark'
    if (c.background) root.style.setProperty('--theme-background-seed', c.background)
    if (c.foreground) root.style.setProperty('--theme-foreground', c.foreground)
    if (c.primary) {
      root.style.setProperty('--theme-primary', c.primary)
      root.style.setProperty('--theme-midground', c.midground || c.primary)
      root.style.setProperty('--theme-secondary', c.secondary || c.primary)
      root.style.setProperty('--theme-accent-soft', c.accent || c.primary)
    }
    if (c.sidebarBackground) root.style.setProperty('--theme-sidebar-seed', c.sidebarBackground)
    if (c.card) root.style.setProperty('--theme-card-seed', c.card)
    if (c.popover) root.style.setProperty('--theme-elevated-seed', c.popover)
    if (c.userBubble) root.style.setProperty('--theme-bubble-seed', c.userBubble)
    if (c.border) root.style.setProperty('--dt-border', c.border)
    if (c.ring) root.style.setProperty('--dt-ring', c.ring)
    root.classList.toggle('dark', mode === 'dark')
    root.dataset.hermesTheme = THEME_NAME
    root.dataset.hermesMode = mode
    root.style.setProperty('color-scheme', mode)
    applyGlassKnobs(theme.hermesGlass)
    window.hermesDesktop?.setTitleBarTheme?.({
      background: c.background,
      foreground: c.foreground
    })
    window.hermesDesktop?.setNativeTheme?.(mode)
  } catch {
    /* ignore */
  }
}

function installTheme(theme, { activate }) {
  const clean = stripPluginFields(theme)
  clean.name = THEME_NAME
  if (!clean.label) clean.label = 'Liquid Glass (pywal)'

  let store = {}
  try {
    store = JSON.parse(localStorage.getItem(USER_THEMES_KEY) || '{}') || {}
  } catch {
    store = {}
  }
  if (!store || typeof store !== 'object' || Array.isArray(store)) store = {}
  store[THEME_NAME] = clean
  localStorage.setItem(USER_THEMES_KEY, JSON.stringify(store))

  if (theme.hermesGlass) {
    localStorage.setItem(GLASS_KNOBS_KEY, JSON.stringify(theme.hermesGlass))
  }

  if (activate) {
    localStorage.setItem(SKIN_KEY, THEME_NAME)
    const mode = theme.hermesWal?.isDark === false ? 'light' : 'dark'
    localStorage.setItem(MODE_KEY, mode)
    try {
      const skins = JSON.parse(localStorage.getItem(PROFILE_SKINS_KEY) || '{}') || {}
      skins.default = THEME_NAME
      localStorage.setItem(PROFILE_SKINS_KEY, JSON.stringify(skins))
      const modes = JSON.parse(localStorage.getItem(PROFILE_MODES_KEY) || '{}') || {}
      modes.default = mode
      localStorage.setItem(PROFILE_MODES_KEY, JSON.stringify(modes))
    } catch {
      /* ignore */
    }
    paintSeeds(theme)
    // ThemeProvider and live pywal painting may rewrite root styles; restore the
    // opt-in layout marker/style without reloading the Desktop window.
    applyCompactLayout()
  }

  return clean
}

async function readThemeFile() {
  const api = window.hermesDesktop?.readFileText
  if (!api) return null
  for (const path of themeCandidates()) {
    try {
      const res = await api(path)
      const text = textFromRead(res)
      if (!text) continue
      const theme = JSON.parse(text)
      if (!theme?.colors) continue
      try {
        localStorage.setItem(PATH_CACHE_KEY, path)
      } catch {
        /* ignore */
      }
      return { path, theme, hash: themeHash(theme) }
    } catch {
      /* try next */
    }
  }
  return null
}

export default {
  id: ID,
  name: 'Liquid Glass (pywal)',
  description: 'Pywal + Hyprland liquid glass theme for Hermes Desktop.',
  // Unified packages discovered through `hermes plugins install` must remain
  // inert until the user explicitly enables their Desktop half.
  defaultEnabled: false,
  register(ctx) {
    let disposeTheme = () => {}
    let lastPublishedHash = ''
    let contributed = {
      name: THEME_NAME,
      label: 'Liquid Glass (pywal)',
      description: 'Waiting for pywal…',
      colors: {
        background: '#181f23',
        foreground: '#d1deda',
        card: '#1c252a',
        cardForeground: '#d1deda',
        muted: '#1a2328',
        mutedForeground: '#929b98',
        popover: '#1e282e',
        popoverForeground: '#d1deda',
        primary: '#4FA5B3',
        primaryForeground: '#0c0c0e',
        secondary: '#243037',
        secondaryForeground: '#d1deda',
        accent: '#243037',
        accentForeground: '#d1deda',
        border: '#3a4a52',
        input: '#181f23',
        ring: '#4FA5B3',
        midground: '#4FA5B3',
        destructive: '#e75e78',
        destructiveForeground: '#ffffff'
      }
    }

    const publishTheme = (theme, hash) => {
      if (hash && hash === lastPublishedHash) return
      if (theme?.colors) {
        contributed = {
          ...stripPluginFields(theme),
          name: THEME_NAME,
          label: theme.label || 'Liquid Glass (pywal)'
        }
      }
      disposeTheme()
      if (typeof THEMES_AREA === 'string') {
        disposeTheme = ctx.register({
          id: `${ID}:theme`,
          area: THEMES_AREA,
          order: 5,
          data: contributed
        })
      }
      if (hash) lastPublishedHash = hash
    }

    publishTheme(contributed, 'seed')

    ctx.register({
      id: `${ID}:sync`,
      area: PALETTE_AREA,
      data: {
        id: `${ID}.sync`,
        label: 'Liquid Glass: sync from pywal now',
        keywords: ['pywal', 'wallpaper', 'theme', 'glass', 'liquid', 'wal'],
        run: async () => {
          const got = await readThemeFile()
          if (!got) {
            host.toast?.({
              title: 'Liquid Glass',
              message: 'No theme file — run wal / change wallpaper once.',
              tone: 'warn'
            })
            return
          }
          publishTheme(got.theme, got.hash)
          installTheme(got.theme, { activate: true })
          localStorage.setItem(LAST_HASH_KEY, got.hash)
          host.toast?.({
            title: 'Liquid Glass',
            message: `Synced · ${got.theme?.hermesWal?.accent || 'ok'}`,
            tone: 'success'
          })
          // Manual sync only: one reload so ThemeProvider fully re-reads registry.
          location.reload()
        }
      }
    })

    ctx.register({
      id: `${ID}:toggle-auto`,
      area: PALETTE_AREA,
      data: {
        id: `${ID}.toggleAuto`,
        label: 'Liquid Glass: toggle auto-apply on wallpaper change',
        run: () => {
          const next = !readAuto()
          setAuto(next)
          host.toast?.({
            title: 'Liquid Glass',
            message: next ? 'Auto-apply ON' : 'Auto-apply OFF',
            tone: 'info'
          })
        }
      }
    })

    ctx.register({
      id: `${ID}:toggle-compact-layout`,
      area: PALETTE_AREA,
      data: {
        id: `${ID}.toggleCompactLayout`,
        label: 'Liquid Glass: toggle compact three-column layout',
        keywords: ['compact', 'layout', 'sidebar', 'density', 'three column'],
        run: () => {
          const next = !readCompactLayout()
          setCompactLayout(next)
          host.toast?.({
            title: 'Liquid Glass',
            message: next ? 'Compact layout ON' : 'Compact layout OFF',
            tone: 'info'
          })
        }
      }
    })

    let stopped = false
    let lastAppliedHash = ''
    try {
      lastAppliedHash = localStorage.getItem(LAST_HASH_KEY) || ''
    } catch {
      /* ignore */
    }

    const tick = async () => {
      if (stopped) return
      try {
        const got = await readThemeFile()
        if (!got?.theme) return

        // Only touch the contribution registry when the file actually changed.
        if (got.hash !== lastPublishedHash) {
          publishTheme(got.theme, got.hash)
        }

        if (!readAuto()) return

        if (got.hash !== lastAppliedHash) {
          installTheme(got.theme, { activate: true })
          lastAppliedHash = got.hash
          try {
            localStorage.setItem(LAST_HASH_KEY, got.hash)
          } catch {
            /* ignore */
          }
          // No location.reload() — live paintSeeds is enough and avoids flash.
          return
        }

        // Stable theme: do nothing. Re-applying knobs every poll caused flicker.
      } catch (err) {
        console.warn('[liquid-glass-wal]', err)
      }
    }

    tick()
    const interval = setInterval(tick, POLL_MS)

    // One-shot knob apply after mount (ThemeProvider may overwrite seeds once).
    const boot = () => {
      try {
        applyCompactLayout()
        if (localStorage.getItem(SKIN_KEY) !== THEME_NAME) return
        applyGlassKnobs(JSON.parse(localStorage.getItem(GLASS_KNOBS_KEY) || 'null'))
      } catch {
        /* ignore */
      }
    }
    setTimeout(boot, 300)

    return () => {
      stopped = true
      clearInterval(interval)
      disposeTheme()
      applyCompactLayout(false)
    }
  }
}
