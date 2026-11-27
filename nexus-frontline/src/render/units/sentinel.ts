// SNT — SENTINEL. Originally the bridge-watch turret of Haewon Bridge 3; the
// engineering corps only swapped its magazine. Trace of the original equipment:
// the bridge rail clamp on the base (two jaws gripping nothing).
//
// Local frame: 1 unit = 1 cell, origin = turret pivot, turret faces +x.
// Detail budget (2-2, 3–5 per unit): clamp bolt ×2, cable, hinge or belt feed,
// heat sink. Panel lines and the stencil do not count.

import { MAT } from '../palette.ts'
import { chamfer, type Pen, type Pt } from '../pen.ts'

export type SentinelVariant = 't0' | 'a3' | 'a5' | 'a6'

export interface SentinelPose {
  /** Turret angle in radians (0 = +x). */
  turret: number
  /** Rotary barrel phase (A5/A6). */
  spin?: number
  /** Independent target designator angle (A6). */
  aux?: number
  /** Energy-core glow, 0..1 (settings: glow intensity). */
  glow?: number
}

export const SENTINEL_SCALE: Record<SentinelVariant, number> = { t0: 1, a3: 1, a5: 1, a6: 1.25 }

/** Furthest extent from the pivot in cells, used to size bake textures and fit silhouettes. */
export const SENTINEL_EXTENT: Record<SentinelVariant, number> = { t0: 0.56, a3: 0.56, a5: 0.58, a6: 0.73 }

const STENCIL = '#262C33'

export function drawSentinel(p: Pen, v: SentinelVariant, pose: SentinelPose) {
  p.save()
  p.scale(SENTINEL_SCALE[v])
  if (v === 't0' || v === 'a3') basePlate(p)
  else baseOutrigger(p)
  if (v === 'a6') designator(p, pose.aux ?? -0.6)
  p.save()
  p.rotate(pose.turret)
  if (v === 't0') turretT0(p, pose)
  else if (v === 'a3') turretA3(p, pose)
  else turretRotary(p, pose, v === 'a6')
  p.restore()
  p.restore()
}

// ---------------------------------------------------------------- bases

/** Tier 0–4: the original bridge turret plate with its rail clamp. */
function basePlate(p: Pen) {
  // rail clamp: bar + two jaws (original equipment trace)
  p.plate(chamfer(-0.27, 0.17, 0.27, 0.27, [0, 0, 0.02, 0.02]), MAT.gun, 0.022)
  p.plate(chamfer(-0.29, 0.22, -0.12, 0.43, [0, 0, 0.025, 0.075]), MAT.frame, 0.028)
  p.plate(chamfer(0.12, 0.22, 0.29, 0.43, [0, 0, 0.075, 0.025]), MAT.frame, 0.028)
  p.bolt(-0.205, 0.365, 0.027, MAT.hull)
  p.bolt(0.205, 0.365, 0.027, MAT.hull)
  // deck plate
  // low, wide rail-mount deck: the bearing ring rises above it, so the turret
  // outline (not the deck) carries the silhouette
  const deck = chamfer(-0.37, -0.2, 0.37, 0.21, [0.08, 0.08, 0.04, 0.04])
  p.plate(deck, MAT.frame, 0.038)
  p.seam([[-0.37, 0.06], [-0.3, 0.06]], MAT.frame.seam)
  p.seam([[0.3, 0.06], [0.37, 0.06]], MAT.frame.seam)
  p.stencil('SNT-01', -0.343, 0.005, 0.045, STENCIL, -Math.PI / 2)
  // power cable into the bearing
  p.cable([[0.41, -0.13], [0.3, -0.13], [0.22, -0.08]], 0.04, MAT.gun)
  bearing(p, 0.24)
}

/** Tier 5+: redesigned as a rotary-cannon mount — four stabiliser legs, octagonal hub. */
function baseOutrigger(p: Pen) {
  for (let k = 0; k < 4; k++) {
    p.save()
    p.rotate(Math.PI / 4 + (k * Math.PI) / 2)
    p.plate(chamfer(0.16, -0.055, 0.42, 0.055, [0, 0.025, 0.025, 0]), MAT.frame, 0.022)
    p.plate(chamfer(0.39, -0.095, 0.52, 0.095, [0, 0.045, 0.045, 0]), MAT.gun, 0.026)
    p.seam([[0.455, -0.07], [0.455, 0.07]], MAT.gun.seam)
    p.restore()
  }
  // the clamp survives, squeezed between the two rear legs
  p.plate(chamfer(-0.18, 0.24, 0.18, 0.32, [0, 0, 0.015, 0.015]), MAT.gun, 0.02)
  p.plate(chamfer(-0.19, 0.29, -0.06, 0.44, [0, 0, 0.02, 0.05]), MAT.frame, 0.024)
  p.plate(chamfer(0.06, 0.29, 0.19, 0.44, [0, 0, 0.05, 0.02]), MAT.frame, 0.024)
  p.bolt(-0.125, 0.395, 0.024, MAT.hull)
  p.bolt(0.125, 0.395, 0.024, MAT.hull)
  p.plate(chamfer(-0.28, -0.28, 0.28, 0.28, [0.095, 0.095, 0.095, 0.095]), MAT.frame, 0.04)
  // stencil runs along the front-right leg
  p.save()
  p.rotate(-Math.PI / 4)
  p.stencil('SNT-01', 0.42, 0, 0.045, STENCIL)
  p.restore()
  p.cable([[-0.45, 0.04], [-0.34, 0.04], [-0.27, -0.03]], 0.04, MAT.gun)
  bearing(p, 0.27)
}

function bearing(p: Pen, r: number) {
  p.disc(0, 0, r, MAT.gun, 0.03)
  p.disc(0, 0, r - 0.045, MAT.frame, 0.018)
}

// ---------------------------------------------------------------- turrets

function heatSink(p: Pen, x0: number, x1: number, h: number) {
  p.plate(chamfer(x0, -h, x1, h, [0.03, 0, 0, 0.03]), MAT.gun, 0.02)
  for (const y of [-h * 0.5, 0, h * 0.5]) p.seam([[x0 + 0.012, y], [x1 - 0.004, y]], MAT.gun.light)
}

function turretT0(p: Pen, pose: SentinelPose) {
  heatSink(p, -0.31, -0.225, 0.1)
  const housing: Pt[] = [
    [-0.24, -0.12], [-0.2, -0.16], [0.08, -0.16], [0.17, -0.07],
    [0.17, 0.07], [0.08, 0.16], [-0.2, 0.16], [-0.24, 0.12],
  ]
  p.plate(housing, MAT.hull, 0.036)
  p.strokePoly(chamfer(-0.175, -0.095, 0.03, 0.095, [0, 0.02, 0.02, 0]), MAT.hull.seam)
  p.plate(chamfer(-0.2, -0.035, -0.165, 0.035, [0, 0, 0, 0]), MAT.frame, 0.01) // hatch hinge
  p.core(chamfer(-0.125, -0.03, -0.065, 0.03, [0.015, 0.015, 0.015, 0.015]), pose.glow ?? 1)
  p.plate(chamfer(0.12, -0.065, 0.21, 0.065, [0, 0.025, 0.025, 0]), MAT.frame, 0.02) // mantlet
  p.plate(chamfer(0.2, -0.032, 0.5, 0.032, [0, 0, 0, 0]), MAT.gun, 0.012)
  p.plate(chamfer(0.46, -0.052, 0.56, 0.052, [0, 0.015, 0.015, 0]), MAT.gun, 0.014)
  p.seam([[0.51, -0.052], [0.51, 0.052]], MAT.gun.seam)
  p.lens(0.06, -0.095, 0.038) // the bridge camera, still fitted
}

function turretA3(p: Pen, pose: SentinelPose) {
  heatSink(p, -0.32, -0.235, 0.11)
  // side magazine for the second barrel
  p.plate(chamfer(-0.2, -0.37, 0.07, -0.185, [0.04, 0.04, 0, 0]), MAT.frame, 0.028)
  p.plate(chamfer(-0.17, -0.34, 0.04, -0.3, [0, 0, 0, 0]), MAT.gun, 0.01)
  for (const x of [-0.12, -0.065, -0.01]) p.seam([[x, -0.29], [x, -0.2]], MAT.frame.seam)
  const housing: Pt[] = [
    [-0.25, -0.15], [-0.21, -0.2], [0.07, -0.2], [0.18, -0.09],
    [0.18, 0.09], [0.07, 0.2], [-0.21, 0.2], [-0.25, 0.15],
  ]
  p.plate(housing, MAT.hull, 0.038)
  p.strokePoly(chamfer(-0.185, -0.13, 0.02, 0.13, [0, 0.025, 0.025, 0]), MAT.hull.seam)
  p.plate(chamfer(-0.215, -0.035, -0.18, 0.035, [0, 0, 0, 0]), MAT.frame, 0.01) // hatch hinge
  p.core(chamfer(-0.135, -0.03, -0.075, 0.03, [0.015, 0.015, 0.015, 0.015]), pose.glow ?? 1)
  p.plate(chamfer(0.13, -0.145, 0.22, 0.145, [0, 0.035, 0.035, 0]), MAT.frame, 0.022)
  for (const y of [-0.085, 0.085]) {
    p.plate(chamfer(0.21, y - 0.03, 0.49, y + 0.03, [0, 0, 0, 0]), MAT.gun, 0.011)
    p.plate(chamfer(0.46, y - 0.048, 0.56, y + 0.048, [0, 0.014, 0.014, 0]), MAT.gun, 0.013)
    p.seam([[0.51, y - 0.048], [0.51, y + 0.048]], MAT.gun.seam)
  }
  p.lens(0.1, 0, 0.034)
}

/** A5 HAILSTORM and A6 VANGUARD-Ω share the rotary body; A6 adds the GENESIS cowling and gold trim. */
function turretRotary(p: Pen, pose: SentinelPose, omega: boolean) {
  // drive motor + heat sink fins
  p.plate(chamfer(-0.35, -0.13, -0.2, 0.13, [0.045, 0, 0, 0.045]), MAT.gun, 0.024)
  for (const x of [-0.31, -0.275, -0.24]) p.seam([[x, -0.11], [x, 0.11]], MAT.gun.light)
  // drum magazine (rotating part, so round is allowed)
  p.disc(-0.06, -0.255, 0.13, MAT.frame, 0.03)
  p.disc(-0.06, -0.255, 0.072, MAT.gun, 0.018)
  p.seam([[-0.06, -0.327], [-0.06, -0.183]], MAT.gun.seam)
  // belt feed from drum to receiver
  p.plate(chamfer(0.02, -0.215, 0.11, -0.135, [0, 0.02, 0, 0]), MAT.gun, 0.014)
  for (const x of [0.045, 0.07, 0.095]) p.seam([[x, -0.21], [x, -0.14]], MAT.gun.light)
  const body: Pt[] = [[-0.23, -0.15], [0.1, -0.15], [0.16, -0.09], [0.16, 0.09], [0.1, 0.15], [-0.23, 0.15]]
  p.plate(body, MAT.hull, 0.036)
  p.seam([[-0.03, -0.12], [-0.03, 0.12]], MAT.hull.seam)
  p.core(chamfer(-0.17, -0.035, -0.095, 0.035, [0.016, 0.016, 0.016, 0.016]), pose.glow ?? 1)
  if (omega) p.trim([[-0.2, -0.118], [0.075, -0.118]], '#E5BA68', 0.014)
  p.plate(chamfer(0.12, -0.1, 0.18, 0.1, [0, 0.02, 0.02, 0]), MAT.frame, 0.016)
  if (omega) cowling(p, pose.spin ?? 0)
  else barrels(p, pose.spin ?? 0)
  p.lens(0.065, 0.1, 0.032)
}

/** Six barrels around a shared axis, seen from above; spin sorts them by depth. */
function barrels(p: Pen, spin: number) {
  const list: { y: number; z: number }[] = []
  for (let i = 0; i < 6; i++) {
    const a = spin + (i * Math.PI) / 3
    list.push({ y: 0.058 * Math.cos(a), z: Math.sin(a) })
  }
  list.sort((a, b) => a.z - b.z)
  for (const b of list) {
    const m = b.z < 0 ? { ...MAT.gun, base: MAT.gun.shadow, light: MAT.gun.base } : MAT.gun
    p.plate(chamfer(0.15, b.y - 0.017, 0.54, b.y + 0.017, [0, 0, 0, 0]), m, 0.008)
  }
  p.plate(chamfer(0.27, -0.088, 0.31, 0.088, [0, 0, 0, 0]), MAT.frame, 0.012)
  p.plate(chamfer(0.45, -0.088, 0.49, 0.088, [0, 0, 0, 0]), MAT.frame, 0.012)
  p.plate(chamfer(0.53, -0.08, 0.565, 0.08, [0, 0.012, 0.012, 0]), MAT.gun, 0.01)
}

/** Tier 6 only: GENESIS-derived cowling — smooth, symmetric, segmented, like the enemy. */
function cowling(p: Pen, spin: number) {
  for (let i = 0; i < 3; i++) {
    const y = 0.042 * Math.cos(spin + (i * 2 * Math.PI) / 3)
    p.plate(chamfer(0.48, y - 0.015, 0.575, y + 0.015, [0, 0, 0, 0]), MAT.gun, 0.007)
  }
  const s = new Path2D()
  s.moveTo(0.14, -0.1)
  s.lineTo(0.36, -0.1)
  s.bezierCurveTo(0.46, -0.1, 0.53, -0.07, 0.535, 0)
  s.bezierCurveTo(0.53, 0.07, 0.46, 0.1, 0.36, 0.1)
  s.lineTo(0.14, 0.1)
  s.bezierCurveTo(0.12, 0.1, 0.12, -0.1, 0.14, -0.1)
  s.closePath()
  p.smooth(s, MAT.smooth, 0.024)
  // repeated segments, as on GENESIS hulls
  if (!p.silhouette) {
    const ctx = p.ctx
    ctx.save()
    ctx.clip(s)
    for (const x of [0.23, 0.31, 0.39]) {
      for (const [dx, col, w] of [[0, MAT.smooth.seam, 2.2], [p.lw * 1.6, MAT.smooth.light, 1]] as const) {
        ctx.beginPath()
        ctx.moveTo(x + dx, -0.11)
        ctx.quadraticCurveTo(x + dx + 0.03, 0, x + dx, 0.11)
        ctx.strokeStyle = col
        ctx.lineWidth = p.lw * w
        ctx.stroke()
      }
    }
    ctx.restore()
  }
}

/** A6: independent target designator on the front-left foot. Scans on its own. */
function designator(p: Pen, angle: number) {
  p.save()
  p.translate(-0.37, -0.37)
  p.disc(0, 0, 0.075, MAT.gun, 0.018)
  p.rotate(angle)
  p.plate(chamfer(-0.05, -0.045, 0.085, 0.045, [0, 0.02, 0.02, 0]), MAT.hull, 0.016)
  p.lens(0.045, 0, 0.022)
  p.restore()
}
