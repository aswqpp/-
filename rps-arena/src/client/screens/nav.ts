import { $, esc, segTabClass } from '../dom';
import { app, currentScreen, isMe, sortedPlayers, ui } from '../store';

const SCREENS = ['lobby', 'room', 'pick', 'reveal', 'podium', 'ring'] as const;

/** Show the current screen and refresh the top bar. */
export function syncView(): void {
  const target = currentScreen();
  for (const s of SCREENS) $(`screen-${s}`).classList.toggle('hidden', s !== target);

  $('tab-play').className = segTabClass(app.tab === 'PLAY', true);
  $('tab-ring').className = segTabClass(app.tab === 'RING', false);

  const pillN = app.tab === 'RING' ? ui.ringVariantN : (app.view?.config.variantN ?? app.solo.variantN);
  $('nav-variant-pill').textContent = `RPS-${pillN}`;

  const roomBadge = $('nav-room-badge');
  const code = app.session?.code;
  roomBadge.textContent = code ? `ROOM ${code}` : 'SOLO';
  // Desktop only: on phones the top bar has no room for it.
  roomBadge.classList.toggle('sm:inline-flex', !!app.session);

  const inMatch = !!app.view && app.view.phase !== 'lobby';
  $('nav-standings-wrap').classList.toggle('hidden', !inMatch);
  if (inMatch) renderStandingsDrawer();

  const banner = $('net-banner');
  const showNet = app.session?.kind === 'room' && app.net === 'reconnecting';
  banner.classList.toggle('hidden', !showNet);
  banner.textContent = showNet ? 'CONNECTION LOST · RECONNECTING…' : '';
}

export function renderStandingsDrawer(): void {
  const v = app.view;
  if (!v) return;
  $('drawer-round-tag').textContent = `R${v.round} / ${v.config.rounds}`;
  $('drawer-standings-list').innerHTML = sortedPlayers().map((p, i) => `
    <div class="flex items-center justify-between px-2.5 py-1.5 border-[1.5px] border-ink rounded-[3px] font-mono text-xs ${isMe(p) ? 'bg-deep text-stock font-bold' : 'bg-paper text-ink'}">
      <span class="truncate">${i + 1}. ${esc(p.name)}${p.connected ? '' : ' · OFF'}</span>
      <span class="font-bold">${p.score}</span>
    </div>
  `).join('');
}

export function wireNav(openPlay: () => void, openRing: (sync: boolean) => void): void {
  $('brand-btn').addEventListener('click', openPlay);
  $('tab-play').addEventListener('click', openPlay);
  $('tab-ring').addEventListener('click', () => openRing(false));

  const toggleDrawer = (e: Event) => {
    e.stopPropagation();
    renderStandingsDrawer();
    $('nav-standings-drawer').classList.toggle('hidden');
  };
  $('nav-standings-btn').addEventListener('click', toggleDrawer);
  $('hud-standings-btn').addEventListener('click', toggleDrawer);
  $('nav-standings-drawer').addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => $('nav-standings-drawer').classList.add('hidden'));
}
