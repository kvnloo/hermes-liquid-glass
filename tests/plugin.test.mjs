import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'

const SOURCE = new URL('../plugin/plugin.js', import.meta.url)

function makeClassList() {
  const values = new Set()
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    toggle: (name, force) => force ? (values.add(name), true) : (values.delete(name), false),
    contains: name => values.has(name)
  }
}

async function loadPlugin({ stored = {}, theme = null } = {}) {
  const source = (await readFile(SOURCE, 'utf8'))
    .replace("import { host, PALETTE_AREA, THEMES_AREA } from '@hermes/plugin-sdk'", "const { host, PALETTE_AREA, THEMES_AREA } = globalThis.sdk")
    .replace('export default {', 'globalThis.plugin = {')
  const storage = new Map(Object.entries(stored))
  const root = { dataset: {}, classList: makeClassList(), style: { setProperty() {} } }
  const headChildren = []
  const document = {
    documentElement: root,
    head: {
      appendChild(node) { node.parentNode = this; headChildren.push(node); return node },
      removeChild(node) { headChildren.splice(headChildren.indexOf(node), 1); node.parentNode = null }
    },
    createElement(tag) { return { tagName: tag.toUpperCase(), id: '', textContent: '', parentNode: null, remove() { this.parentNode?.removeChild(this) } } },
    getElementById(id) { return headChildren.find(node => node.id === id) || null }
  }
  const commands = new Map()
  let intervalTick = null
  let reloads = 0
  const context = {
    console,
    document,
    window: { hermesDesktop: { readFileText: async () => theme ? JSON.stringify(theme) : null } },
    location: { reload() { reloads += 1 } },
    localStorage: {
      getItem: key => storage.has(key) ? storage.get(key) : null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    setTimeout: fn => (fn(), 1),
    setInterval: fn => (intervalTick = fn, 1),
    clearInterval() {},
    sdk: { host: { toast() {} }, PALETTE_AREA: 'palette', THEMES_AREA: 'themes' }
  }
  context.globalThis = context
  vm.runInNewContext(source, context, { filename: 'plugin.js' })
  const dispose = context.plugin.register({ register(item) {
    if (item.area === 'palette') commands.set(item.data.id, item.data)
    return () => {}
  } })
  await Promise.resolve()
  return { commands, dispose, document, root, storage, tick: () => intervalTick?.(), reloads: () => reloads }
}

test('compact variant is opt-in, persists state, and cleans up its style', async () => {
  const env = await loadPlugin()
  assert.equal(env.root.dataset.hermesLiquidGlassLayout, undefined)
  assert.equal(env.document.getElementById('hermes-liquid-glass-o8-style'), null)

  const toggle = env.commands.get('liquid-glass-wal.toggleCompactLayout')
  assert.ok(toggle, 'compact-layout palette command is registered')
  await toggle.run()

  assert.equal(env.storage.get('hermes.liquid-glass-wal.compactLayout'), '1')
  assert.equal(env.root.dataset.hermesLiquidGlassLayout, 'compact')
  const style = env.document.getElementById('hermes-liquid-glass-o8-style')
  assert.ok(style)

  // Assert the selector contracts observed in the current Hermes Desktop DOM,
  // and the behavior each rule supplies—not just arbitrary source substrings.
  const rules = [...style.textContent.matchAll(/([^{}]+)\{([^{}]+)\}/g)]
    .map(([, selector, declarations]) => ({ selector: selector.trim(), declarations }))
  const ruleFor = selector => rules.find(rule => rule.selector.split(',').map(s => s.trim()).includes(selector))
  const rootPrefix = ':root[data-hermes-liquid-glass-layout="compact"] '
  const sessionsPane = ruleFor(`${rootPrefix}:has(> [data-tree-group="grp-sessions"])`)
  assert.match(sessionsPane?.declarations || '', /width:\s*12rem\s*!important/)
  assert.match(sessionsPane?.declarations || '', /flex:\s*0 0 12rem\s*!important/)
  const sidebar = ruleFor(`${rootPrefix}[data-slot="sidebar"]`)
  assert.match(sidebar?.declarations || '', /border-right:\s*1px solid var\(--dt-border\)\s*!important/)
  const row = ruleFor(`${rootPrefix}[data-slot="context-menu-trigger"]:has(> [data-slot="row-button"])`)
  assert.match(row?.declarations || '', /height:\s*1\.375rem/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="composer-surface"]`)?.declarations || '', /box-shadow:\s*none\s*!important/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="aui_thread-content"]`)?.declarations || '', /padding-inline:\s*0\.75rem\s*!important/)
  assert.doesNotMatch(style.textContent, /#app-sidebar|#chat-side-panel/)

  env.dispose()
  assert.equal(env.document.getElementById('hermes-liquid-glass-o8-style'), null)
  assert.equal(env.root.dataset.hermesLiquidGlassLayout, undefined)
})

test('enabled compact variant survives live pywal poll updates without reload', async () => {
  const theme = {
    colors: { background: '#101010', foreground: '#eeeeee', primary: '#88aacc', border: '#334455' },
    hermesGlass: { chrome: '72%' },
    hermesWal: { isDark: true, builtAt: 'deterministic' }
  }
  const env = await loadPlugin({ stored: { 'hermes.liquid-glass-wal.compactLayout': '1' }, theme })
  await env.tick()

  assert.equal(env.root.dataset.hermesLiquidGlassLayout, 'compact')
  assert.ok(env.document.getElementById('hermes-liquid-glass-o8-style'))
  assert.equal(env.reloads(), 0, 'poll path must not reload the Desktop window')
  assert.equal(env.storage.get('hermes-desktop-theme-v2'), 'liquid-glass-wal')
})
