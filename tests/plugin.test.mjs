// Behavior test for desktop/plugin.js against a stub of the plugin SDK surface it uses.
// Run: node --test tests/   (Node >= 20; no install needed)
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const dir = mkdtempSync(join(tmpdir(), 'lg-'))
const calls = { requested: [], toasts: [] }
globalThis.__lg = calls
writeFileSync(join(dir, 'sdk.mjs'), `
export const PALETTE_AREA = 'palette', THEMES_AREA = 'themes'
export const host = { toast: t => globalThis.__lg.toasts.push(t) }
export const requestTheme = n => (globalThis.__lg.requested.push(n), true)
`)
const src = readFileSync(join(here, '../desktop/plugin.js'), 'utf8').replace("'@hermes/plugin-sdk'", JSON.stringify(pathToFileURL(join(dir, 'sdk.mjs')).href))
writeFileSync(join(dir, 'plugin.mjs'), src)
const { default: plugin, toDesktopTheme } = await import(pathToFileURL(join(dir, 'plugin.mjs')).href)

const wal = (bg, extra = {}) => JSON.stringify({ colors: { background: bg, foreground: '#eee', primary: '#4fa' }, hermesGlass: { chrome: '70%', card: '1%; } body { display:none' }, hermesWal: { accent: '#4fa' }, ...extra })

function harness() {
  const live = new Map()
  const store = new Map()
  let file = null
  let granted = []
  const ctx = {
    register: c => (live.set(c.id, c), () => live.get(c.id) === c && live.delete(c.id)),
    storage: { get: (k, d) => (store.has(k) ? store.get(k) : d), set: (k, v) => store.set(k, v), remove: k => store.delete(k) },
    files: {
      folders: async () => granted,
      requestFolder: async () => ((granted = [{ id: 'g1', name: 'wal', path: '/x/.cache/wal' }]), { ok: true, folder: granted[0] }),
      readText: async (id, path) => (id === 'g1' && path === 'hermes-liquid-glass-theme.json' && file ? { ok: true, text: file } : { ok: false, error: 'not-found' })
    }
  }
  return { ctx, live, setFile: t => (file = t), run: id => [...live.values()].find(c => c.data?.id === id).data.run() }
}

test('toDesktopTheme keeps the palette for both modes and only passes percentage knobs', () => {
  const t = toDesktopTheme(JSON.parse(wal('#111')))
  assert.equal(t.name, 'liquid-glass')
  assert.deepEqual(t.darkColors, t.colors)
  assert.match(t.customCSS, /--theme-mix-chrome: 70%;/)
  assert.doesNotMatch(t.customCSS, /display|body/)
  assert.equal(t.hermesGlass, undefined)
  assert.equal(toDesktopTheme({ colors: { background: '#000' } }), null)
})

test('grant → sync → wallpaper change repaints through the registry only', async () => {
  const h = harness()
  const dispose = plugin.register(h.ctx)
  assert.equal(h.live.get('liquid-glass-wal:theme').data.description, 'Waiting for pywal…')

  await h.run('liquid-glass-wal.sync') // no folder yet
  assert.match(calls.toasts.at(-1).message, /choose pywal folder/)

  h.setFile(wal('#111'))
  await h.run('liquid-glass-wal.chooseFolder')
  assert.equal(h.live.get('liquid-glass-wal:theme').data.colors.background, '#111')
  assert.deepEqual(calls.requested, ['liquid-glass'])

  h.setFile(wal('#222'))
  await new Promise(r => setTimeout(r, 4300)) // one poll
  assert.equal(h.live.get('liquid-glass-wal:theme').data.colors.background, '#222')
  assert.equal(calls.requested.length, 2)

  await new Promise(r => setTimeout(r, 4300)) // unchanged file: no re-pick
  assert.equal(calls.requested.length, 2)

  h.ctx.storage.set('auto', false)
  h.setFile(wal('#333'))
  await new Promise(r => setTimeout(r, 4300))
  assert.equal(h.live.get('liquid-glass-wal:theme').data.colors.background, '#333')
  assert.equal(calls.requested.length, 2, 'auto off: refresh but do not select')

  dispose()
  assert.equal(h.live.has('liquid-glass-wal:theme'), false)
})
