/** Final podium + W/D/L table. */
import { $, esc } from '../dom';
import { app, isHost, sortedPlayers } from '../store';
import { renderHistory } from './history';

export function renderPodium(): void {
  const v = app.view;
  if (!v) return;
  const sorted = sortedPlayers();
  const top = sorted[0]?.score ?? 0;
  const champs = sorted.filter((p) => p.score === top);

  $('podium-champion').textContent = champs.map((c) => c.name).join(' · ');
  $('podium-meta').textContent = `RPS-${v.config.variantN} · ${v.config.rounds}R`;

  const slots = [
    { p: sorted[1], rank: '2ND', h: 'h-24', bg: 'bg-tint text-ink' },
    { p: sorted[0], rank: '1ST', h: 'h-32', bg: 'bg-deep text-stock' },
    { p: sorted[2], rank: '3RD', h: 'h-20', bg: 'bg-paper text-ink' },
  ];
  $('podium-blocks').innerHTML = slots.map((s) => {
    if (!s.p) return `<div class="${s.h} border-[1.5px] border-dashed border-ink/25 rounded-[4px]"></div>`;
    return `
      <div class="flex flex-col items-center">
        <div class="font-sans font-bold text-xs sm:text-sm uppercase truncate max-w-full mb-1.5">${esc(s.p.name)}</div>
        <div class="w-full ${s.h} ${s.bg} border-[1.5px] border-ink rounded-[4px] shadow-[3px_3px_0_#1A2418] flex flex-col items-center justify-center p-2">
          <span class="font-mono text-xs font-bold">${s.rank}</span>
          <span class="font-mono text-lg font-bold leading-tight mt-0.5">${s.p.score}</span>
        </div>
      </div>
    `;
  }).join('');

  $('podium-table').innerHTML = sorted.map((p, i) => `
    <div class="flex items-center justify-between px-3.5 py-2 border-[1.5px] border-ink rounded-[4px] ${i === 0 ? 'bg-deep text-stock shadow-[2px_2px_0_#1A2418]' : 'bg-paper text-ink'}">
      <div class="flex items-center gap-3 min-w-0">
        <span class="font-mono text-xs font-bold">${i + 1}</span>
        <span class="font-sans font-bold text-sm uppercase truncate">${esc(p.name)}</span>
        ${p.bot ? `<span class="font-mono text-[9px] font-bold px-1 border border-current rounded-[2px] shrink-0">BOT</span>` : ''}
      </div>
      <div class="flex items-center gap-3 font-mono text-xs shrink-0">
        <span class="${i === 0 ? 'text-paper' : 'text-ink/70'}">${p.w}W · ${p.d}D · ${p.l}L</span>
        <span class="font-bold">${p.score} PTS</span>
      </div>
    </div>
  `).join('');

  renderHistory('podium-history-wrap', 'podium-history');

  const bots = v.players.filter((p) => p.bot && p.persona);
  $('podium-reveal-wrap').classList.toggle('hidden', bots.length === 0);
  $('podium-reveal').innerHTML = bots.map((p) => `
    <div class="flex items-start gap-2.5 px-3 py-2.5 bg-stock border-[1.5px] border-ink rounded-[4px] shadow-[2px_2px_0_#1A2418]">
      <div class="w-9 h-9 shrink-0 bg-paper border-[1.5px] border-ink rounded-[4px] flex items-center justify-center text-lg">${p.persona!.emoji}</div>
      <div class="min-w-0">
        <div class="flex flex-wrap items-baseline gap-x-2">
          <span class="font-sans font-bold text-sm uppercase">${esc(p.name)}</span>
          <span class="font-mono text-[10px] font-bold text-deep">${esc(p.persona!.title)}</span>
        </div>
        <div class="font-mono text-[11px] text-ink/75 leading-snug mt-0.5">${esc(p.persona!.detail)}</div>
      </div>
    </div>
  `).join('');

  const rematch = $<HTMLButtonElement>('btn-rematch');
  const lobby = $<HTMLButtonElement>('btn-podium-lobby');
  if (v.mode === 'room') {
    const host = isHost();
    rematch.disabled = !host;
    rematch.textContent = host ? 'REMATCH' : 'WAITING FOR HOST…';
    lobby.textContent = host ? 'ROOM LOBBY' : 'LEAVE ROOM';
  } else {
    rematch.disabled = false;
    rematch.textContent = 'REMATCH';
    lobby.textContent = 'LOBBY';
  }
}

export function wirePodium(leave: () => void): void {
  $('btn-rematch').addEventListener('click', () => app.session?.rematch());
  $('btn-podium-lobby').addEventListener('click', () => {
    if (app.view?.mode === 'room' && isHost()) app.session?.toLobby();
    else leave();
  });
}
