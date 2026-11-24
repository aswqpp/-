/** Pick phase: HUD, card grid, inspector, lock. */
import { judge, fmtId, matchups } from '../../shared/judge';
import { CATEGORIES } from '../../shared/variants';
import { $, esc } from '../dom';
import { activeVariant, app, isMe, me, ui } from '../store';

/** Reset local pick state when a new round starts. */
export function resetPick(): void {
  ui.selectedId = null;
  ui.pickCategory = 'All';
  ui.pickSearch = '';
  ui.inspTab = 'BEATS';
  $<HTMLInputElement>('pick-search').value = '';
  $('pick-search-clear').classList.add('hidden');
}

export function renderPick(): void {
  const v = app.view;
  if (!v) return;
  $('hud-round').textContent = `R${v.round} / ${v.config.rounds}`;
  updateTimer();
  renderHudLockDots();
  renderWlToggle();
  renderPickCategories();
  renderPickGrid();
  renderInspector();
}

/** Cheap refresh for server updates that only change lock status. */
export function refreshPickStatus(): void {
  renderHudLockDots();
  const locked = !!me()?.locked;
  const gridLocked = $('pick-grid').dataset.locked === '1';
  if (locked !== gridLocked) renderPickGrid();
  renderInspector();
}

export function secondsLeft(): number | null {
  const d = app.view?.deadline;
  if (d == null) return null;
  return Math.max(0, Math.ceil((d - (Date.now() + app.clockOffset)) / 1000));
}

export function updateTimer(): void {
  const el = $('hud-timer');
  const s = secondsLeft();
  el.textContent = s === null ? 'NO LIMIT' : `${s}s`;
  el.className = s !== null && s <= 5
    ? 'font-mono text-xs font-bold px-2.5 py-1 bg-[#FCE9E4] text-loss border-[1.5px] border-loss rounded-[3px]'
    : 'font-mono text-xs font-bold px-2.5 py-1 bg-stock text-ink border-[1.5px] border-ink rounded-[3px]';
}

function renderHudLockDots(): void {
  $('hud-lock-dots').innerHTML = (app.view?.players ?? []).map((p) => `
    <span class="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold ${p.connected ? '' : 'opacity-50'}" title="${p.locked ? 'LOCKED' : 'PICKING'}">
      <span class="w-2.5 h-2.5 rounded-full border-[1.5px] border-ink ${p.locked ? 'bg-deep' : 'bg-paper'}"></span>
      <span class="${isMe(p) ? 'text-ink font-bold' : 'text-ink/75'}">${esc(p.name)}</span>
    </span>
  `).join('');
}

function renderWlToggle(): void {
  const btn = $('btn-wl-toggle');
  const dot = $('wl-toggle-dot');
  if (ui.wlOverlay) {
    btn.className = 'btn h-9 px-3 bg-deep text-stock font-mono text-[11px] font-bold uppercase flex items-center gap-2';
    dot.className = 'w-2.5 h-2.5 rounded-full border border-stock bg-paper';
  } else {
    btn.className = 'btn h-9 px-3 bg-stock text-ink font-mono text-[11px] font-bold uppercase flex items-center gap-2';
    dot.className = 'w-2.5 h-2.5 rounded-full border border-ink bg-transparent';
  }
}

function renderPickCategories(): void {
  const v = activeVariant();
  const wrap = $('pick-categories');
  if (v.n < 15) {
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');
  wrap.innerHTML = CATEGORIES.map((cat) => {
    const count = cat === 'All' ? v.n : v.items.filter((it) => it.cat === cat).length;
    if (count === 0 && cat !== 'All') return '';
    const act = ui.pickCategory === cat;
    return `
      <button type="button" data-cat="${cat}" class="h-8 px-2.5 border-[1.5px] border-ink rounded-[3px] font-mono text-[11px] font-bold uppercase transition ${act ? 'bg-ink text-stock' : 'bg-stock text-ink hover:bg-tint'}">
        ${cat}
      </button>
    `;
  }).join('');
  wrap.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ui.pickCategory = btn.dataset.cat!;
      renderPickCategories();
      renderPickGrid();
    });
  });
}

function select(id: number): void {
  if (me()?.locked) return;
  ui.selectedId = id;
  renderPickGrid();
  renderInspector();
}

export function renderPickGrid(): void {
  const v = activeVariant();
  const n = v.n;
  const q = ui.pickSearch.trim().toLowerCase().replace(/^#/, '');
  const locked = !!me()?.locked;
  const sel = locked ? (me()?.pickId ?? ui.selectedId) : ui.selectedId;

  const filtered = v.items.filter((it) => {
    if (ui.pickCategory !== 'All' && it.cat !== ui.pickCategory) return false;
    if (!q) return true;
    return it.name.toLowerCase().includes(q) || String(it.id) === q;
  });

  const grid = $('pick-grid');
  grid.dataset.locked = locked ? '1' : '0';
  grid.className = n <= 7
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
    : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5';

  grid.innerHTML = filtered.length === 0
    ? `<div class="col-span-full py-10 text-center font-mono text-xs font-bold uppercase text-ink/55">NO MATCH FOR "${esc(ui.pickSearch)}"</div>`
    : filtered.map((it) => {
      const isSel = sel === it.id;
      let badge = '';
      if (isSel) {
        badge = `<span class="px-1.5 py-0.5 bg-paper text-ink border border-ink font-mono text-[10px] font-bold rounded-[2px]">${locked ? 'LOCK' : 'SEL'}</span>`;
      } else if (ui.wlOverlay && sel !== null) {
        const res = judge(sel, it.id, n);
        if (res === 'WIN') badge = `<span class="px-1.5 py-0.5 bg-deep text-stock font-mono text-[10px] font-bold rounded-[2px]">W</span>`;
        else if (res === 'LOSE') badge = `<span class="px-1.5 py-0.5 bg-loss text-stock font-mono text-[10px] font-bold rounded-[2px]">L</span>`;
      }
      return `
        <button type="button" data-pid="${it.id}" ${locked ? 'disabled' : ''} aria-pressed="${isSel}" class="pick-card p-3 flex flex-col items-center text-center ${isSel ? 'is-selected' : ''}">
          <div class="w-full flex items-center justify-between mb-1.5">
            <span class="font-mono text-[10px] font-semibold ${isSel ? 'text-paper' : 'text-ink/55'}">${fmtId(it.id, n)}</span>
            ${badge}
          </div>
          <div class="text-3xl leading-none my-1.5 select-none">${it.emoji}</div>
          <div class="w-full font-sans font-bold text-xs uppercase truncate mt-1">${esc(it.name)}</div>
        </button>
      `;
    }).join('');

  grid.querySelectorAll<HTMLButtonElement>('[data-pid]').forEach((btn) => {
    btn.addEventListener('click', () => select(Number(btn.dataset.pid)));
  });
}

export function renderInspector(): void {
  const v = activeVariant();
  const n = v.n;
  const half = (n - 1) / 2;
  const mine = me();
  const locked = !!mine?.locked;
  const selId = locked ? (mine?.pickId ?? ui.selectedId) : ui.selectedId;

  const tabB = $('insp-tab-beats');
  const tabL = $('insp-tab-loses');
  const chipsEl = $('insp-chips');
  const lockDesk = $<HTMLButtonElement>('btn-lock-desktop');
  const lockMob = $<HTMLButtonElement>('btn-lock-mobile');

  // Lock buttons: idle / ready / locked-and-waiting.
  const waiting = (app.view?.players ?? []).filter((p) => !p.locked).length;
  const lockLabel = locked ? `LOCKED · WAITING FOR ${waiting}` : 'LOCK MOVE';
  lockDesk.textContent = lockLabel;
  lockMob.textContent = locked ? `WAITING FOR ${waiting}` : 'LOCK MOVE';
  lockDesk.disabled = locked || selId === null;
  lockMob.disabled = locked || selId === null;

  if (selId === null) {
    $('insp-index').textContent = `-- / ${n}`;
    $('insp-icon').textContent = '·';
    $('insp-name').textContent = 'SELECT CARD';
    $('insp-split').textContent = 'MANUAL PICK';
    $('insp-pos-label').textContent = '--';
    $('insp-pos-fill').style.width = '0%';
    tabB.textContent = `BEATS (${half})`;
    tabL.textContent = `LOSES (${half})`;
    tabB.className = 'btn h-8 bg-stock text-deep font-mono text-[11px] font-bold uppercase';
    tabL.className = 'btn h-8 bg-stock text-loss font-mono text-[11px] font-bold uppercase';
    chipsEl.innerHTML = `<span class="font-mono text-[11px] text-ink/55 uppercase">CLICK ANY CARD</span>`;
    $('mob-lock-icon').textContent = '·';
    $('mob-lock-name').textContent = 'SELECT CARD';
    $('mob-lock-meta').textContent = 'MANUAL PICK';
    return;
  }

  const sel = v.items[selId];
  $('insp-index').textContent = `${fmtId(sel.id, n)} · ${sel.cat.toUpperCase()}`;
  $('insp-icon').textContent = sel.emoji;
  $('insp-name').textContent = sel.name;
  $('insp-split').textContent = locked ? 'LOCKED IN' : `BEATS ${half} · LOSES ${half}`;
  $('insp-pos-label').textContent = `${sel.id + 1} / ${n}`;
  $('insp-pos-fill').style.width = `${Math.round(((sel.id + 1) / n) * 100)}%`;
  $('mob-lock-icon').textContent = sel.emoji;
  $('mob-lock-name').textContent = sel.name;
  $('mob-lock-meta').textContent = locked ? 'LOCKED IN' : `BEATS ${half} · LOSES ${half}`;

  const { beats, loses } = matchups(v.items, sel.id);
  tabB.textContent = `BEATS (${beats.length})`;
  tabL.textContent = `LOSES (${loses.length})`;
  tabB.className = `btn h-8 font-mono text-[11px] font-bold uppercase ${ui.inspTab === 'BEATS' ? 'bg-deep text-stock' : 'bg-stock text-deep'}`;
  tabL.className = `btn h-8 font-mono text-[11px] font-bold uppercase ${ui.inspTab === 'LOSES' ? 'bg-loss text-stock' : 'bg-stock text-loss'}`;

  const list = ui.inspTab === 'BEATS' ? beats : loses;
  const chipStyle = ui.inspTab === 'BEATS'
    ? 'bg-[#E2F4DF] border-deep text-ink hover:bg-deep hover:text-stock'
    : 'bg-[#FCE9E4] border-loss text-ink hover:bg-loss hover:text-stock';
  chipsEl.innerHTML = list.map((it) => `
    <button type="button" data-jump="${it.id}" class="inline-flex items-center gap-1 px-2 py-1 border-[1.5px] rounded-[3px] font-mono text-[11px] font-semibold transition cursor-pointer ${chipStyle}">
      <span>${it.emoji}</span>
      <span>${esc(it.name)}</span>
    </button>
  `).join('');
  chipsEl.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => select(Number(btn.dataset.jump)));
  });
}

export function wirePick(): void {
  const searchEl = $<HTMLInputElement>('pick-search');
  const clearEl = $('pick-search-clear');
  searchEl.addEventListener('input', () => {
    ui.pickSearch = searchEl.value;
    clearEl.classList.toggle('hidden', !ui.pickSearch);
    renderPickGrid();
  });
  clearEl.addEventListener('click', () => {
    ui.pickSearch = '';
    searchEl.value = '';
    clearEl.classList.add('hidden');
    renderPickGrid();
  });
  $('btn-wl-toggle').addEventListener('click', () => {
    ui.wlOverlay = !ui.wlOverlay;
    renderWlToggle();
    renderPickGrid();
  });
  $('insp-tab-beats').addEventListener('click', () => { ui.inspTab = 'BEATS'; renderInspector(); });
  $('insp-tab-loses').addEventListener('click', () => { ui.inspTab = 'LOSES'; renderInspector(); });

  const lockMove = () => {
    if (ui.selectedId === null || me()?.locked) return;
    app.session?.lock(ui.selectedId);
  };
  $('btn-lock-desktop').addEventListener('click', lockMove);
  $('btn-lock-mobile').addEventListener('click', lockMove);
}
