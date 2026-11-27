import { $, esc, optionGrid, segTabClass } from '../dom';
import { ICON_STYLES, iconStyle, setIconStyle, type IconStyle } from '../icons';
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

/* Settings popover ---------------------------------------------------------- */

const ICON_LABELS: Record<IconStyle, string> = { HAND: '✋ HANDS', EMOJI: '😀 EMOJI' };

function renderSettings(onChange: () => void): void {
  optionGrid($('settings-icons'), ICON_STYLES, iconStyle(), {
    label: (s) => ICON_LABELS[s],
    onPick: (s) => {
      if (s === iconStyle()) return;
      setIconStyle(s);
      renderSettings(onChange);
      onChange();
    },
  });
}

export function wireSettings(onChange: () => void): void {
  const btn = $('nav-settings-btn');
  const pop = $('nav-settings-pop');
  const close = () => {
    pop.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    $('nav-standings-drawer').classList.add('hidden');
    const open = pop.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(open));
    if (open) renderSettings(onChange);
  });
  pop.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
