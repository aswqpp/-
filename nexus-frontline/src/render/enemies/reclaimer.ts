// R-07 수거형 (basic enemy). GENESIS reclamation unit for dismantling switch
// cabinets. Built only for efficiency: smooth, mirror-symmetric, three repeated
// hull segments, one red sensor. Faces +x (direction of travel).

import { MAT } from '../palette.ts'
import type { Pen } from '../pen.ts'

export const RECLAIMER_EXTENT = 0.34

export function drawReclaimer(p: Pen, phase = 0) {
  // folded manipulator arms, mirrored
  for (const s of [-1, 1]) {
    const arm = new Path2D()
    arm.moveTo(-0.06, s * 0.13)
    arm.bezierCurveTo(0.06, s * 0.235, 0.2, s * 0.215, 0.27, s * 0.125)
    arm.bezierCurveTo(0.2, s * 0.17, 0.08, s * 0.175, -0.02, s * 0.105)
    arm.closePath()
    p.smooth(arm, MAT.enemy, 0.016)
  }
  // hull
  const hull = new Path2D()
  hull.ellipse(-0.02, 0, 0.25, 0.16, 0, 0, Math.PI * 2)
  p.smooth(hull, MAT.enemy, 0.026)
  // repeated segment joints
  if (!p.silhouette) {
    const ctx = p.ctx
    ctx.strokeStyle = MAT.enemy.seam
    ctx.lineWidth = p.lw * 1.4
    for (const x of [-0.14, -0.06, 0.02]) {
      const h = 0.16 * Math.sqrt(Math.max(0, 1 - ((x + 0.02) / 0.25) ** 2))
      ctx.beginPath()
      ctx.moveTo(x, -h)
      ctx.quadraticCurveTo(x + 0.035, 0, x, h)
      ctx.stroke()
    }
  }
  // sensor head
  const head = new Path2D()
  head.ellipse(0.2, 0, 0.085, 0.075, 0, 0, Math.PI * 2)
  p.smooth(head, MAT.enemy, 0.018)
  const blink = 0.8 + 0.2 * Math.sin(phase)
  p.sensor(0.245, 0, 0.024 * blink)
}
