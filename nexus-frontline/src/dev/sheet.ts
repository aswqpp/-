// Phase 1 deliverable: SENTINEL Tier 0/3/5/6 (path A) drawn by the game's own
// vector code, on one sheet, with the in-game scale and 32px silhouettes.

import '@fontsource/ibm-plex-sans-kr/400.css'
import '@fontsource/ibm-plex-sans-kr/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-sans-condensed/500.css'
import '@fontsource/ibm-plex-sans-condensed/600.css'
import '../ui/tokens.css'
import './sheet.css'

import { Pen } from '../render/pen.ts'
import { GROUND } from '../render/palette.ts'
import { drawSentinel, SENTINEL_EXTENT, SENTINEL_SCALE, type SentinelVariant } from '../render/units/sentinel.ts'
import { drawReclaimer, RECLAIMER_EXTENT } from '../render/enemies/reclaimer.ts'

interface Note {
  /** anchor in the variant's unscaled local frame (cells) */
  at: [number, number]
  /** direction of the balloon from the pivot, degrees (0 = right, 90 = down) */
  deg: number
  text: string
}

interface TierDef {
  v: SentinelVariant
  label: string
  name: string
  en?: boolean
  total: number
  width: number
  notes: Note[]
  stats: [string, string][]
  em?: 'gold'
}

const PT_PER_CELL = 140

const TIERS: TierDef[] = [
  {
    v: 't0',
    label: 'TIER 0 · PROTOTYPE',
    name: '기본형',
    total: 200,
    width: 250,
    notes: [
      { at: [0.205, 0.365], deg: 52, text: '교량 레일 클램프 · 원래 장비의 흔적' },
      { at: [0.06, -0.095], deg: -58, text: '감시 카메라 렌즈, 교량 시절 그대로' },
      { at: [-0.095, 0], deg: -128, text: '에너지 코어 · 발광부는 이곳 하나' },
      { at: [-0.343, 0.09], deg: 160, text: '식별 번호 SNT-01' },
    ],
    stats: [
      ['피해 · 연사', '4 운동 · 0.60s'],
      ['DPS', '6.7'],
      ['사거리', '3.2칸'],
    ],
  },
  {
    v: 'a3',
    label: 'TIER 3 · MK-II EVOLUTION',
    name: 'MK-II 쌍열 포탑',
    total: 920,
    width: 262,
    notes: [
      { at: [0.42, 0.085], deg: 42, text: '포신 2개 · 2발 동시 발사' },
      { at: [-0.07, -0.33], deg: -112, text: '측면 탄창 추가' },
      { at: [-0.23, 0.17], deg: 150, text: '포탑 폭 0.32 → 0.40칸' },
    ],
    stats: [
      ['피해 · 연사', '4 × 2발 · 0.50s'],
      ['장갑 관통', '50%'],
      ['DPS', '16.0'],
    ],
  },
  {
    v: 'a5',
    label: 'TIER 5 · APEX EVOLUTION',
    name: 'APEX HAILSTORM',
    en: true,
    total: 4220,
    width: 282,
    notes: [
      { at: [0.4, 0.05], deg: 24, text: '6열 회전포 · 초당 12발' },
      { at: [0.33, 0.33], deg: 62, text: '베이스 재설계: 지지대 4개' },
      { at: [-0.06, -0.3], deg: -112, text: '회전 탄창 + 벨트 급탄' },
      { at: [-0.125, 0.4], deg: 128, text: '클램프는 남김' },
    ],
    stats: [
      ['피해', '3 × 초당 12발'],
      ['DPS · 집중 5중첩', '36.0 → 54.0'],
      ['장갑 관통', '50%'],
    ],
  },
  {
    v: 'a6',
    label: 'TIER 6 · SINGULARITY',
    name: 'VANGUARD-Ω',
    en: true,
    total: 11220,
    width: 314,
    em: 'gold',
    notes: [
      { at: [0.42, 0.07], deg: 36, text: 'GENESIS 유래 곡면 덮개 · 적의 형태' },
      { at: [-0.37, -0.37], deg: -165, text: '독립 회전 표적 지시기' },
      { at: [-0.05, -0.118], deg: -62, text: '크기 ×1.25 · #E5BA68 선 1개' },
    ],
    stats: [
      ['능력', '포화 사격 8s · 재사용 60s'],
      ['범위', '사거리 안 모든 적'],
      ['해금', '캠페인 3장 클리어 후'],
    ],
  },
]

const stage = document.getElementById('stage')!

function fit() {
  const s = Math.min(window.innerWidth / 1180, window.innerHeight / 820)
  stage.style.transform = `scale(${s})`
}
window.addEventListener('resize', fit)
fit()

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (html !== undefined) e.innerHTML = html
  return e
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const dpr = window.devicePixelRatio || 1
  const c = document.createElement('canvas')
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  c.style.width = `${w}px`
  c.style.height = `${h}px`
  const ctx = c.getContext('2d')!
  ctx.scale(dpr, dpr)
  return [c, ctx]
}

const SVGNS = 'http://www.w3.org/2000/svg'
function svg(w: number, h: number): SVGSVGElement {
  const s = document.createElementNS(SVGNS, 'svg')
  s.setAttribute('width', String(w))
  s.setAttribute('height', String(h))
  s.setAttribute('viewBox', `0 0 ${w} ${h}`)
  return s
}
function svgEl(name: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVGNS, name)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v))
  return e
}

function header() {
  const hd = el('header', 'hd')
  hd.append(
    el('div', 'lbl', 'NX-ART-SNT-A · EVOLUTION SHEET · R1'),
    el('h1', '', 'SENTINEL — A 경로 화력 진화'),
    el('p', '', '교량 감시 포탑 개조형 · 고정 베이스 + 회전 상부 · 광원 좌상단 고정'),
  )
  stage.append(hd)

  // scale bar for the large drawings
  const sb = el('div', 'scalebar')
  const w = PT_PER_CELL
  const s = svg(w + 2, 18)
  s.append(
    svgEl('line', { x1: 1, y1: 12.5, x2: w + 1, y2: 12.5, stroke: '#56606B', 'stroke-width': 1 }),
    svgEl('line', { x1: 1.5, y1: 6, x2: 1.5, y2: 17, stroke: '#56606B', 'stroke-width': 1 }),
    svgEl('line', { x1: w / 2 + 1, y1: 9, x2: w / 2 + 1, y2: 16, stroke: '#56606B', 'stroke-width': 1 }),
    svgEl('line', { x1: w + 0.5, y1: 6, x2: w + 0.5, y2: 17, stroke: '#56606B', 'stroke-width': 1 }),
  )
  const t = el('div', 'lbl', `1 CELL · 48PT IN GAME · DRAWN AT ${PT_PER_CELL}PT`)
  sb.append(t, s)
  stage.append(sb)
}

function tierPanel(def: TierDef): HTMLElement {
  const p = el('section', 'panel tier')
  if (def.em) p.dataset.em = def.em
  p.style.width = `${def.width}px`
  const top = el('div', 'top')
  top.append(el('div', 'lbl', def.label), el('div', 'lbl', `누적 <span class="mono">${def.total.toLocaleString('en-US')}</span>`))
  const name = el('div', 'name', def.en ? `<span class="en">${def.name}</span>` : def.name)
  const draw = el('div', 'draw')
  const W = def.width
  const H = 222
  const [cv, ctx] = canvas(W, H)
  const s = SENTINEL_SCALE[def.v]
  // centre the drawing on its own bounding box (barrel side is longer)
  const ext = SENTINEL_EXTENT[def.v] * PT_PER_CELL
  const cx = Math.round(W / 2 - 0.05 * s * PT_PER_CELL)
  const cy = Math.round(H / 2 - 0.02 * PT_PER_CELL)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(PT_PER_CELL, PT_PER_CELL)
  const pen = new Pen(ctx, PT_PER_CELL)
  drawSentinel(pen, def.v, { turret: 0, spin: 0.35, aux: -0.9, glow: 1 })
  ctx.restore()

  const o = svg(W, H)
  def.notes.forEach((n, i) => {
    const ax = cx + n.at[0] * s * PT_PER_CELL
    const ay = cy + n.at[1] * s * PT_PER_CELL
    const R = ext + 16
    const a = (n.deg * Math.PI) / 180
    const bx = Math.max(12, Math.min(W - 12, cx + Math.cos(a) * R))
    const by = Math.max(10, Math.min(H - 10, cy + Math.sin(a) * R))
    // leader: dot on the part, straight line, balloon with the note number
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy)
    const ex = bx - (dx / len) * 8
    const ey = by - (dy / len) * 8
    o.append(
      svgEl('line', { x1: ax, y1: ay, x2: ex, y2: ey, stroke: '#8A949E', 'stroke-width': 1 }),
      svgEl('circle', { cx: ax, cy: ay, r: 2, fill: '#EDF2F6' }),
      svgEl('circle', { cx: bx, cy: by, r: 8, fill: '#191F26', stroke: '#8A949E', 'stroke-width': 1 }),
    )
    const t = svgEl('text', {
      x: bx,
      y: by + 0.5,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#EDF2F6',
      'font-family': 'IBM Plex Mono, IBM Plex Sans KR',
      'font-size': 11,
      'font-weight': 500,
    })
    t.textContent = String(i + 1)
    o.append(t)
  })
  draw.append(cv, o)

  const legend = el('ol', 'legend')
  def.notes.forEach((n, i) => {
    const li = el('li')
    li.append(el('b', '', String(i + 1)), el('span', '', n.text))
    legend.append(li)
  })

  const stats = el('dl', 'stats')
  for (const [k, v] of def.stats) stats.append(el('dt', '', k), el('dd', '', v))

  p.append(top, name, draw, legend, stats)
  return p
}

function strip(): HTMLElement {
  const cells = 10
  const rows = 4
  const CELL = 48
  const W = cells * CELL
  const H = rows * CELL
  const box = el('section', 'panel box')
  box.style.width = `${W + 24}px`
  box.append(el('div', 'lbl', 'IN-GAME SCALE · ZOOM 1.0 · 배치 모드 격자 표시'))
  const [cv, ctx] = canvas(W, H)
  ctx.fillStyle = GROUND.ground
  ctx.fillRect(0, 0, W, H)
  // path row
  ctx.fillStyle = GROUND.path
  ctx.fillRect(0, 2 * CELL, W, CELL)
  ctx.fillStyle = GROUND.pathEdge
  ctx.fillRect(0, 2 * CELL, W, 1)
  ctx.fillRect(0, 3 * CELL - 1, W, 1)
  // placement grid (only visible in placement mode in the game)
  ctx.strokeStyle = GROUND.gridLine
  ctx.lineWidth = 1
  for (let x = 1; x < cells; x++) {
    for (const [y0, y1] of [
      [0, 2],
      [3, 4],
    ]) {
      ctx.beginPath()
      ctx.moveTo(x * CELL + 0.5, y0 * CELL)
      ctx.lineTo(x * CELL + 0.5, y1 * CELL)
      ctx.stroke()
    }
  }
  for (const y of [1]) {
    ctx.beginPath()
    ctx.moveTo(0, y * CELL + 0.5)
    ctx.lineTo(W, y * CELL + 0.5)
    ctx.stroke()
  }

  const enemies: [number, number][] = [
    [2.6, 2.5],
    [6.9, 2.5],
    [9.2, 2.5],
  ]
  ctx.save()
  ctx.scale(CELL, CELL)
  const pen = new Pen(ctx, CELL)
  enemies.forEach(([x, y], i) => {
    pen.save()
    pen.translate(x, y)
    drawReclaimer(pen, i)
    pen.restore()
  })
  const units: [SentinelVariant, number, number, number][] = [
    ['t0', 1.5, 1.5, 0],
    ['a3', 3.5, 1.5, 0],
    ['a5', 5.5, 1.5, 1],
    ['a6', 8, 1.5, 2],
    ['t0', 4.5, 3.5, 0],
  ]
  for (const [v, x, y, target] of units) {
    let best = enemies[target]
    if (v === 't0' && y > 3) best = enemies[0]
    const a = Math.atan2(best[1] - y, best[0] - x)
    pen.save()
    pen.translate(x, y)
    drawSentinel(pen, v, { turret: a, spin: 0.35, aux: a + 1.4, glow: 1 })
    pen.restore()
  }
  ctx.restore()
  box.append(cv)
  box.append(el('div', 'cap', '터렛은 표적을 향해 회전, 음영은 화면 좌상단 광원 기준 유지. 적 R-07 수거형과 비교.'))
  return box
}

function silhouettes(): HTMLElement {
  const box = el('section', 'panel box')
  box.style.width = '376px'
  box.append(el('div', 'lbl', '32PX MONOCHROME SILHOUETTE · 2× VIEW / 1× ACTUAL'))
  const items: { name: string; draw: (p: Pen) => void }[] = [
    { name: 'T0', draw: (p) => drawSentinel(p, 't0', { turret: 0 }) },
    { name: 'T3', draw: (p) => drawSentinel(p, 'a3', { turret: 0 }) },
    { name: 'T5', draw: (p) => drawSentinel(p, 'a5', { turret: 0, spin: 0.35 }) },
    { name: 'T6', draw: (p) => drawSentinel(p, 'a6', { turret: 0, spin: 0.35, aux: -0.9 }) },
    { name: 'R-07', draw: (p) => drawReclaimer(p) },
  ]
  const maxExt = Math.max(...Object.values(SENTINEL_EXTENT), RECLAIMER_EXTENT)
  const px = 32 / (2 * (maxExt + 0.02))
  const make = () =>
    items.map((it) => {
      const c = document.createElement('canvas')
      c.width = 32
      c.height = 32
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#EDF2F6'
      ctx.fillRect(0, 0, 32, 32)
      ctx.translate(16 - 0.04 * px, 16)
      ctx.scale(px, px)
      const pen = new Pen(ctx, px)
      pen.silhouette = true
      it.draw(pen)
      return c
    })
  const big = el('div', 'sil-row')
  make().forEach((c, i) => {
    c.style.width = '64px'
    c.style.height = '64px'
    const f = el('figure')
    f.append(c, el('figcaption', '', items[i].name))
    big.append(f)
  })
  const small = el('div', 'sil-row')
  small.style.marginTop = '12px'
  small.style.gap = '40px'
  small.style.paddingLeft = '16px'
  make().forEach((c) => {
    c.style.width = '32px'
    c.style.height = '32px'
    small.append(c)
  })
  box.append(big, small)
  box.append(el('div', 'cap', '공통 축척으로 축소. 크기 차이도 그대로 보인다.'))
  return box
}

function titleBlock(): HTMLElement {
  const box = el('section', 'panel box')
  box.style.width = '236px'
  box.append(el('div', 'lbl', 'TITLE BLOCK'))
  const rows: [string, string, boolean?][] = [
    ['도면', 'NX-ART-SNT-A-001'],
    ['대상', 'SNT-01 SENTINEL'],
    ['경로', 'A 화력 · T0/3/5/6'],
    ['축척', `상단 ${PT_PER_CELL}pt/칸 · 하단 48pt/칸`, true],
    ['광원', '좌상단 45° 고정', true],
    ['재질', '3단 명암 + 1pt 패널선', true],
    ['디테일', '볼트2 케이블1 힌지·급탄1 방열판1', true],
    ['개정', 'R1 · 2026-11-27'],
  ]
  const t = el('table', 'tb')
  for (const [k, v, kr] of rows) {
    const tr = el('tr')
    tr.append(el('th', '', k), el('td', kr ? 'kr' : '', v))
    t.append(tr)
  }
  box.append(t)
  return box
}

async function main() {
  await Promise.all([
    document.fonts.load('600 20px "IBM Plex Mono"'),
    document.fonts.load('500 11px "IBM Plex Mono"'),
    document.fonts.load('400 13px "IBM Plex Sans KR"'),
    document.fonts.load('600 20px "IBM Plex Sans KR"'),
    document.fonts.load('500 11px "IBM Plex Sans Condensed"'),
    document.fonts.load('600 15px "IBM Plex Sans Condensed"'),
  ])
  header()
  const row = el('div', 'tiers')
  for (const t of TIERS) row.append(tierPanel(t))
  stage.append(row)
  const bottom = el('div', 'bottom')
  bottom.append(strip(), silhouettes(), titleBlock())
  stage.append(bottom)
  document.body.dataset.ready = '1'
}

void main()
