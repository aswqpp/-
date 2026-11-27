// Colour tokens. The hex values in C are fixed by the brief (02장 2-3); every other
// tone here is a derived shade of one of them, used only to build the three-tone
// (light / base / shadow) faces that 2-1 asks for. docs/art.md lists the derivations.

export const C = {
  // neutrals
  bg: '#101419',
  panel: '#191F26',
  line: '#232A33',
  textDim: '#56606B',
  text2: '#8A949E',
  metal: '#A5B0BA',
  text: '#EDF2F6',
  // accents, one meaning each
  cyan: '#45D6E9', // ally energy, selection, attack range
  lime: '#C3F56B', // advanced tech, affordable upgrade
  red: '#FF5757', // enemy, danger, cannot place, core damage
  gold: '#E5BA68', // Tier 6, transcendence, legendary, commander
  // enemy hull range
  enemyDark: '#0B0D10',
  enemyLight: '#2A2F36',
} as const

/** A material is three faces plus the 1px seam colour drawn on its panel lines. */
export interface Mat {
  light: string
  base: string
  shadow: string
  seam: string
}

export const MAT = {
  /** Ally armour plates. base = #A5B0BA (ally metal). */
  hull: { light: '#C6CFD7', base: '#A5B0BA', shadow: '#77828D', seam: '#3E464F' },
  /** Ally structural frame: base plates, clamps, legs. Darker so the turret reads on top. */
  frame: { light: '#88929C', base: '#6A747E', shadow: '#4A535C', seam: '#262C33' },
  /** Barrels, feeds, mechanisms. */
  gun: { light: '#5D6772', base: '#434C56', shadow: '#2B3239', seam: '#14181D' },
  /** Parts taken from GENESIS designs (Tier 6). Sits inside the enemy hull range. */
  smooth: { light: '#2A2F36', base: '#181B20', shadow: '#0B0D10', seam: '#06080A' },
  /** Enemy hulls: #0B0D10 – #2A2F36. */
  enemy: { light: '#2A2F36', base: '#1A1E23', shadow: '#0B0D10', seam: '#050608' },
} satisfies Record<string, Mat>

/** Map tones. The path is one step brighter than the ground and carries an edge line. */
export const GROUND = {
  ground: '#151A20',
  groundAlt: '#181D23',
  path: '#2B323A',
  pathEdge: '#3A434D',
  gridLine: '#232A33',
} as const
