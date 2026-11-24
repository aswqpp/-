/** Main lobby: SOLO setup (bots) or ROOM (create / join by code). */
import { MAX_PLAYERS, ROUND_OPTIONS, TIMER_OPTIONS } from '../../shared/engine';
import { normalizeCode } from '../../shared/protocol';
import { VARIANTS, VARIANT_KEYS } from '../../shared/variants';
import { $, optionGrid, segTabClass } from '../dom';
import { app } from '../store';

export const timerLabel = (s: number) => (s === 0 ? 'OFF' : `${s}s`);

export function renderLobby(): void {
  const solo = app.lobbyMode === 'SOLO';
  $('mode-solo').className = segTabClass(solo, true);
  $('mode-room').className = segTabClass(!solo, false);
  $('panel-solo').classList.toggle('hidden', !solo);
  $('panel-room').classList.toggle('hidden', solo);

  const nameEl = $<HTMLInputElement>('input-player-name');
  if (document.activeElement !== nameEl) nameEl.value = app.name;

  $('lobby-variant-badge').textContent = `RPS-${app.solo.variantN}`;
  optionGrid($('lobby-variants'), VARIANT_KEYS, app.solo.variantN, {
    size: 'lg', tone: 'deep',
    label: (k) => VARIANTS[k].label,
    sub: (k) => VARIANTS[k].sub,
    onPick: (k) => { app.solo.variantN = k; renderLobby(); $('nav-variant-pill').textContent = `RPS-${k}`; },
  });
  const botCounts = Array.from({ length: MAX_PLAYERS - 1 }, (_, i) => i + 1);
  optionGrid($('lobby-bots'), botCounts, app.solo.bots, {
    onPick: (c) => { app.solo.bots = c; renderLobby(); },
  });
  optionGrid($('lobby-rounds'), ROUND_OPTIONS, app.solo.rounds, {
    onPick: (r) => { app.solo.rounds = r; renderLobby(); },
  });
  optionGrid($('lobby-timer'), TIMER_OPTIONS, app.solo.timerSec, {
    label: timerLabel,
    onPick: (t) => { app.solo.timerSec = t; renderLobby(); },
  });

  for (const id of ['btn-start-solo', 'btn-create-room', 'btn-join-room']) {
    $<HTMLButtonElement>(id).disabled = app.busy;
  }
}

export function wireLobby(actions: {
  startSolo: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  openRing: () => void;
  saveName: (name: string) => void;
}): void {
  $('mode-solo').addEventListener('click', () => { app.lobbyMode = 'SOLO'; renderLobby(); });
  $('mode-room').addEventListener('click', () => { app.lobbyMode = 'ROOM'; renderLobby(); });
  $<HTMLInputElement>('input-player-name').addEventListener('input', (e) => {
    actions.saveName((e.target as HTMLInputElement).value);
  });
  $('btn-start-solo').addEventListener('click', actions.startSolo);
  $('btn-create-room').addEventListener('click', actions.createRoom);
  const codeEl = $<HTMLInputElement>('input-room-code');
  codeEl.addEventListener('input', () => {
    codeEl.value = codeEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
  $('form-join').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = normalizeCode(codeEl.value);
    if (!code) {
      codeEl.focus();
      codeEl.classList.add('border-loss');
      setTimeout(() => codeEl.classList.remove('border-loss'), 900);
      return;
    }
    actions.joinRoom(code);
  });
  $('btn-lobby-ring').addEventListener('click', actions.openRing);
}
