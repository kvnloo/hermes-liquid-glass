import { readFile, writeFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = (await readFile(new URL('../../plugin/plugin.js', import.meta.url), 'utf8'))
  .replace("import { host, PALETTE_AREA, THEMES_AREA } from '@hermes/plugin-sdk'", "const { host, PALETTE_AREA, THEMES_AREA } = globalThis.sdk")
  .replace('export default {', 'globalThis.plugin = {')
const registrations = []
const disposals = []
const store = new Map([
  ['hermes.liquid-glass-wal.compactLayout', '1'],
  ['hermes.liquid-glass-wal.auto', '0']
])
const root = { dataset: {}, classList: { toggle() {} }, style: { setProperty() {} } }
const styles = []
const document = {
  documentElement: root,
  head: { appendChild(node) { styles.push(node); node.parentNode = this }, removeChild(node) { styles.splice(styles.indexOf(node), 1) } },
  createElement() { return { id: '', textContent: '', parentNode: null, remove() { this.parentNode?.removeChild(this) } } },
  getElementById(id) { return styles.find(node => node.id === id) || null }
}
let intervalCreated = 0
let intervalCleared = 0
let reloads = 0
const context = {
  console,
  document,
  window: { hermesDesktop: { readFileText: async path => path.endsWith('theme.json') ? JSON.stringify({
    name: 'Synthetic isolated probe',
    colors: { background: '#111821', foreground: '#e5eef2', primary: '#78c7d8', border: '#536575' },
    hermesGlass: { chrome: '72%' },
    hermesWal: { isDark: true, builtAt: 'synthetic-t_7584592c' }
  }) : null } },
  location: { reload() { reloads += 1 } },
  localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) },
  setInterval: () => (++intervalCreated),
  clearInterval() { intervalCleared += 1 },
  setTimeout: fn => (fn(), 1),
  sdk: { host: { toast() {} }, PALETTE_AREA: 'palette', THEMES_AREA: 'themes' }
}
context.globalThis = context
vm.runInNewContext(source, context, { filename: 'plugin/plugin.js' })
const dispose = context.plugin.register({ register(entry) {
  registrations.push({ id: entry.id, area: entry.area, dataId: entry.data?.id ?? null })
  return () => disposals.push(entry.id)
} })
await new Promise(resolve => setImmediate(resolve))
if (registrations.length !== 5) throw new Error(`expected 4 initial registrations plus synthetic theme replacement, got ${registrations.length}`)
if (!document.getElementById('hermes-liquid-glass-o8-style')) throw new Error('compact stylesheet did not load')
const startup = {
  compactStyleLoaded: true,
  selectedTheme: store.get('hermes-desktop-theme-v2'),
  reloads,
  intervalCreated
}
dispose()
if (document.getElementById('hermes-liquid-glass-o8-style')) throw new Error('compact stylesheet did not dispose')
if (disposals.length !== 2 || disposals.some(id => id !== 'liquid-glass-wal:theme')) {
  throw new Error(`expected seed replacement and final theme disposal, got ${JSON.stringify(disposals)}`)
}
if (intervalCleared !== 1) throw new Error(`expected polling interval teardown, got ${intervalCleared}`)
if (reloads !== 0) throw new Error(`isolated polling load unexpectedly reloaded ${reloads} time(s)`)
const result = {
  plugin: context.plugin.id,
  probe: 'isolated synthetic plugin host (Node vm; no live Desktop)',
  registrations,
  startup,
  teardown: {
    compactStyleDisposed: true,
    pluginOwnedContributionDisposals: disposals,
    hostOwnedPaletteContributions: 3,
    intervalCleared
  },
  liveDesktopTouched: false
}
await writeFile(new URL('load-result.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
