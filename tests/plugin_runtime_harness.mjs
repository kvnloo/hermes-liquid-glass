import fs from 'node:fs'

const source = fs.readFileSync(new URL('../plugin/plugin.js', import.meta.url), 'utf8')
const body = source.slice(0, source.indexOf('export default')).replace(/^import .*$/m, '')

function runtime() {
  const values = new Map()
  const props = new Map()
  const classes = new Set()
  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value))
  }
  globalThis.document = { documentElement: {
    style: { setProperty: (key, value) => props.set(key, value) },
    classList: { toggle: (key, on) => on ? classes.add(key) : classes.delete(key) },
    dataset: {}
  }}
  globalThis.window = { hermesDesktop: {} }
  const api = Function(`${body}; return { installTheme, hydrateStoredTheme }`)()
  return { api, values, props, root: document.documentElement }
}

const theme = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const command = process.argv[3]
const mode = process.argv[4] || 'light'
const expected = process.argv[5] || ''
const r = runtime()
if (expected) r.values.set('hermes.liquid-glass-wal.expectedWallpaper', expected)
r.values.set('hermes-desktop-mode-v1', mode)

try {
  if (command === 'control') {
    r.props.set('--theme-background-seed', '#ffffff')
    r.props.set('--theme-primary', '#3b82f6')
  } else {
    r.api.installTheme(theme, { activate: true })
    if (command === 'hydrate') {
      // Simulate the operator's persisted mode choice after initial install.
      r.values.set('hermes-desktop-mode-v1', mode)
      r.props.clear()
      r.props.set('--theme-background-seed', '#ffffff')
      r.props.set('--theme-primary', '#3b82f6')
      r.api.hydrateStoredTheme()
    }
  }
  console.log(JSON.stringify({ ok: true, mode: r.root.dataset.hermesMode || mode,
    theme: r.root.dataset.hermesTheme || 'nous', styles: Object.fromEntries(r.props) }))
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: error.message }))
  process.exitCode = 2
}