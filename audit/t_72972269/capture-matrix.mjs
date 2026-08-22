import { execFile, spawn } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const execFileAsync = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const repo = resolve(here, '../..')
const out = join(here, 'screenshots')
const runtime = '/tmp/hermes-liquid-glass-t_72972269'
const port = 9527

await mkdir(out, { recursive: true })
await rm(runtime, { recursive: true, force: true })
await mkdir(runtime, { recursive: true })

const source = await readFile(join(repo, 'plugin/plugin.js'), 'utf8')
const css = source.match(/const COMPACT_LAYOUT_CSS = `([\s\S]*?)`\n\nfunction readCompactLayout/)?.[1]
if (!css) throw new Error('Unable to extract compact CSS from plugin/plugin.js')

const sessionRows = Array.from({ length: 24 }, (_, i) => `<div data-slot="context-menu-trigger" class="session-row${i === 2 ? ' active' : ''}"><button data-slot="row-button"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/></svg><span>${String(i + 1).padStart(2, '0')} · Synthetic session ${i + 1}</span></button></div>`).join('')
const messages = Array.from({ length: 10 }, (_, i) => `<article data-message-id="${i + 1}"><strong>${i % 2 ? 'Hermes' : 'Kevin'}</strong><p>${i % 2 ? 'Verified synthetic response with revision-bound evidence, compact rhythm, and no private data.' : 'Synthetic request exercising transcript density, hierarchy, wrapping, and pane alignment.'}</p></article>`).join('')
const reviewRows = Array.from({ length: 17 }, (_, i) => `<article class="review-row"><strong>${i < 5 ? 'Status' : i < 11 ? 'Directive' : 'Evidence'} ${i + 1}</strong><small>${i % 3 === 0 ? 'PASS · deterministic' : 'Pending · synthetic'}</small></article>`).join('')

const html = `<!doctype html><html data-hermes-liquid-glass-layout="compact"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}:root{--dt-background:#111821;--background:#111821;--dt-card:#18232d;--card:#18232d;--dt-foreground:#e5eef2;--foreground:#e5eef2;--dt-border:#536575;--dt-ring:#78c7d8;--dt-primary:#78c7d8;background:radial-gradient(circle at 48% 35%,#385b68 0,#1c313d 32%,#101923 68%,#080d13 100%)}body{font-family:Inter,system-ui,sans-serif}.shell{display:flex;width:100vw;height:100vh}.pane{display:flex;flex-direction:column;min-width:0;overflow:hidden}.sessions{flex:0 0 16rem}.chat{flex:1 1 auto}.review{flex:0 0 24rem}.pane>header{display:flex;align-items:center;justify-content:space-between;padding:0 12px;flex:none}.pane>header span{opacity:.58;font-size:11px}.sessions [data-tree-group]{flex:1;overflow:hidden}.thread{flex:1;overflow:auto;min-height:0}.composer{flex:none}.session-row button{width:100%;height:100%;display:flex;align-items:center;border:0;background:transparent;color:inherit;text-align:left}.session-row svg{fill:none;stroke:currentColor}.review [data-tree-group]{flex:1;overflow:hidden}.review-row{display:flex;justify-content:space-between;gap:8px}.review-row small{opacity:.58}textarea,button{font:inherit;color:inherit;background:color-mix(in srgb,var(--dt-background) 72%,transparent);border:1px solid color-mix(in srgb,var(--dt-border) 74%,transparent)}textarea{width:min(32rem,75%);resize:none}.empty{display:none;place-items:center;text-align:center;flex:1;padding:32px}.empty strong{font-size:16px}.empty p{opacity:.62;max-width:28rem}.empty-mode .populated{display:none!important}.empty-mode .empty{display:grid}.empty-mode [data-slot="composer-root"]{opacity:.48}.narrow-control{display:none}.baseline html{}
${css}
</style></head><body><main class="shell"><section class="pane sessions"><header><strong>Workspace</strong><span>24 sessions</span></header><div class="populated" data-tree-group="grp-sessions"><div data-slot="sidebar-group"><div data-slot="sidebar-group-label">Active sessions</div><div data-slot="sidebar-content">${sessionRows}</div></div></div><div class="empty"><div><strong>No sessions yet</strong><p>Create a synthetic session to begin.</p></div></div></section><section class="pane chat"><header><strong>Conversation</strong><span>local probe</span></header><div class="thread populated" data-slot="aui_thread-content">${messages}</div><div class="empty"><div><strong>No conversation selected</strong><p>Select a session to review its deterministic synthetic transcript.</p></div></div><div class="composer" data-slot="composer-root"><div data-slot="composer-surface"><textarea data-slot="composer-rich-input" aria-label="Message" placeholder="Reply to synthetic session"></textarea><div><button>Attach</button><button>Send</button></div></div></div></section><section class="pane review"><header><strong>Activity</strong><span>17 rows</span></header><div class="populated" data-tree-group="grp-review">${reviewRows}</div><div class="empty"><div><strong>No activity yet</strong><p>Evidence will appear here.</p></div></div></section></main></body></html>`
const fixture = join(runtime, 'fixture.html')
await writeFile(fixture, html)

const chrome = spawn('chromium', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--force-device-scale-factor=1', '--run-all-compositor-stages-before-draw', `--remote-debugging-port=${port}`, `--user-data-dir=${join(runtime, 'profile')}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] })
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
async function targets() {
  for (let i = 0; i < 200; i += 1) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json`); if (r.ok) return await r.json() } catch {}
    await wait(100)
  }
  throw new Error('isolated Chromium CDP port did not open')
}
const target = (await targets()).find(t => t.type === 'page')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolveOpen, reject) => { ws.onopen = resolveOpen; ws.onerror = reject })
let seq = 0
const pending = new Map()
ws.onmessage = event => { const msg = JSON.parse(event.data); if (msg.id && pending.has(msg.id)) { const { resolve: ok, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : ok(msg.result) } }
function cdp(method, params = {}) { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((resolveCall, reject) => pending.set(id, { resolve: resolveCall, reject })) }
async function evaluate(expression) { return (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value }
async function navigate(width, height, mode) {
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
  await cdp('Page.navigate', { url: `${pathToFileURL(fixture)}?state=${mode}` })
  await wait(250)
  if (mode === 'empty') await evaluate(`document.body.classList.add('empty-mode')`)
  if (mode === 'focus') {
    await evaluate(`document.querySelector('[data-slot="composer-rich-input"]').focus()`)
    await cdp('DOM.enable'); await cdp('CSS.enable')
    const doc = await cdp('DOM.getDocument', { depth: -1 })
    const node = await cdp('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '[data-slot="composer-rich-input"]' })
    await cdp('CSS.forcePseudoState', { nodeId: node.nodeId, forcedPseudoClasses: ['focus', 'focus-visible'] })
  }
  if (mode === 'hover') {
    await cdp('DOM.enable'); await cdp('CSS.enable')
    const doc = await cdp('DOM.getDocument', { depth: -1 })
    const node = await cdp('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '[data-slot="context-menu-trigger"]' })
    await cdp('CSS.forcePseudoState', { nodeId: node.nodeId, forcedPseudoClasses: ['hover'] })
  }
  await wait(150)
}
async function capture(name, width, height, mode, compact = true) {
  await navigate(width, height, mode)
  if (!compact) await evaluate(`document.documentElement.removeAttribute('data-hermes-liquid-glass-layout')`)
  const metrics = await evaluate(`(()=>{const q=s=>document.querySelector(s),r=s=>q(s)?.getBoundingClientRect().toJSON(),cs=s=>q(s)?getComputedStyle(q(s)):null;return {viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],sessions:r('.sessions'),chat:r('.chat'),review:{...r('.review'),display:cs('.review').display},composer:r('[data-slot="composer-surface"]'),focus:document.activeElement?.getAttribute('data-slot'),counts:{sessions:document.querySelectorAll('.session-row').length,messages:document.querySelectorAll('[data-message-id]').length,review:document.querySelectorAll('.review-row').length}}})()`)
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true })
  await writeFile(join(out, `${name}.png`), Buffer.from(shot.data, 'base64'))
  await writeFile(join(out, `${name}.json`), JSON.stringify(metrics, null, 2) + '\n')
  return metrics
}

const results = {}
results.populatedReference = await capture('candidate-populated-1896x979', 1896, 979, 'populated')
results.populatedWide = await capture('candidate-populated-1440x900', 1440, 900, 'populated')
results.populatedMedium = await capture('candidate-populated-1040x900', 1040, 900, 'populated')
results.populatedNarrow = await capture('candidate-populated-700x900', 700, 900, 'populated')
results.populatedPhone = await capture('candidate-populated-430x932', 430, 932, 'populated')
results.emptyWide = await capture('candidate-empty-1440x900', 1440, 900, 'empty')
results.emptyPhone = await capture('candidate-empty-430x932', 430, 932, 'empty')
results.hover = await capture('candidate-hover-1440x900', 1440, 900, 'hover')
results.focus = await capture('candidate-focus-1440x900', 1440, 900, 'focus')
results.baseline = await capture('baseline-populated-1440x900', 1440, 900, 'populated', false)
await writeFile(join(here, 'matrix.json'), JSON.stringify({ revision: (await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: repo })).stdout.trim(), fixture: 'deterministic synthetic data only', cdpPort: port, results }, null, 2) + '\n')
await cdp('Browser.close').catch(() => {})
ws.close(); chrome.kill('SIGTERM')
await wait(200)
console.log(JSON.stringify(results, null, 2))
