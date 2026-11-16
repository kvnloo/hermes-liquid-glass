/**
 * liquid-glass-wal — Hermes Desktop runtime plugin (ESM only, no JSX).
 *
 * Reads the pywal-built theme (`scripts/build_theme.py` writes
 * `hermes-liquid-glass-theme.json` into ~/.cache/wal) through `ctx.files` from
 * a folder the user grants once, and contributes it to THEMES_AREA. Every
 * wallpaper change re-registers the contribution; the app repaints a
 * registered theme live, so there is no reload and no write to app state.
 * Glass mix knobs travel as the theme's own `customCSS`.
 */
import { host, PALETTE_AREA, requestTheme, THEMES_AREA } from '@hermes/plugin-sdk'

const ID = 'liquid-glass-wal'
const THEME_NAME = 'liquid-glass'
const THEME_FILE = 'hermes-liquid-glass-theme.json'
const POLL_MS = 4000

const SEED = {
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

const KNOB_VARS = {
  chrome: '--theme-mix-chrome',
  sidebar: '--theme-mix-sidebar',
  card: '--theme-mix-card',
  elevated: '--theme-mix-elevated',
  bubble: '--theme-mix-bubble'
}

const PERCENT = /^\d{1,3}(\.\d+)?%$/

/** Glass knobs as scoped CSS; only plain percentages pass, so the file can't inject rules. */
function knobsCSS(knobs) {
  const decls = ['--dt-input-bg: 0%;']
  for (const [key, prop] of Object.entries(KNOB_VARS)) {
    const v = knobs?.[key]
    if (typeof v === 'string' && PERCENT.test(v)) decls.push(`${prop}: ${v};`)
  }
  return `:root[data-hermes-theme="${THEME_NAME}"] { ${decls.join(' ')} }`
}

/** The pywal file → a DesktopTheme. One palette for both modes: pywal builds a single one. */
export function toDesktopTheme(raw) {
  if (!raw?.colors?.background || !raw.colors.foreground || !raw.colors.primary) return null
  const { hermesGlass, hermesWal, ...rest } = raw
  return {
    ...rest,
    name: THEME_NAME,
    label: raw.label || 'Liquid Glass (pywal)',
    description: raw.description || `pywal · ${hermesWal?.accent || 'wallpaper'}`,
    darkColors: raw.colors,
    customCSS: knobsCSS(hermesGlass)
  }
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
    let lastText = ''

    const publish = theme => {
      disposeTheme()
      disposeTheme = ctx.register({ id: `${ID}:theme`, area: THEMES_AREA, order: 5, data: theme })
    }

    publish(SEED)

    const folder = async () => (ctx.files ? (await ctx.files.folders())[0] : undefined)

    /** Returns the new theme when the file changed, null when unchanged, undefined when unreadable. */
    const readTheme = async () => {
      const f = await folder()
      if (!f) return undefined
      const res = await ctx.files.readText(f.id, THEME_FILE)
      if (!res?.ok) return undefined
      if (res.text === lastText) return null
      let theme
      try {
        theme = toDesktopTheme(JSON.parse(res.text))
      } catch {
        return undefined
      }
      if (!theme) return undefined
      lastText = res.text
      return theme
    }

    const sync = async ({ activate }) => {
      const theme = await readTheme()
      if (theme) publish(theme)
      if (theme !== undefined && activate) requestTheme(THEME_NAME)
      return theme
    }

    const say = (message, tone = 'info') => host.toast?.({ title: 'Liquid Glass', message, tone })

    ctx.register({
      id: `${ID}:folder`,
      area: PALETTE_AREA,
      data: {
        id: `${ID}.chooseFolder`,
        label: 'Liquid Glass: choose pywal folder (~/.cache/wal)',
        keywords: ['pywal', 'wal', 'folder', 'glass'],
        run: async () => {
          if (!ctx.files) return say('This Desktop build has no plugin file access.', 'warn')
          const picked = await ctx.files.requestFolder()
          if (!picked?.ok || !picked.folder) return
          lastText = ''
          const theme = await sync({ activate: true })
          say(theme ? 'Linked · theme applied' : `Linked, but no ${THEME_FILE} there yet — run wal.`, theme ? 'success' : 'warn')
        }
      }
    })

    ctx.register({
      id: `${ID}:sync`,
      area: PALETTE_AREA,
      data: {
        id: `${ID}.sync`,
        label: 'Liquid Glass: sync from pywal now',
        keywords: ['pywal', 'wallpaper', 'theme', 'glass', 'liquid', 'wal'],
        run: async () => {
          if (!(await folder())) return say('Run "Liquid Glass: choose pywal folder" first.', 'warn')
          lastText = ''
          const theme = await sync({ activate: true })
          say(theme ? 'Synced' : `No readable ${THEME_FILE} — run wal / change wallpaper once.`, theme ? 'success' : 'warn')
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
          const next = !ctx.storage.get('auto', true)
          ctx.storage.set('auto', next)
          say(next ? 'Auto-apply ON' : 'Auto-apply OFF')
        }
      }
    })

    let stopped = false
    const tick = async () => {
      if (stopped) return
      try {
        // A changed file always refreshes the contribution (live repaint if it's
        // active); with auto-apply on, a wallpaper change also selects it.
        const theme = await readTheme()
        if (!theme) return
        publish(theme)
        if (ctx.storage.get('auto', true)) requestTheme(THEME_NAME)
      } catch (err) {
        console.warn('[liquid-glass-wal]', err)
      }
    }

    tick()
    const interval = setInterval(tick, POLL_MS)

    return () => {
      stopped = true
      clearInterval(interval)
      disposeTheme()
    }
  }
}
