import { readFile, writeFile } from 'node:fs/promises'
import vm from 'node:vm'

const source = (await readFile(new URL('../../plugin/plugin.js', import.meta.url), 'utf8'))
  .replace("import { host, PALETTE_AREA, THEMES_AREA } from '@hermes/plugin-sdk'", "const { host, PALETTE_AREA, THEMES_AREA } = globalThis.sdk")
  .replace('export default {', 'globalThis.plugin = {')
const registrations = []
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
const context = {
  console,
  document,
  window: { hermesDesktop: { readFileText: async () => null } },
  location: { reload() { throw new Error('load verifier must not reload') } },
  localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) },
  setInterval: () => 1,
  clearInterval() {},
  setTimeout: fn => (fn(), 1),
  sdk: { host: { toast() {} }, PALETTE_AREA: 'palette', THEMES_AREA: 'themes' }
}
context.globalThis = context
vm.runInNewContext(source, context, { filename: 'plugin/plugin.js' })
const dispose = context.plugin.register({ register(entry) { registrations.push({ id: entry.id, area: entry.area }); return () => {} } })
await Promise.resolve()
if (registrations.length !== 4) throw new Error(`expected 4 registrations, got ${registrations.length}`)
if (!document.getElementById('hermes-liquid-glass-o8-style')) throw new Error('compact stylesheet did not load')
dispose()
if (document.getElementById('hermes-liquid-glass-o8-style')) throw new Error('compact stylesheet did not dispose')
const result = { plugin: context.plugin.id, registrations, compactStyleLoaded: true, compactStyleDisposed: true, liveDesktopTouched: false }
await writeFile(new URL('load-result.json', import.meta.url), JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result, null, 2))
