// Screenshot helper for self-review (19장).
// usage: node tools/shoot.mjs <url-path> <out.png> [WxH ...] [--dpr=2]
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')

const args = process.argv.slice(2)
const path = args[0]
const out = args[1]
const sizes = args.slice(2).filter((a) => /^\d+x\d+$/.test(a))
const dprArg = args.find((a) => a.startsWith('--dpr='))
const dpr = dprArg ? Number(dprArg.slice(6)) : 2
const base = process.env.BASE ?? 'http://127.0.0.1:5190'

const browser = await chromium.launch()
for (const size of sizes.length ? sizes : ['1180x820']) {
  const [w, h] = size.split('x').map(Number)
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(base + path, { waitUntil: 'networkidle' })
  await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 })
  await page.waitForTimeout(150)
  const file = sizes.length > 1 ? out.replace(/\.png$/, `-${w}x${h}.png`) : out
  await page.screenshot({ path: file })
  console.log('saved', file, errors.length ? 'ERRORS: ' + errors.join(' | ') : '')
  await page.close()
}
await browser.close()
