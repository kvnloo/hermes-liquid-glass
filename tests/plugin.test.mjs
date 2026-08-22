import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
  assert.match(sessionsPane?.declarations || '', /width:\s*clamp\(16rem, 18vw, 22rem\)\s*!important/)
  assert.match(sessionsPane?.declarations || '', /flex:\s*0 0 clamp\(16rem, 18vw, 22rem\)\s*!important/)
  const reviewPane = ruleFor(`${rootPrefix}:has(> [data-tree-group="grp-review"]):not([style*="display: none"])`)
  assert.match(reviewPane?.declarations || '', /width:\s*clamp\(20rem, 22vw, 26rem\)\s*!important/)
  const sidebar = ruleFor(`${rootPrefix}[data-tree-group="grp-sessions"]`)
  assert.match(sidebar?.declarations || '', /border-right:\s*1px solid color-mix/)
  const row = ruleFor(`${rootPrefix}[data-slot="context-menu-trigger"]:has(> [data-slot="row-button"])`)
  assert.match(row?.declarations || '', /height:\s*1\.625rem/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="composer-surface"]`)?.declarations || '', /min-height:\s*5\.25rem\s*!important/)
  assert.match(style.textContent, /--o8-glass-elevated:[^;]+var\(--dt-card,\s*var\(--card,\s*var\(--dt-background,\s*var\(--background\)\)\)\)/)
  for (const token of ['sidebar', 'center', 'review', 'elevated']) {
    assert.match(style.textContent, new RegExp(`--o8-glass-${token}:[^;]+transparent`), `${token} material must retain compositor wallpaper`)
  }
  assert.match(style.textContent, /--o8-glass-center:\s*radial-gradient\([^;]+94%[^;]+90%[^;]+transparent/,
    'center glass must localize transmission instead of applying one washed veil')
  assert.match(style.textContent, /--o8-glass-sidebar:\s*linear-gradient\([^;]+92%[^;]+88%[^;]+transparent/,
    'sidebar glass must remain dark while transmitting wallpaper')
  assert.match(style.textContent, /--o8-glass-review:\s*linear-gradient\([^;]+94%[^;]+90%[^;]+transparent/,
    'review glass must separate through a restrained value step rather than opacity')
  assert.match(ruleFor(`${rootPrefix}body`)?.declarations || '', /background:\s*transparent\s*!important/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="sidebar-wrapper"] [class*="h-[34px]"]`)?.declarations || '', /background:\s*var\(--o8-glass-sidebar\)\s*!important/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="composer-surface"]`)?.declarations || '', /color:\s*var\(--dt-foreground,\s*var\(--foreground\)\)\s*!important/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="aui_thread-content"]`)?.declarations || '', /max-width:\s*58rem\s*!important/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="aui_thread-content"]`)?.declarations || '', /padding-bottom:\s*7\.5rem\s*!important/,
    'the final transcript beat needs explicit clearance above the composer')
  assert.match(ruleFor(`${rootPrefix}[data-slot="sidebar-group-label"]`)?.declarations || '', /font-size:\s*0\.625rem\s*!important/)
  assert.match(ruleFor(`${rootPrefix}:has(> [data-tree-group="grp-sessions"])`)?.declarations || '', /backdrop-filter:\s*blur\(32px\) saturate\(126%\)/)
  assert.match(ruleFor(`${rootPrefix}:has(> [data-tree-group="grp-sessions"])`)?.declarations || '', /var\(--o8-glass-sidebar\)/)
  assert.match(ruleFor(`${rootPrefix}:has(> [data-slot="aui_thread-content"])`)?.declarations || '', /var\(--o8-glass-center\)/)
  assert.match(ruleFor(`${rootPrefix}[data-slot="composer-surface"]`)?.declarations || '', /var\(--o8-glass-elevated\)/)
  assert.match(ruleFor(`${rootPrefix}:has(> [data-tree-group="grp-review"]):not([style*="display: none"])`)?.declarations || '', /background:\s*var\(--o8-glass-review\)/)
  assert.match(style.textContent, /\[data-tree-group="grp-review"\]\s*\{[^}]*border-right:\s*0[^}]*padding:\s*0\.5rem 0\.75rem/)
  assert.match(style.textContent, /\[data-slot="aui_thread-content"\] > :where\(p, div\)\s*\{[^}]*padding-block:\s*0\.4375rem/)
  assert.match(style.textContent, /\[data-slot="aui_thread-content"\] > :where\(section, article, \[data-message-id\]\)\s*\{[^}]*padding:\s*0\.625rem 0\.75rem/)
  assert.match(style.textContent, /\[data-slot="aui_thread-content"\] > :where\(section, article, \[data-message-id\]\)\s*\{[^}]*border-radius:\s*0\.625rem[^}]*background:\s*color-mix/,
    'message groups need local glass surfaces instead of one flat ledger')
  assert.match(style.textContent, /\[data-slot="aui_thread-content"\] > :where\(section, article, \[data-message-id\]\):nth-child\(even\)/,
    'alternating message groups need a restrained hierarchy step')
  assert.match(ruleFor(`${rootPrefix}[data-slot="composer-rich-input"]`)?.declarations || '', /font-size:\s*0\.8125rem\s*!important/,
    'composer copy must remain readable at the compact density')
  assert.match(style.textContent, /\[data-slot="aui_thread-content"\] > :where\(section, article, \[data-message-id\]\)[^}]*\{[^}]*font-size:\s*0\.875rem/,
    'conversation copy must retain a readable primary tier')
  assert.doesNotMatch(style.textContent, /\[data-tree-group="grp-review"\] > :where\(div, section, article\)\s*\{/,
    'review styling must not flatten every direct container')
  assert.match(style.textContent, /\[data-tree-group="grp-review"\] > :where\(div, section, article\):not\(:has\(> :where\(div, section, article\)\)\)\s*\{[^}]*min-height:\s*2\.5rem[^}]*border:\s*1px solid color-mix/)
  assert.match(style.textContent, /:where\(button, \[role="button"\]\):active:not\(:disabled\):not\(\[aria-disabled="true"\]\)/)
  assert.match(style.textContent, /:where\(button:disabled, \[aria-disabled="true"\], \[data-disabled\]\)/)
  assert.match(style.textContent, /:where\(\[aria-invalid="true"\], \[data-state="error"\], \[data-status="error"\]\)/)
  assert.match(style.textContent, /--o8-motion:\s*180ms cubic-bezier\(0\.32, 0\.72, 0, 1\)/)
  assert.match(style.textContent, /@media \(max-width: 900px\)[\s\S]*grp-review[\s\S]*display:\s*none\s*!important/)
  assert.match(style.textContent, /@media \(max-width: 719px\)[\s\S]*grp-sessions[\s\S]*width:\s*12rem\s*!important/)
  assert.match(style.textContent, /@media \(max-width: 520px\)[\s\S]*grp-sessions[\s\S]*width:\s*8\.5rem\s*!important/)
  assert.match(style.textContent, /@media \(max-width: 380px\)[\s\S]*grp-sessions[\s\S]*width:\s*7rem\s*!important/)
  assert.match(style.textContent, /:where\(input, textarea, select, \[contenteditable="true"\]\):focus-visible/)
  assert.match(style.textContent, /outline:\s*2px solid color-mix\(in srgb, var\(--dt-ring\) 88%, transparent\)\s*!important/,
    'keyboard focus needs an unmistakable two-pixel perimeter')
  assert.match(style.textContent, /box-shadow:\s*0 0 0 3px color-mix\(in srgb, var\(--dt-ring\) 24%, transparent\)\s*!important/,
    'keyboard focus needs a visible adjacent halo')
  assert.match(ruleFor(`${rootPrefix}[data-slot="composer-surface"]`)?.declarations || '', /box-shadow:[^;]+inset[^;]+,/)
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

test('real browser preserves nested inspector structure and responsive conversation geometry', async () => {
  const env = await loadPlugin({ stored: { 'hermes.liquid-glass-wal.compactLayout': '1' } })
  const css = env.document.getElementById('hermes-liquid-glass-o8-style').textContent
  const dir = await mkdtemp(join(tmpdir(), 'liquid-glass-rendered-'))
  const fixture = join(dir, 'fixture.html')
  const html = `<!doctype html><html data-hermes-liquid-glass-layout="compact"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}:root{--dt-background:#111827;--background:#111827;--dt-card:#1f2937;--card:#1f2937;--dt-foreground:#f3f4f6;--foreground:#f3f4f6;--dt-border:#475569;--dt-ring:#60a5fa;--dt-primary:#60a5fa}.shell{display:flex;width:100vw;height:100vh}.pane{display:flex;flex-direction:column;min-width:0}.sessions{flex:0 0 16rem}.chat{flex:1 1 auto}.review{flex:0 0 24rem}.thread{flex:1;overflow:auto}.composer{flex:none}.nested{padding:4px}.leaf{padding:4px}
    ${css}
  </style></head><body><main class="shell"><section class="pane sessions"><header>Sessions</header><div data-tree-group="grp-sessions"><div data-slot="sidebar-content">Alpha</div></div></section><section class="pane chat"><header>Conversation</header><div class="thread" data-slot="aui_thread-viewport"><div data-slot="aui_thread-content"><article data-message-id="1">Message</article></div></div><div class="composer" data-slot="composer-root"><div data-slot="composer-surface"><textarea data-slot="composer-rich-input">Reply</textarea></div></div></section><section class="pane review"><header>Activity</header><div data-tree-group="grp-review"><section class="nested"><div class="leaf">Nested review row</div></section><article class="direct-leaf">Direct review row</article></div></section></main><pre id="result"></pre><script>
    {const q=s=>document.querySelector(s),r=e=>e.getBoundingClientRect(),cs=e=>getComputedStyle(e);let tries=0;const capture=()=>{if((innerWidth===0||innerHeight===0)&&tries++<20){setTimeout(capture,25);return}const out={viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],sessions:r(q('.sessions')).toJSON(),chat:r(q('.chat')).toJSON(),review:{...r(q('.review')).toJSON(),display:cs(q('.review')).display},composer:r(q('[data-slot="composer-surface"]')).toJSON(),nested:{border:cs(q('.nested')).borderBottomWidth,minHeight:cs(q('.nested')).minHeight},leaf:{border:cs(q('.leaf')).borderBottomWidth,minHeight:cs(q('.leaf')).minHeight},directLeaf:{border:cs(q('.direct-leaf')).borderBottomWidth,minHeight:cs(q('.direct-leaf')).minHeight}};q('#result').textContent=JSON.stringify(out)};capture()}
  </script></body></html>`
  await writeFile(fixture, html)
  const render = width => {
    let result = null
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const dumped = execFileSync('chromium', ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--force-device-scale-factor=1', `--user-data-dir=${join(dir, `profile-${width}-${attempt}`)}`, `--window-size=${width},900`, '--run-all-compositor-stages-before-draw', '--virtual-time-budget=750', '--dump-dom', `file://${fixture}`], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
      const raw = dumped.match(/<pre id="result">([^<]+)<\/pre>/)?.[1]
      assert.ok(raw, `rendered result missing at ${width}px on attempt ${attempt}`)
      result = JSON.parse(raw.replaceAll('&quot;', '"').replaceAll('&amp;', '&'))
      if (result.viewport[0] > 0 && result.viewport[1] > 0) return result
    }
    assert.fail(`viewport not initialized at ${width}px after 10 attempts: ${JSON.stringify(result)}`)
  }
  try {
    const wide = render(1440)
    assert.deepEqual(wide.scroll, wide.viewport, 'wide fixture must not overflow')
    const sessionsRatio = wide.sessions.width / wide.viewport[0]
    const chatRatio = wide.chat.width / wide.viewport[0]
    const reviewRatio = wide.review.width / wide.viewport[0]
    assert.ok(sessionsRatio >= 0.17 && sessionsRatio <= 0.20, `sessions ratio ${sessionsRatio} outside 17–20%`)
    assert.ok(chatRatio >= 0.58 && chatRatio <= 0.64, `chat ratio ${chatRatio} outside 58–64%`)
    assert.ok(reviewRatio >= 0.20 && reviewRatio <= 0.23, `review ratio ${reviewRatio} outside 20–23%`)
    assert.ok(Math.abs(wide.sessions.width + wide.chat.width + wide.review.width - wide.viewport[0]) <= 1,
      'wide panes must close the viewport without relying on stale exact widths')
    assert.equal(wide.nested.border, '0px', 'nested review container must remain structurally unflattened')
    assert.equal(wide.leaf.border, '0px', 'nested descendants remain owned by their component structure')
    assert.equal(wide.directLeaf.border, '1px', 'direct leaf row receives compact review hierarchy')

    const narrow = render(700)
    assert.deepEqual(narrow.scroll, narrow.viewport, 'narrow fixture must not overflow')
    assert.equal(narrow.review.display, 'none', 'narrow state preserves conversation instead of inspector takeover')
    assert.ok(narrow.sessions.width >= 191 && narrow.sessions.width <= 193)
    assert.ok(narrow.chat.width >= 507)
    assert.ok(narrow.composer.bottom <= narrow.viewport[1] && narrow.composer.height >= 62, 'composer remains visible and usable')

    const tablet = render(900)
    assert.deepEqual(tablet.scroll, tablet.viewport, 'tablet fixture must not overflow')
    assert.equal(tablet.review.display, 'none', 'tablet state must prioritize the conversation over a cramped inspector')
    assert.ok(tablet.chat.width >= 675, 'tablet conversation keeps at least 75% of the viewport')

    const phone = render(430)
    assert.deepEqual(phone.scroll, phone.viewport, 'phone fixture must not overflow')
    assert.equal(phone.review.display, 'none', 'phone inspector stays hidden')
    assert.ok(phone.sessions.width >= 135 && phone.sessions.width <= 137)
    assert.ok(phone.chat.width >= 293, 'phone conversation retains a usable primary reading column')

  } finally {
    await rm(dir, { recursive: true, force: true })
    env.dispose()
  }
})
