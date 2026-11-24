/** Room waiting area: seats, bots, settings, start. */
import { MAX_PLAYERS, MIN_PLAYERS, ROUND_OPTIONS, TIMER_OPTIONS } from '../../shared/engine';
import { VARIANTS, VARIANT_KEYS } from '../../shared/variants';
import { $, copyText, esc, optionGrid, toast } from '../dom';
import { app, isHost, isMe } from '../store';
import { timerLabel } from './lobby';

export function inviteLink(code: string): string {
  return `${location.origin}${location.pathname}?room=${code}`;
}

export function renderRoom(): void {
  const s = app.session;
  const v = app.view;
  $('room-code-chip').textContent = s?.code ?? '----';

  if (!v) {
    $('room-status').textContent = app.net === 'reconnecting' ? 'RECONNECTING…' : 'CONNECTING…';
    $('room-seats').innerHTML = '';
    $('room-seat-count').textContent = `0 / ${MAX_PLAYERS}`;
    $('room-add-bots').classList.add('hidden');
    $<HTMLButtonElement>('btn-room-start').disabled = true;
    return;
  }

  const host = isHost();
  const hostP = v.players.find((p) => p.id === v.hostId);
  $('room-status').textContent = host
    ? 'YOU ARE HOST · SHARE THE CODE'
    : `HOST · ${hostP?.name ?? '—'}`;
  $('room-seat-count').textContent = `${v.players.length} / ${MAX_PLAYERS}`;

  const rows = v.players.map((p, i) => {
    const tags = [
      p.id === v.hostId ? '<span class="px-1.5 py-0.5 bg-ink text-stock rounded-[2px]">HOST</span>' : '',
      isMe(p) ? '<span class="px-1.5 py-0.5 bg-deep text-stock rounded-[2px]">YOU</span>' : '',
      p.bot ? '<span class="px-1.5 py-0.5 bg-tint text-ink border border-ink rounded-[2px]" title="Personality is dealt at random when the match starts">BOT · ???</span>' : '',
      !p.connected ? '<span class="px-1.5 py-0.5 bg-[#FCE9E4] text-loss border border-loss rounded-[2px]">OFFLINE</span>' : '',
    ].join('');
    const remove = host && p.bot
      ? `<button type="button" data-kick="${esc(p.id)}" aria-label="Remove ${esc(p.name)}" class="btn h-7 w-7 bg-stock font-mono text-xs font-bold flex items-center justify-center">×</button>`
      : '';
    return `
      <div class="flex items-center justify-between gap-2 px-3 py-2 border-[1.5px] border-ink rounded-[4px] ${isMe(p) ? 'bg-paper' : 'bg-stock'}">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="font-mono text-[11px] font-bold text-ink/60">${i + 1}</span>
          <span class="font-sans font-bold text-sm uppercase truncate">${esc(p.name)}</span>
        </div>
        <div class="flex items-center gap-1.5 font-mono text-[10px] font-bold shrink-0">${tags}${remove}</div>
      </div>`;
  });
  for (let i = v.players.length; i < MAX_PLAYERS; i++) {
    rows.push(`
      <div class="h-[42px] flex items-center px-3 border-[1.5px] border-dashed border-ink/30 rounded-[4px] font-mono text-[11px] font-semibold text-ink/40">
        ${i + 1} · OPEN SEAT
      </div>`);
  }
  const seats = $('room-seats');
  seats.innerHTML = rows.join('');
  seats.querySelectorAll<HTMLButtonElement>('[data-kick]').forEach((btn) => {
    btn.addEventListener('click', () => app.session?.removeBot(btn.dataset.kick!));
  });

  const addEl = $('room-add-bots');
  const canAdd = host && v.players.length < MAX_PLAYERS;
  addEl.classList.toggle('hidden', !canAdd);
  if (canAdd) {
    addEl.innerHTML = `
      <button type="button" id="btn-add-bot" class="btn w-full h-9 bg-tint text-ink font-mono text-[11px] font-bold uppercase">+ ADD BOT</button>`;
    $('btn-add-bot').addEventListener('click', () => app.session?.addBot());
  }

  $('room-host-note').textContent = host ? '' : 'HOST PICKS SETTINGS';
  const c = v.config;
  optionGrid($('room-variants'), VARIANT_KEYS, c.variantN, {
    size: 'lg', tone: 'deep', disabled: !host,
    label: (k) => VARIANTS[k].label, sub: (k) => VARIANTS[k].sub,
    onPick: (k) => app.session?.config({ variantN: k }),
  });
  optionGrid($('room-rounds'), ROUND_OPTIONS, c.rounds, {
    disabled: !host, onPick: (r) => app.session?.config({ rounds: r }),
  });
  optionGrid($('room-timer'), TIMER_OPTIONS, c.timerSec, {
    disabled: !host, label: timerLabel, onPick: (t) => app.session?.config({ timerSec: t }),
  });

  const start = $<HTMLButtonElement>('btn-room-start');
  const enough = v.players.length >= MIN_PLAYERS;
  start.disabled = !host || !enough;
  start.textContent = !host ? 'WAITING FOR HOST…' : enough ? 'START MATCH' : `NEED ${MIN_PLAYERS}+ PLAYERS · ADD A BOT`;
}

export function wireRoom(leave: () => void): void {
  $('btn-copy-code').addEventListener('click', async () => {
    const code = app.session?.code;
    if (!code) return;
    toast((await copyText(code)) ? `COPIED ${code}` : 'COPY FAILED');
  });
  $('btn-copy-link').addEventListener('click', async () => {
    const code = app.session?.code;
    if (!code) return;
    const link = inviteLink(code);
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: 'RPS ARENA', text: `Join my RPS room ${code}`, url: link });
        return;
      } catch {
        /* fall back to copying */
      }
    }
    toast((await copyText(link)) ? 'INVITE LINK COPIED' : 'COPY FAILED');
  });
  $('btn-room-start').addEventListener('click', () => app.session?.start());
  $('btn-room-leave').addEventListener('click', leave);
}
