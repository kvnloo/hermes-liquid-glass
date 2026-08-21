import fs from 'node:fs'

const source = fs.readFileSync(new URL('../plugin/plugin.js', import.meta.url), 'utf8')
const body = source.slice(0, source.indexOf('export default')).replace(/^import .*$/m, '')

function runtime() {
  const values = new Map()
  const props = new Map([
    ['--theme-background-seed', '#ffffff'],
    ['--theme-primary', '#3b82f6']
  ])
  const classes = new Set()
  const elements = new Map()
  globalThis.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  }
  globalThis.document = { documentElement: {
    style: { setProperty: (key, value) => props.set(key, value) },
    classList: { toggle: (key, on) => on ? classes.add(key) : classes.delete(key) },
    dataset: {}
  }, getElementById: id => elements.get(id) || null,
    createElement: () => ({ remove() { elements.delete(this.id) } }),
    head: { appendChild: element => elements.set(element.id, element) }}
  globalThis.window = { hermesDesktop: {} }
  const api = Function(`${body}; return { installTheme, hydrateStoredTheme }`)()
  return { api, values, props, root: document.documentElement, elements }
}

const theme = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const command = process.argv[3]
const mode = process.argv[4] || 'light'
const expected = process.argv[5] || ''
const seedsEnabled = process.argv[6] !== '0'
const r = runtime()
if (expected) r.values.set('hermes.liquid-glass-wal.expectedWallpaper', expected)
r.values.set('hermes.liquid-glass-wal.wallpaperSeeds', seedsEnabled ? '1' : '0')
r.values.set('hermes-desktop-mode-v1', mode)

try {
  r.api.installTheme(theme, { activate: true })
  if (command === 'hydrate' || command === 'control') {
      // Simulate the operator's persisted mode choice after initial install.
      r.values.set('hermes-desktop-mode-v1', mode)
      if (command === 'hydrate') {
        r.props.clear()
        r.props.set('--theme-background-seed', '#ffffff')
        r.props.set('--theme-primary', '#3b82f6')
      }
      r.api.hydrateStoredTheme()
  }
  console.log(JSON.stringify({ ok: true, mode: r.root.dataset.hermesMode || mode,
    theme: r.root.dataset.hermesTheme || 'nous', backdrop: r.root.dataset.hermesBackdrop,
    backdropStyle: r.elements.get('hermes-liquid-glass-wallpaper-backdrop')?.textContent || '',
    styles: Object.fromEntries(r.props) }))
} catch (error) {
  console.log(JSON.stringify({ ok: false, error: error.message }))
  process.exitCode = 2
}