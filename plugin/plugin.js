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
const WAL_META_KEY = 'hermes.liquid-glass-wal.metadata'
const AUTO_KEY = 'hermes.liquid-glass-wal.auto'
const LAST_HASH_KEY = 'hermes.liquid-glass-wal.lastHash'
const PATH_CACHE_KEY = 'hermes.liquid-glass-wal.themePath'
const EXPECTED_WALLPAPER_KEY = 'hermes.liquid-glass-wal.expectedWallpaper'
const WALLPAPER_SEEDS_KEY = 'hermes.liquid-glass-wal.wallpaperSeeds'
const BACKDROP_STYLE_ID = 'hermes-liquid-glass-wallpaper-backdrop'
const POLL_MS = 4000
const MAX_FRAME_BYTES = 32 * 1024 * 1024
const TRUSTED_BACKDROPS = Object.freeze({
  'DP-1': Object.freeze({ assetId: '2133182232', profileId: 'liquid-glass-forgotten-horizontal', scheme: 'LiquidGlass-Forgotten', wallpaper: 'DP-1.png' }),
  'DP-2': Object.freeze({ assetId: '1888636115', profileId: 'liquid-glass-clouds-vertical', scheme: 'LiquidGlass-Clouds', wallpaper: 'DP-2.png' })
})
let backdropGeneration = 0

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

function themeCandidates() {
  const out = []
  try {
    const cached = localStorage.getItem(PATH_CACHE_KEY)
    if (cached) out.push(cached)
  } catch {
    /* ignore */
  }
  // Desktop's file bridge expands `~/` in the Electron main process. Keep
  // home discovery there rather than baking the plugin author's home into a
  // distributable plugin. The cached resolved path remains first for polling.
  out.push(
    '~/.hermes/liquid-glass-wal/theme.json',
    '~/.cache/wal/hermes-liquid-glass-theme.json'
  )
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

function clearBackdrop() {
  if (typeof document === 'undefined') return
  document.getElementById?.(BACKDROP_STYLE_ID)?.remove?.()
  const root = document.documentElement
  root.dataset.hermesBackdrop = 'opaque-fallback'
  root.style.setProperty('--hermes-wallpaper-backdrop', 'none')
  root.style.setProperty('--theme-mix-chrome', '100%')
  root.style.setProperty('--theme-mix-sidebar', '100%')
}

function rejectBackdrop(reason) {
  clearBackdrop()
  console.warn?.('[liquid-glass-wal] backdrop rejected', String(reason).slice(0, 48))
  return false
}

function decodeBase64(value) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) throw new Error('base64')
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

function imageDimensions(bytes, mime) {
  if (mime === 'image/png') {
    if (bytes.length < 33 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47 ||
        bytes[12] !== 0x49 || bytes[13] !== 0x48 || bytes[14] !== 0x44 || bytes[15] !== 0x52 ||
        bytes.at(-12) !== 0 || bytes.at(-11) !== 0 || bytes.at(-10) !== 0 || bytes.at(-9) !== 0 ||
        bytes.at(-8) !== 0x49 || bytes.at(-7) !== 0x45 || bytes.at(-6) !== 0x4e || bytes.at(-5) !== 0x44) throw new Error('png-decode')
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return [view.getUint32(16), view.getUint32(20)]
  }
  if (mime === 'image/jpeg') {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw new Error('jpeg-decode')
    let offset = 2
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) throw new Error('jpeg-decode')
      const marker = bytes[offset + 1]
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
      if (length < 2 || offset + 2 + length > bytes.length) throw new Error('jpeg-decode')
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return [(bytes[offset + 7] << 8) | bytes[offset + 8], (bytes[offset + 5] << 8) | bytes[offset + 6]]
      }
      offset += 2 + length
    }
  }
  throw new Error('image-decode')
}

async function applyBackdrop(backdrop, wal) {
  const generation = ++backdropGeneration
  clearBackdrop()
  try {
    if (!backdrop || backdrop.kind !== 'verified-wallpaper-frame-v1' || backdrop.frozen !== true ||
        !/^[a-f0-9]{64}$/.test(backdrop.frameHash || '') || !/^[a-f0-9]{64}$/.test(backdrop.receiptHash || '') ||
        !Number.isSafeInteger(backdrop.byteLength) || backdrop.byteLength < 1 || backdrop.byteLength > MAX_FRAME_BYTES ||
        !Number.isSafeInteger(backdrop.width) || !Number.isSafeInteger(backdrop.height) || backdrop.width < 1 || backdrop.height < 1 ||
        !Number.isSafeInteger(backdrop.generation) || backdrop.generation < 1) return rejectBackdrop('receipt-shape')
    const trusted = TRUSTED_BACKDROPS[backdrop.monitor]
    if (!trusted || backdrop.assetId !== trusted.assetId || backdrop.profileId !== trusted.profileId ||
        backdrop.noctaliaScheme !== trusted.scheme || wal?.wallpaper !== trusted.wallpaper ||
        wal?.profileId !== trusted.profileId || wal?.noctaliaScheme !== trusted.scheme ||
        wal?.generation !== backdrop.generation || wal?.receiptHash !== backdrop.receiptHash) return rejectBackdrop('identity-binding')
    const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]*={0,2})$/.exec(backdrop.frameUrl || '')
    if (!match || match[1] !== backdrop.mime) return rejectBackdrop('encoding')
    const bytes = decodeBase64(match[2])
    if (bytes.byteLength !== backdrop.byteLength) return rejectBackdrop('byte-length')
    const dimensions = imageDimensions(bytes, backdrop.mime)
    if (dimensions[0] !== backdrop.width || dimensions[1] !== backdrop.height) return rejectBackdrop('dimensions')
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(value => value.toString(16).padStart(2, '0')).join('')
    if (digest !== backdrop.frameHash) return rejectBackdrop('frame-hash')
    if (generation !== backdropGeneration) return rejectBackdrop('stale-reapply')
  } catch (error) {
    return rejectBackdrop(error?.message || 'validation')
  }
  const root = document.documentElement
  root.style.setProperty('--hermes-wallpaper-backdrop', `url("${backdrop.frameUrl}")`)
  const style = document.createElement?.('style')
  if (!style) return false
  style.id = BACKDROP_STYLE_ID
  style.textContent = `html { background: var(--theme-background-seed) !important; }\n` +
    `body { position:relative; isolation:isolate; background:transparent !important; }\n` +
    `body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none; ` +
    `background-image:var(--hermes-wallpaper-backdrop); background-size:cover; background-position:center; }`
    + `\n#root { position:relative; z-index:1; background-image:var(--hermes-wallpaper-backdrop) !important; ` +
    `background-size:cover !important; background-position:center !important; }`
  document.head?.appendChild(style)
  root.dataset.hermesBackdrop = `${backdrop.monitor}:${backdrop.assetId}:${backdrop.frameHash}`
  return true
}

function selectedMode(theme) {
  try {
    const stored = localStorage.getItem(MODE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return theme.hermesWal?.isDark === false ? 'light' : 'dark'
}

function colorsForMode(theme, mode) {
  return mode === 'dark'
    ? (theme.darkColors || theme.colors || {})
    : (theme.colors || theme.darkColors || {})
}

function assertExpectedWallpaper(theme) {
  const expected = localStorage.getItem(EXPECTED_WALLPAPER_KEY)
  if (!expected) return
  const actual = theme?.hermesWal?.wallpaper || ''
  if (!actual.endsWith(expected)) {
    throw new Error(`liquid-glass theme identity mismatch: expected ${expected}, got ${actual || '<none>'}`)
  }
}

function stripPluginFields(theme) {
  const next = { ...theme }
  delete next.hermesGlass
  delete next.hermesWal
  delete next.hermesGlassByMode
  delete next.hermesBackdrop
  return next
}

function textFromRead(res) {
  if (typeof res === 'string') return res
  if (!res || typeof res !== 'object') return null
  return res.content || res.text || res.data || null
}

/** Live-paint seeds so ThemeProvider does not need a full reload. */
async function paintSeeds(theme) {
  try {
    // Explicitly disabling wallpaper seeds is the mutation/control path. In
    // production this leaves ThemeProvider's built-in theme variables intact.
    // Missing means enabled for backwards compatibility.
    if (localStorage.getItem(WALLPAPER_SEEDS_KEY) === '0') return false
    const mode = selectedMode(theme)
    const c = colorsForMode(theme, mode)
    const root = document.documentElement
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
    if (await applyBackdrop(theme.hermesBackdrop, theme.hermesWal)) {
      applyGlassKnobs(theme.hermesGlassByMode?.[mode] || theme.hermesGlass)
    }
    window.hermesDesktop?.setTitleBarTheme?.({
      background: c.background,
      foreground: c.foreground
    })
    window.hermesDesktop?.setNativeTheme?.(mode)
    return true
  } catch {
    return false
  }
}

async function installTheme(theme, { activate }) {
  assertExpectedWallpaper(theme)
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
  if (theme.hermesGlassByMode) {
    localStorage.setItem(`${GLASS_KNOBS_KEY}:by-mode`, JSON.stringify(theme.hermesGlassByMode))
  }
  if (theme.hermesWal) {
    localStorage.setItem(WAL_META_KEY, JSON.stringify(theme.hermesWal))
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
    await paintSeeds(theme)
  }

  return clean
}

async function hydrateStoredTheme() {
  if (localStorage.getItem(SKIN_KEY) !== THEME_NAME) return false
  const store = JSON.parse(localStorage.getItem(USER_THEMES_KEY) || '{}') || {}
  const theme = store[THEME_NAME]
  const knobs = JSON.parse(localStorage.getItem(GLASS_KNOBS_KEY) || 'null')
  const knobsByMode = JSON.parse(localStorage.getItem(`${GLASS_KNOBS_KEY}:by-mode`) || 'null')
  const wal = JSON.parse(localStorage.getItem(WAL_META_KEY) || 'null')
  if (!theme?.colors) return false
  const restored = { ...theme, hermesGlass: knobs, hermesGlassByMode: knobsByMode, hermesWal: wal }
  assertExpectedWallpaper(restored)
  await paintSeeds(restored)
  return true
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
          await installTheme(got.theme, { activate: true })
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
          await installTheme(got.theme, { activate: true })
          lastAppliedHash = got.hash
          try {
            localStorage.setItem(LAST_HASH_KEY, got.hash)
          } catch {
            /* ignore */
          }
          // No location.reload() — live paintSeeds is enough and avoids flash.
          return
        }

        // Native backdrop bytes deliberately stay out of localStorage quota.
        // Repaint directly from the validated theme file after renderer reload.
        const backdropId = got.theme.hermesBackdrop
          ? `${got.theme.hermesBackdrop.monitor}:${got.theme.hermesBackdrop.assetId}:${got.theme.hermesBackdrop.frameHash}`
          : 'opaque-fallback'
        if (document.documentElement.dataset.hermesBackdrop !== backdropId) {
          await paintSeeds(got.theme)
        }

        // Stable theme: do nothing. Re-applying knobs every poll caused flicker.
      } catch (err) {
        console.warn('[liquid-glass-wal]', err)
      }
    }

    tick()
    const interval = setInterval(tick, POLL_MS)

    // ThemeProvider hydrates after disk plugins and can overwrite the first
    // paint with its initial built-in theme. Repaint the selected stored theme
    // after mount, not just its mix knobs, so a fresh profile cannot settle on
    // the default light canvas until the wallpaper poll changes again.
    const boot = async () => {
      try {
        await hydrateStoredTheme()
      } catch {
        /* ignore */
      }
    }
    const bootTimers = [setTimeout(boot, 3500), setTimeout(boot, 7000)]

    return () => {
      stopped = true
      clearInterval(interval)
      bootTimers.forEach(clearTimeout)
      disposeTheme()
    }
  }
}
