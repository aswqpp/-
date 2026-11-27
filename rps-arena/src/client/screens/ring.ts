/** RING tab: circular matchup atlas (SVG) + beats/loses side panel. */
import { fmtId, judge, matchups } from '../../shared/judge';
import { VARIANTS, VARIANT_KEYS } from '../../shared/variants';
import { $, esc } from '../dom';
import { handUrl, iconHtml } from '../icons';
import { ui } from '../store';

function polar(cx: number, cy: number, r: number, ang: number) {
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

function arcPath(cx: number, cy: number, r: number, startRad: number, endRad: number): string {
  const s = polar(cx, cy, r, startRad);
  const e = polar(cx, cy, r, endRad);
  let delta = endRad - startRad;
  while (delta < 0) delta += Math.PI * 2;
  const largeArc = delta > Math.PI ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}

export function renderRingPage(): void {
  $('nav-variant-pill').textContent = `RPS-${ui.ringVariantN}`;
  const pillsEl = $('ring-variant-pills');
  pillsEl.innerHTML = VARIANT_KEYS.map((k) => {
    const act = k === ui.ringVariantN;
    return `
      <button type="button" data-rv="${k}" aria-pressed="${act}" class="btn h-8 px-3 font-mono text-xs font-bold ${act ? 'bg-deep text-stock' : 'bg-stock text-ink'}">
        RPS-${k}
      </button>
    `;
  }).join('');
  pillsEl.querySelectorAll<HTMLButtonElement>('[data-rv]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.ringVariantN = Number(btn.dataset.rv) as typeof ui.ringVariantN;
      ui.ringSelectedId = 0;
      ui.ringHoverId = null;
      renderRingPage();
    });
  });
  renderRingDiagramSVG();
  renderRingSidePanel();
}

function renderRingDiagramSVG(): void {
  const mount = $('ring-svg-mount');
  const v = VARIANTS[ui.ringVariantN];
  const items = v.items;
  const n = items.length;
  const half = (n - 1) / 2;
  const selId = ui.ringSelectedId < n ? ui.ringSelectedId : 0;
  const selItem = items[selId];
  const hovItem = ui.ringHoverId !== null && ui.ringHoverId < n && ui.ringHoverId !== selId
    ? items[ui.ringHoverId]
    : null;

  const size = 680;
  const cx = size / 2;
  const cy = size / 2;
  const stepAng = (Math.PI * 2) / n;
  const startOff = -Math.PI / 2;

  let rNode = 216, nodeR = 26, emojiSz = 23, labelOff = 38, hubR = 90, rArc = 252;
  if (n <= 5)      { rNode = 204; nodeR = 32; emojiSz = 28; labelOff = 46; hubR = 92; rArc = 246; }
  else if (n === 7)  { rNode = 210; nodeR = 28; emojiSz = 24; labelOff = 42; hubR = 90; rArc = 248; }
  else if (n === 15) { rNode = 222; nodeR = 22; emojiSz = 19; labelOff = 34; hubR = 94; rArc = 254; }
  else if (n === 25) { rNode = 232; nodeR = 16; emojiSz = 14; labelOff = 26; hubR = 96; rArc = 256; }
  else               { rNode = 276; nodeR = 10; emojiSz = 10.5; hubR = 114; rArc = 302; }

  const coords = items.map((it, idx) => {
    const ang = startOff + idx * stepAng;
    const r = n === 101 ? (idx % 2 === 0 ? 280 : 254) : rNode;
    const pt = polar(cx, cy, r, ang);
    return { ...it, ang, r, x: pt.x, y: pt.y };
  });

  const selCoord = coords[selId];

  // Outer Arcs
  const beatArc = arcPath(cx, cy, rArc, selCoord.ang + stepAng * 0.55, selCoord.ang + stepAng * (half + 0.45));
  const loseArc = arcPath(cx, cy, rArc, selCoord.ang + stepAng * (half + 0.55), selCoord.ang + stepAng * (n - 0.55));

  // Curved Bézier Chords
  let chordsSvg = '';
  coords.forEach((t) => {
    if (t.id === selId) return;
    const isBeats = judge(selId, t.id, n) === 'WIN';
    const isHovTarget = hovItem && hovItem.id === t.id;

    const midX = (selCoord.x + t.x) / 2;
    const midY = (selCoord.y + t.y) / 2;
    const pull = n === 101 ? 0.72 : 0.65;
    const ctrlX = cx * pull + midX * (1 - pull);
    const ctrlY = cy * pull + midY * (1 - pull);

    const color = isBeats ? '#5C7057' : '#C84B31';
    let width = n === 101 ? 0.9 : (n === 25 ? 1.35 : 1.8);
    let op = n === 101 ? 0.22 : (n === 25 ? 0.42 : 0.6);

    if (hovItem) {
      if (isHovTarget) { width = 3.4; op = 1; }
      else             { op = n === 101 ? 0.08 : 0.14; }
    }

    chordsSvg += `
      <path
        d="M ${selCoord.x.toFixed(1)} ${selCoord.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${t.x.toFixed(1)} ${t.y.toFixed(1)}"
        fill="none" stroke="${color}" stroke-width="${width}" stroke-opacity="${op}" stroke-linecap="round"
      />
    `;
  });

  // Nodes + Radial Labels
  let nodesSvg = '';
  coords.forEach((pt) => {
    const isSel = pt.id === selId;
    const isHov = hovItem && hovItem.id === pt.id;
    const res = isSel ? 'SELF' : judge(selId, pt.id, n);

    const hand = handUrl(pt);
    let fill = '#F5FBF5', stroke = '#1A2418', sw = 1.5;
    if (isSel) {
      fill = '#1A2418'; stroke = '#1A2418'; sw = 2.5;
    } else if (res === 'WIN') {
      fill = isHov ? '#5C7057' : '#DFF1DC'; stroke = '#5C7057'; sw = isHov ? 2.5 : 1.5;
    } else {
      fill = isHov ? '#C84B31' : '#FCE9E4'; stroke = '#C84B31'; sw = isHov ? 2.5 : 1.5;
    }
    // Hand symbols fill the node, so the WIN/LOSE colour lives in a bolder rim.
    if (hand) sw += n === 101 ? 0.8 : 1.5;
    const r = isSel || isHov ? nodeR + 2 : nodeR;
    const imgR = r - sw / 2 - (n === 101 ? 0.5 : 1.5);
    const glyph = hand
      ? `<image href="${hand}" x="${(pt.x - imgR).toFixed(1)}" y="${(pt.y - imgR).toFixed(1)}" width="${(imgR * 2).toFixed(1)}" height="${(imgR * 2).toFixed(1)}" style="pointer-events:none" />`
      : `<text x="${pt.x.toFixed(1)}" y="${(pt.y + emojiSz * 0.36).toFixed(1)}" text-anchor="middle" font-size="${emojiSz}" style="pointer-events:none; user-select:none;">${pt.emoji}</text>`;

    let labelSvg = '';
    if (n <= 25) {
      const lp = polar(cx, cy, pt.r + labelOff, pt.ang);
      const cos = Math.cos(pt.ang);
      const anchor = cos > 0.25 ? 'start' : (cos < -0.25 ? 'end' : 'middle');
      const lblColor = isSel ? '#1A2418' : (res === 'WIN' ? '#264B21' : '#A63A23');
      const fSize = n === 25 ? 10.5 : (n === 15 ? 12 : 13.5);
      labelSvg = `
        <text x="${lp.x.toFixed(1)}" y="${(lp.y + 4).toFixed(1)}" text-anchor="${anchor}" fill="${lblColor}" font-family="Space Grotesk, sans-serif" font-size="${fSize}" font-weight="${isSel || isHov ? 700 : 600}">
          ${esc(pt.name)}
        </text>
      `;
    }

    nodesSvg += `
      <g class="ring-node" data-rnode="${pt.id}">
        <title>${fmtId(pt.id, n)} ${esc(pt.name)}</title>
        <circle class="node-bg" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />
        ${glyph}
        ${labelSvg}
      </g>
    `;
  });

  // Center Hub Readout
  let hubHtml = '';
  if (hovItem) {
    const res = judge(selId, hovItem.id, n);
    const sym = res === 'WIN' ? '>' : '<';
    const stampCls = res === 'WIN' ? 'stamp-win' : 'stamp-lose';
    const verdict = res === 'WIN' ? 'WIN' : 'LOSE';
    hubHtml = `
      <div class="w-full h-full flex flex-col items-center justify-center text-center px-2">
        <div class="flex items-center gap-2 text-2xl leading-none mb-1.5">
          ${iconHtml(selItem, 40)}
          <span class="font-mono text-sm font-bold text-ink">${sym}</span>
          ${iconHtml(hovItem, 40)}
        </div>
        <div class="font-sans font-bold text-xs uppercase leading-tight text-ink">
          ${esc(selItem.name)} ${sym} ${esc(hovItem.name)}
        </div>
        <span class="stamp ${stampCls} mt-2">${verdict}</span>
      </div>
    `;
  } else {
    hubHtml = `
      <div class="w-full h-full flex flex-col items-center justify-center text-center px-2">
        <div class="mb-1.5">${iconHtml(selItem, n === 101 ? 84 : 64)}</div>
        <div class="font-sans font-bold text-sm uppercase leading-tight text-ink truncate max-w-full">
          ${esc(selItem.name)}
        </div>
        <div class="font-mono text-[10px] font-bold text-deep mt-1">
          ${fmtId(selItem.id, n)} · ${half}W / ${half}L
        </div>
      </div>
    `;
  }

  const hubBox = hubR * 1.82;
  mount.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" class="w-full h-full block select-none" role="img" aria-label="Circular Matchup Ring">
      <circle cx="${cx}" cy="${cy}" r="${n === 101 ? 267 : rNode}" fill="none" stroke="#1A2418" stroke-opacity="0.14" stroke-width="1" stroke-dasharray="3 4" />
      <path d="${beatArc}" fill="none" stroke="#5C7057" stroke-width="${n === 101 ? 5 : 3.5}" stroke-linecap="round" />
      <path d="${loseArc}" fill="none" stroke="#C84B31" stroke-width="${n === 101 ? 5 : 3.5}" stroke-linecap="round" />
      <g style="pointer-events:none;">${chordsSvg}</g>
      <circle cx="${cx}" cy="${cy}" r="${hubR}" fill="#F5FBF5" stroke="#1A2418" stroke-width="1.5" />
      <foreignObject x="${cx - hubBox / 2}" y="${cy - hubBox / 2}" width="${hubBox}" height="${hubBox}">
        <div xmlns="http://www.w3.org/1999/xhtml" class="w-full h-full">${hubHtml}</div>
      </foreignObject>
      <g>${nodesSvg}</g>
    </svg>
  `;

  mount.querySelectorAll<SVGGElement>('[data-rnode]').forEach((g) => {
    const id = Number(g.dataset.rnode);
    g.addEventListener('click', () => {
      ui.ringSelectedId = id;
      ui.ringHoverId = null;
      renderRingDiagramSVG();
      renderRingSidePanel();
    });
    g.addEventListener('mouseenter', () => {
      ui.ringHoverId = id;
      renderRingDiagramSVG();
    });
    g.addEventListener('mouseleave', () => {
      ui.ringHoverId = null;
      renderRingDiagramSVG();
    });
  });
}


function renderRingSidePanel(): void {
  const el = $('ring-side-panel');
  const v = VARIANTS[ui.ringVariantN];
  const n = v.n;
  const selId = ui.ringSelectedId < n ? ui.ringSelectedId : 0;
  const sel = v.items[selId];
  const { beats, loses } = matchups(v.items, selId);

  const list = ui.ringSideTab === 'BEATS' ? beats : loses;
  const chipCls = ui.ringSideTab === 'BEATS'
    ? 'bg-[#E2F4DF] border-deep text-ink hover:bg-deep hover:text-stock'
    : 'bg-[#FCE9E4] border-loss text-ink hover:bg-loss hover:text-stock';

  el.innerHTML = `
    <div class="flex items-center gap-3 pb-3.5 mb-3.5 border-b-[1.5px] border-ink">
      <div class="w-12 h-12 bg-paper border-[1.5px] border-ink rounded-[4px] flex items-center justify-center shrink-0">
        ${iconHtml(sel, 40)}
      </div>
      <div class="min-w-0">
        <div class="font-sans font-bold text-base uppercase truncate">${esc(sel.name)}</div>
        <div class="font-mono text-[11px] font-bold text-deep">${fmtId(sel.id, n)} · ${v.label}</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 mb-3">
      <button type="button" data-rtab="BEATS" class="btn h-8 font-mono text-[11px] font-bold uppercase ${ui.ringSideTab === 'BEATS' ? 'bg-deep text-stock' : 'bg-stock text-deep'}">
        BEATS (${beats.length})
      </button>
      <button type="button" data-rtab="LOSES" class="btn h-8 font-mono text-[11px] font-bold uppercase ${ui.ringSideTab === 'LOSES' ? 'bg-loss text-stock' : 'bg-stock text-loss'}">
        LOSES (${loses.length})
      </button>
    </div>

    <div class="max-h-[450px] overflow-y-auto flex flex-wrap gap-1.5 content-start pr-1">
      ${list.map((it) => `
        <button type="button" data-rjump="${it.id}" class="inline-flex items-center gap-1 px-2 py-1 border-[1.5px] rounded-[3px] font-mono text-[11px] font-semibold transition cursor-pointer ${chipCls}">
          ${iconHtml(it, 18)}
          <span>${esc(it.name)}</span>
        </button>
      `).join('')}
    </div>
  `;

  el.querySelectorAll<HTMLButtonElement>('[data-rtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.ringSideTab = btn.dataset.rtab as 'BEATS' | 'LOSES';
      renderRingSidePanel();
    });
  });
  el.querySelectorAll<HTMLButtonElement>('[data-rjump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.ringSelectedId = Number(btn.dataset.rjump);
      ui.ringHoverId = null;
      renderRingDiagramSVG();
      renderRingSidePanel();
    });
  });
}
