// Vector drawing helpers on Canvas 2D.
//
// Everything is drawn in a local frame where 1 unit = 1 map cell (48pt) and +x is
// "forward" for a rotating part. The pen tracks the world rotation of the current
// frame so that shading always follows the fixed top-left light (02장 2-1), even on
// a turret that has been rotated. That is what lets us bake the same turret at many
// angles without the highlight spinning with it.

import { C, type Mat } from './palette.ts'

export type Pt = readonly [number, number]

const LIGHT: Pt = norm([-1, -1]) // direction from a surface towards the light, screen space (y down)
const LIGHT_T = 0.3 // |n·L| below this counts as a base face

function norm(v: Pt): Pt {
  const l = Math.hypot(v[0], v[1]) || 1
  return [v[0] / l, v[1] / l]
}

function rot(v: Pt, a: number): Pt {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]
}

function centroid(pts: readonly Pt[]): Pt {
  let x = 0
  let y = 0
  for (const p of pts) {
    x += p[0]
    y += p[1]
  }
  return [x / pts.length, y / pts.length]
}

function intersect(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt {
  const d1x = a2[0] - a1[0]
  const d1y = a2[1] - a1[1]
  const d2x = b2[0] - b1[0]
  const d2y = b2[1] - b1[1]
  const den = d1x * d2y - d1y * d2x
  if (Math.abs(den) < 1e-9) return [(a2[0] + b1[0]) / 2, (a2[1] + b1[1]) / 2]
  const t = ((b1[0] - a1[0]) * d2y - (b1[1] - a1[1]) * d2x) / den
  return [a1[0] + d1x * t, a1[1] + d1y * t]
}

/** Inset a convex polygon by d. */
export function inset(pts: readonly Pt[], d: number): Pt[] {
  const c = centroid(pts)
  const n = pts.length
  const lines: [Pt, Pt][] = []
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    let nx = b[1] - a[1]
    let ny = -(b[0] - a[0])
    const l = Math.hypot(nx, ny) || 1
    nx /= l
    ny /= l
    // make the normal point inwards
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    if ((c[0] - mx) * nx + (c[1] - my) * ny < 0) {
      nx = -nx
      ny = -ny
    }
    lines.push([
      [a[0] + nx * d, a[1] + ny * d],
      [b[0] + nx * d, b[1] + ny * d],
    ])
  }
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const prev = lines[(i + n - 1) % n]
    const cur = lines[i]
    out.push(intersect(prev[0], prev[1], cur[0], cur[1]))
  }
  return out
}

/**
 * Rectangle with 45° chamfers. c = [tl, tr, br, bl] chamfer sizes (0 = square corner).
 * Points run clockwise on screen.
 */
export function chamfer(x0: number, y0: number, x1: number, y1: number, c: readonly [number, number, number, number]): Pt[] {
  const [tl, tr, br, bl] = c
  const p: Pt[] = []
  if (tl > 0) p.push([x0, y0 + tl], [x0 + tl, y0])
  else p.push([x0, y0])
  if (tr > 0) p.push([x1 - tr, y0], [x1, y0 + tr])
  else p.push([x1, y0])
  if (br > 0) p.push([x1, y1 - br], [x1 - br, y1])
  else p.push([x1, y1])
  if (bl > 0) p.push([x0 + bl, y1], [x0, y1 - bl])
  else p.push([x0, y1])
  return p
}

/** Mirror a polygon across y = 0 (keeps winding sensible for fills). */
export function mirrorY(pts: readonly Pt[]): Pt[] {
  return pts.map(([x, y]) => [x, -y] as Pt).reverse()
}

interface Frame {
  rot: number
  lw: number
}

export class Pen {
  readonly ctx: CanvasRenderingContext2D
  private rotW = 0
  /** One point of screen space in local units. Every "1px" line uses this. */
  lw: number
  private stack: Frame[] = []
  /** Silhouette mode: every fill becomes flat black, lines and glows are skipped. */
  silhouette = false

  constructor(ctx: CanvasRenderingContext2D, ptPerUnit: number) {
    this.ctx = ctx
    this.lw = 1 / ptPerUnit
  }

  save() {
    this.ctx.save()
    this.stack.push({ rot: this.rotW, lw: this.lw })
  }

  restore() {
    this.ctx.restore()
    const f = this.stack.pop()
    if (f) {
      this.rotW = f.rot
      this.lw = f.lw
    }
  }

  translate(x: number, y: number) {
    this.ctx.translate(x, y)
  }

  rotate(a: number) {
    this.ctx.rotate(a)
    this.rotW += a
  }

  scale(s: number) {
    this.ctx.scale(s, s)
    this.lw /= s
  }

  /** Light direction expressed in the current local frame. */
  private lightLocal(): Pt {
    return rot(LIGHT, -this.rotW)
  }

  private tone(nLocal: Pt, m: Mat): string {
    const nw = rot(nLocal, this.rotW)
    const d = nw[0] * LIGHT[0] + nw[1] * LIGHT[1]
    if (d > LIGHT_T) return m.light
    if (d < -LIGHT_T) return m.shadow
    return m.base
  }

  private fillStyle(c: string) {
    this.ctx.fillStyle = this.silhouette ? '#000' : c
  }

  poly(pts: readonly Pt[]) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.closePath()
  }

  fillPoly(pts: readonly Pt[], color: string) {
    this.poly(pts)
    this.fillStyle(color)
    this.ctx.fill()
  }

  strokePoly(pts: readonly Pt[], color: string, w = this.lw) {
    if (this.silhouette) return
    this.poly(pts)
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = w
    this.ctx.lineJoin = 'miter'
    this.ctx.stroke()
  }

  /**
   * A machined plate: base-tone top face, one bevel strip per edge toned by the
   * edge's world-space normal against the light, 1pt seam outline.
   * Convex polygons only; compose concave shapes from several plates.
   */
  plate(pts: readonly Pt[], m: Mat, bevel = 0.03) {
    const inner = inset(pts, bevel)
    const c = centroid(pts)
    this.fillPoly(pts, m.base)
    if (!this.silhouette) {
      const n = pts.length
      for (let i = 0; i < n; i++) {
        const a = pts[i]
        const b = pts[(i + 1) % n]
        let nx = b[1] - a[1]
        let ny = -(b[0] - a[0])
        const mx = (a[0] + b[0]) / 2
        const my = (a[1] + b[1]) / 2
        if ((mx - c[0]) * nx + (my - c[1]) * ny < 0) {
          nx = -nx
          ny = -ny
        }
        const t = this.tone(norm([nx, ny]), m)
        if (t === m.base) continue
        this.fillPoly([a, b, inner[(i + 1) % n], inner[i]], t)
      }
    }
    this.strokePoly(pts, m.seam)
  }

  /** Round plate (rotating parts and lenses only, per 2-2). Bevel arcs follow world light. */
  disc(cx: number, cy: number, r: number, m: Mat, bevel = 0.025) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    this.fillStyle(m.base)
    ctx.fill()
    if (!this.silhouette && bevel > 0) {
      const L = this.lightLocal()
      const la = Math.atan2(L[1], L[0])
      const span = Math.acos(LIGHT_T) // same threshold as plate edges
      const ring = (a0: number, a1: number, color: string) => {
        ctx.beginPath()
        ctx.arc(cx, cy, r, a0, a1)
        ctx.arc(cx, cy, Math.max(0, r - bevel), a1, a0, true)
        ctx.closePath()
        ctx.fillStyle = color
        ctx.fill()
      }
      ring(la - span, la + span, m.light)
      ring(la + Math.PI - span, la + Math.PI + span, m.shadow)
    }
    if (!this.silhouette) {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = m.seam
      ctx.lineWidth = this.lw
      ctx.stroke()
    }
  }

  /** Hex bolt head. Straight edges, so it obeys "curves only on rotating parts and lenses". */
  bolt(x: number, y: number, r = 0.022, m: Mat) {
    const pts: Pt[] = []
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + Math.PI / 6
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r])
    }
    this.plate(pts, m, r * 0.42)
  }

  /** Dark glass lens with a small fixed highlight toward the light. */
  lens(x: number, y: number, r: number) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    this.fillStyle('#0E1216')
    ctx.fill()
    if (this.silhouette) return
    ctx.strokeStyle = '#2B323A'
    ctx.lineWidth = this.lw
    ctx.stroke()
    const L = this.lightLocal()
    ctx.beginPath()
    ctx.arc(x + L[0] * r * 0.45, y + L[1] * r * 0.45, r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#56606B'
    ctx.fill()
  }

  /** Thin panel line (seam) — not counted as a mechanical detail. */
  seam(pts: readonly Pt[], color: string, w = this.lw) {
    if (this.silhouette) return
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.strokeStyle = color
    ctx.lineWidth = w
    ctx.lineCap = 'butt'
    ctx.stroke()
  }

  /** Cable run: straight segments with 45° bends, dark sheath plus a lit top edge. */
  cable(pts: readonly Pt[], w: number, m: Mat) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.lineJoin = 'bevel'
    ctx.lineCap = 'butt'
    ctx.strokeStyle = this.silhouette ? '#000' : m.seam
    ctx.lineWidth = w
    ctx.stroke()
    if (this.silhouette) return
    ctx.strokeStyle = m.base
    ctx.lineWidth = w * 0.45
    ctx.stroke()
  }

  /**
   * The single glowing energy core of a unit (2-2). Gradients are allowed here
   * and on attack effects only. intensity: 0..1 from settings.
   */
  core(pts: readonly Pt[], intensity = 1, color: string = C.cyan) {
    if (this.silhouette) {
      this.fillPoly(pts, '#000')
      return
    }
    const ctx = this.ctx
    const c = centroid(pts)
    let r = 0
    for (const p of pts) r = Math.max(r, Math.hypot(p[0] - c[0], p[1] - c[1]))
    if (intensity > 0) {
      const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r * 2.4)
      g.addColorStop(0, hexA(color, 0.42 * intensity))
      g.addColorStop(1, hexA(color, 0))
      ctx.beginPath()
      ctx.arc(c[0], c[1], r * 2.4, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
    }
    this.fillPoly(pts, color)
    this.strokePoly(pts, '#0E3F47')
    // hot centre
    const hot = inset(pts, r * 0.38)
    this.fillPoly(hot, '#C9F6FC')
  }

  /**
   * Smooth curved body (enemies and GENESIS-derived parts). Shading is done by
   * offsetting the shape along the light inside a clip, so it works on any curve:
   * light rim top-left, base body, shadow rim bottom-right.
   */
  smooth(path: Path2D, m: Mat, rim = 0.03) {
    const ctx = this.ctx
    if (this.silhouette) {
      ctx.fillStyle = '#000'
      ctx.fill(path)
      return
    }
    const L = this.lightLocal()
    ctx.save()
    ctx.clip(path)
    ctx.fillStyle = m.light
    ctx.fill(path)
    // base: shape shifted away from the light
    ctx.save()
    ctx.translate(-L[0] * rim, -L[1] * rim)
    ctx.fillStyle = m.base
    ctx.fill(path)
    ctx.restore()
    // shadow: symmetric difference of the shape and the shape shifted toward the light
    const both = new Path2D()
    both.addPath(path)
    both.addPath(path, new DOMMatrix([1, 0, 0, 1, L[0] * rim, L[1] * rim]))
    ctx.fillStyle = m.shadow
    ctx.fill(both, 'evenodd')
    ctx.restore()
    ctx.strokeStyle = m.seam
    ctx.lineWidth = this.lw
    ctx.stroke(path)
  }

  /** Red sensor dot on an enemy hull. */
  sensor(x: number, y: number, r: number) {
    const ctx = this.ctx
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    this.fillStyle(C.red)
    ctx.fill()
  }

  /** Stencilled ID number on armour (e.g. SNT-01). Size in local units (cap height ≈ size). */
  stencil(text: string, x: number, y: number, size: number, color: string, angle = 0) {
    if (this.silhouette) return
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    // Canvas rounds tiny font sizes, so draw at 100x and scale down.
    ctx.scale(size / 100, size / 100)
    ctx.font = '600 100px "IBM Plex Mono"'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillStyle = color
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }

  /** A single straight accent line (Tier 6 gold trim). */
  trim(pts: readonly Pt[], color: string, w: number) {
    if (this.silhouette) return
    this.seam(pts, color, w)
  }
}

export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
