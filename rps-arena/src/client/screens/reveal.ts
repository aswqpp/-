/** Reveal phase: animated clash stage, bout strip, round standings, NEXT. */
import { computeBouts, type Bout } from '../../shared/engine';
import { clashCallout, fmtId, type Result } from '../../shared/judge';
import type { PlayerView } from '../../shared/protocol';
import { $, esc } from '../dom';
import { activeVariant, app, clearChoreoTimers, isMe, me, sortedPlayers, ui } from '../store';
import { renderHistory } from './history';

const flip = (r: Result): Result => (r === 'WIN' ? 'LOSE' : r === 'LOSE' ? 'WIN' : 'DRAW');

/** Called once when a round's results arrive. */
export function enterReveal(): void {
  const v = app.view;
  if (!v) return;
  ui.allBouts = computeBouts(v.players, v.config.variantN);
  // Your bouts always show you on the LEFT.
  ui.myBouts = ui.allBouts
    .filter((b) => isMe(b.left) || isMe(b.right))
    .map((b) => (isMe(b.left) ? b : { left: b.right, right: b.left, res: flip(b.res) }));
  ui.stripMode = 'MINE';
  ui.activeBoutIndex = 0;
  renderReveal();
  startAutoBoutSequence();
}

function boutList(): Bout<PlayerView>[] {
  return ui.stripMode === 'MINE' ? ui.myBouts : ui.allBouts;
}

export function renderReveal(): void {
  const v = app.view;
  if (!v) return;
  $('rev-round-tag').textContent = `R${v.round} / ${v.config.rounds}`;
  renderNextButton();
  renderBoutStrip();
  renderRevealStandingsBar();
  renderHistory('rev-history-wrap', 'rev-history');
}

function renderNextButton(): void {
  const v = app.view!;
  const btn = $<HTMLButtonElement>('btn-next-round');
  const last = v.round >= v.config.rounds;
  const label = last ? 'FINAL RESULT →' : 'NEXT ROUND →';
  if (v.mode === 'room' && me()?.ready) {
    const humans = v.players.filter((p) => !p.bot && p.connected);
    const ready = humans.filter((p) => p.ready).length;
    btn.disabled = true;
    btn.textContent = `READY ${ready} / ${humans.length}`;
  } else {
    btn.disabled = false;
    btn.textContent = label;
  }
}

function renderBoutStrip(): void {
  const list = boutList();
  $('btn-strip-mine').className = `h-7 px-3 font-mono text-[10px] font-bold uppercase transition ${ui.stripMode === 'MINE' ? 'bg-ink text-stock' : 'bg-stock text-ink hover:bg-paper'}`;
  $('btn-strip-all').className = `h-7 px-3 font-mono text-[10px] font-bold uppercase border-l-[1.5px] border-ink transition ${ui.stripMode === 'ALL' ? 'bg-ink text-stock' : 'bg-stock text-ink hover:bg-paper'}`;
  $('rev-bout-counter').textContent = `BOUT ${Math.min(ui.activeBoutIndex + 1, list.length)} / ${list.length}`;
  $('btn-skip-bouts').classList.toggle('hidden', !ui.isAutoPlaying);

  const strip = $('bout-strip-list');
  strip.innerHTML = list.map((b, idx) => {
    const isAct = idx === ui.activeBoutIndex;
    let tag = 'DRAW';
    let tone = 'bg-paper text-ink border-ink/50';
    if (b.res === 'WIN') {
      tag = isMe(b.left) ? '+1' : 'WIN';
      tone = 'bg-[#E2F4DF] text-[#264B21] border-deep';
    } else if (b.res === 'LOSE') {
      tag = isMe(b.left) ? 'LOSE' : 'WIN';
      tone = isMe(b.left) ? 'bg-[#FCE9E4] text-loss border-loss' : 'bg-[#E2F4DF] text-[#264B21] border-deep';
    }
    return `
      <button type="button" data-bout-idx="${idx}"
        class="h-9 px-3 border-[1.5px] rounded-[4px] font-mono text-[11px] font-bold uppercase transition cursor-pointer flex items-center gap-2 ${
          isAct ? 'bg-ink text-stock border-ink shadow-[3px_3px_0_#5C7057]' : `${tone} hover:shadow-[2px_2px_0_#1A2418]`
        }">
        <span>${esc(b.left.name)} vs ${esc(b.right.name)}</span>
        <span class="px-1.5 py-0.5 rounded-[2px] text-[10px] ${isAct ? 'bg-deep text-stock' : 'bg-stock/75 border border-current'}">${tag}</span>
      </button>
    `;
  }).join('');

  strip.querySelectorAll<HTMLButtonElement>('[data-bout-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      clearChoreoTimers();
      ui.isAutoPlaying = false;
      ui.activeBoutIndex = Number(btn.dataset.boutIdx);
      renderBoutStrip();
      playBoutAnimation(boutList()[ui.activeBoutIndex], false);
    });
  });
}

function renderRevealStandingsBar(): void {
  const v = activeVariant();
  $('rev-standings-bar').innerHTML = sortedPlayers().map((p, i) => {
    const it = p.pickId !== null ? v.items[p.pickId] : null;
    const mine = isMe(p);
    return `
      <div class="inline-flex items-center gap-2 px-2.5 py-1.5 border-[1.5px] border-ink rounded-[4px] font-mono text-xs ${mine ? 'bg-deep text-stock shadow-[2px_2px_0_#1A2418]' : 'bg-paper text-ink'}">
        <span class="font-bold">${i + 1}. ${esc(p.name)}</span>
        <span class="text-base leading-none" title="${esc(it?.name ?? '')}">${it?.emoji ?? '·'}</span>
        ${p.auto ? `<span class="text-[9px] px-1 border border-current rounded-[2px]" title="Timer ran out: picked at random">AUTO</span>` : ''}
        <span class="text-[11px] ${mine ? 'text-paper' : 'text-deep'} font-semibold">${p.delta > 0 ? `+${p.delta}` : '0'}</span>
        <span class="font-bold border-l ${mine ? 'border-stock/40' : 'border-ink/30'} pl-1.5">${p.score}</span>
      </div>
    `;
  }).join('');
}

function startAutoBoutSequence(): void {
  clearChoreoTimers();
  ui.isAutoPlaying = true;
  ui.stripMode = ui.myBouts.length ? 'MINE' : 'ALL';
  ui.activeBoutIndex = 0;
  runSequenceStep(0);
}

function runSequenceStep(idx: number): void {
  const list = boutList();
  if (idx >= list.length) {
    ui.isAutoPlaying = false;
    renderBoutStrip();
    return;
  }
  ui.activeBoutIndex = idx;
  renderBoutStrip();
  playBoutAnimation(list[idx], false);
  if (idx + 1 < list.length) {
    ui.choreoTimers.push(setTimeout(() => runSequenceStep(idx + 1), 1180));
  } else {
    ui.choreoTimers.push(setTimeout(() => {
      ui.isAutoPlaying = false;
      renderBoutStrip();
    }, 900));
  }
}

/**
 * Fight choreography:
 *   0ms   face-off slam from opposite sides
 *   290ms clash lunge + starburst + micro-shake
 *   520ms verdict stamp + winner pop / loser knockback + "+1" tag
 */
function playBoutAnimation(bout: Bout<PlayerView> | undefined, instant: boolean): void {
  if (!bout || bout.left.pickId === null || bout.right.pickId === null) return;
  const v = activeVariant();
  const leftItem = v.items[bout.left.pickId];
  const rightItem = v.items[bout.right.pickId];

  const stage = $('clash-stage');
  const cardL = $('fighter-left');
  const cardR = $('fighter-right');
  const plusL = $('left-plus-tag');
  const plusR = $('right-plus-tag');
  const strikeL = $('left-strike');
  const strikeR = $('right-strike');
  const spark = $('impact-spark') as unknown as SVGElement;
  const ring = $('impact-ring');
  const verdictEl = $('center-verdict');
  const calloutEl = $('clash-callout');

  $('left-player-name').textContent = bout.left.name;
  $('left-item-id').textContent = fmtId(leftItem.id, v.n);
  $('left-item-emoji').textContent = leftItem.emoji;
  $('left-item-name').textContent = leftItem.name;
  $('right-player-name').textContent = bout.right.name;
  $('right-item-id').textContent = fmtId(rightItem.id, v.n);
  $('right-item-emoji').textContent = rightItem.emoji;
  $('right-item-name').textContent = rightItem.name;

  const leftIsMe = isMe(bout.left);
  let verdictText = 'DRAW';
  let verdictCls = 'bg-[#E8EFE7] text-[#4D594B] border-[#4D594B]';
  let calloutText = 'CLASH · DRAW';
  if (bout.res === 'WIN') {
    verdictText = leftIsMe ? 'WIN' : `${bout.left.name} WINS`;
    verdictCls = 'bg-[#E2F4DF] text-[#264B21] border-[#264B21]';
    calloutText = clashCallout(leftItem, rightItem);
  } else if (bout.res === 'LOSE') {
    verdictText = leftIsMe ? 'LOSE' : `${bout.right.name} WINS`;
    verdictCls = leftIsMe ? 'bg-[#FCE9E4] text-loss border-loss' : 'bg-[#E2F4DF] text-[#264B21] border-[#264B21]';
    calloutText = clashCallout(rightItem, leftItem);
  }

  stage.classList.remove('anim-stage-shake');
  cardL.classList.remove('anim-slam-left', 'anim-lunge-left', 'anim-win-pop', 'anim-lose-left', 'anim-draw-left', 'fighter-winner', 'fighter-loser');
  cardR.classList.remove('anim-slam-right', 'anim-lunge-right', 'anim-win-pop', 'anim-lose-right', 'anim-draw-right', 'fighter-winner', 'fighter-loser');
  plusL.classList.add('hidden');
  plusR.classList.add('hidden');
  plusL.classList.remove('anim-plus-one');
  plusR.classList.remove('anim-plus-one');
  strikeL.classList.add('hidden');
  strikeR.classList.add('hidden');
  spark.classList.add('hidden');
  spark.classList.remove('anim-spark');
  ring.classList.add('hidden');
  ring.classList.remove('anim-ring-shock');
  verdictEl.classList.add('hidden');
  verdictEl.classList.remove('anim-verdict');
  void cardL.offsetWidth; // reflow so the animations replay

  const applyFinalResult = () => {
    verdictEl.textContent = verdictText;
    verdictEl.className = `relative z-30 mt-3 px-3 py-1 border-[2px] rounded-[3px] font-mono text-xs sm:text-sm font-bold uppercase tracking-widest shadow-[3px_3px_0_#1A2418] whitespace-nowrap anim-verdict ${verdictCls}`;
    calloutEl.textContent = calloutText;
    cardL.classList.remove('anim-lunge-left');
    cardR.classList.remove('anim-lunge-right');
    if (bout.res === 'WIN') {
      cardL.classList.add('fighter-winner', 'anim-win-pop');
      cardR.classList.add('fighter-loser', 'anim-lose-right');
      plusL.classList.remove('hidden');
      plusL.classList.add('anim-plus-one');
      strikeR.classList.remove('hidden');
    } else if (bout.res === 'LOSE') {
      cardR.classList.add('fighter-winner', 'anim-win-pop');
      cardL.classList.add('fighter-loser', 'anim-lose-left');
      plusR.classList.remove('hidden');
      plusR.classList.add('anim-plus-one');
      strikeL.classList.remove('hidden');
    } else {
      cardL.classList.add('anim-draw-left');
      cardR.classList.add('anim-draw-right');
    }
  };

  if (instant) {
    applyFinalResult();
    return;
  }

  calloutEl.textContent = `${leftItem.name} VS ${rightItem.name}`.toUpperCase();
  cardL.classList.add('anim-slam-left');
  cardR.classList.add('anim-slam-right');

  const t2 = setTimeout(() => {
    cardL.classList.remove('anim-slam-left');
    cardR.classList.remove('anim-slam-right');
    cardL.classList.add('anim-lunge-left');
    cardR.classList.add('anim-lunge-right');
    stage.classList.add('anim-stage-shake');
    spark.classList.remove('hidden');
    spark.classList.add('anim-spark');
    ring.classList.remove('hidden');
    ring.classList.add('anim-ring-shock');
  }, 290);
  const t3 = setTimeout(applyFinalResult, 520);
  ui.choreoTimers.push(t2, t3);
}

export function wireReveal(): void {
  $('btn-skip-bouts').addEventListener('click', () => {
    clearChoreoTimers();
    ui.isAutoPlaying = false;
    const list = boutList();
    ui.activeBoutIndex = list.length - 1;
    renderBoutStrip();
    playBoutAnimation(list[ui.activeBoutIndex], true);
  });
  $('btn-replay-bout').addEventListener('click', () => {
    clearChoreoTimers();
    ui.isAutoPlaying = false;
    renderBoutStrip();
    playBoutAnimation(boutList()[ui.activeBoutIndex], false);
  });
  const setStrip = (mode: 'MINE' | 'ALL') => {
    clearChoreoTimers();
    ui.isAutoPlaying = false;
    ui.stripMode = mode;
    ui.activeBoutIndex = 0;
    renderBoutStrip();
    playBoutAnimation(boutList()[0], false);
  };
  $('btn-strip-mine').addEventListener('click', () => setStrip('MINE'));
  $('btn-strip-all').addEventListener('click', () => setStrip('ALL'));
  $('btn-next-round').addEventListener('click', () => {
    clearChoreoTimers();
    app.session?.ready();
  });
}
