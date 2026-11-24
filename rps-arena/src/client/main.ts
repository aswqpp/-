import './styles.css';
import { cleanName } from '../shared/engine';
import { normalizeCode, type GameView } from '../shared/protocol';
import { $, toast } from './dom';
import { renderLobby, wireLobby } from './screens/lobby';
import { syncView, wireNav } from './screens/nav';
import { refreshPickStatus, renderPick, resetPick, updateTimer, wirePick } from './screens/pick';
import { renderPodium, wirePodium } from './screens/podium';
import { enterReveal, renderReveal, wireReveal } from './screens/reveal';
import { renderRingPage } from './screens/ring';
import { renderRoom, wireRoom } from './screens/room';
import { RoomSession, SoloSession, createRoom, hasSeatToken, type SessionEvents } from './session';
import { app, clearChoreoTimers, currentScreen, setRenderer, ui } from './store';

const NAME_KEY = 'rps.name';

function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveName(raw: string): void {
  app.name = raw;
  try {
    localStorage.setItem(NAME_KEY, raw);
  } catch {
    /* ignore */
  }
}

function playerName(): string {
  return cleanName(app.name, 'YOU');
}

function setRoomInUrl(code: string | null): void {
  const url = new URL(location.href);
  if (code) url.searchParams.set('room', code);
  else url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

/* ------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* ------------------------------------------------------------------------- */

function renderAll(): void {
  syncView();
  switch (currentScreen()) {
    case 'lobby': renderLobby(); break;
    case 'room': renderRoom(); break;
    case 'pick': renderPick(); break;
    case 'reveal': renderReveal(); break;
    case 'podium': renderPodium(); break;
    case 'ring': renderRingPage(); break;
  }
}
setRenderer(renderAll);

/** A new view from the session: run phase transitions, then redraw. */
function onView(view: GameView): void {
  app.view = view;
  app.clockOffset = view.serverNow - Date.now();
  const key = `${view.phase}:${view.round}`;
  const changed = key !== ui.phaseKey;
  ui.phaseKey = key;

  if (!changed) {
    // Same phase: only patch what the update can touch.
    syncView();
    if (app.tab === 'RING') return;
    if (view.phase === 'pick') refreshPickStatus();
    else renderAll();
    return;
  }

  clearChoreoTimers();
  if (view.phase === 'pick') resetPick();
  if (app.tab === 'PLAY') window.scrollTo({ top: 0, behavior: 'smooth' });
  syncView();
  if (app.tab === 'RING') return;
  if (view.phase === 'reveal') enterReveal();
  else renderAll();
}

function sessionEvents(): SessionEvents {
  return {
    view: onView,
    status: (s) => {
      app.net = s;
      syncView();
      if (currentScreen() === 'room') renderRoom();
    },
    notice: (msg) => toast(msg),
    ended: (msg) => {
      endSession();
      if (msg) toast(msg);
    },
  };
}

function endSession(): void {
  clearChoreoTimers();
  app.session = null;
  app.view = null;
  app.net = 'open';
  ui.phaseKey = '';
  setRoomInUrl(null);
  app.tab = 'PLAY';
  renderAll();
}

/* ------------------------------------------------------------------------- */
/* Actions                                                                    */
/* ------------------------------------------------------------------------- */

function startSolo(): void {
  const s = app.solo;
  const session = new SoloSession(
    { config: { variantN: s.variantN, rounds: s.rounds, timerSec: s.timerSec }, name: playerName(), bots: s.bots },
    sessionEvents(),
  );
  app.session = session;
  app.tab = 'PLAY';
  session.start();
}

function joinRoom(code: string): void {
  app.session?.leave();
  app.view = null;
  ui.phaseKey = '';
  app.tab = 'PLAY';
  app.session = new RoomSession(code, playerName(), sessionEvents());
  setRoomInUrl(code);
  renderAll();
}

async function onCreateRoom(): Promise<void> {
  if (app.busy) return;
  app.busy = true;
  renderLobby();
  try {
    joinRoom(await createRoom());
  } catch (e) {
    toast(`COULD NOT CREATE ROOM · ${(e as Error).message}`);
  } finally {
    app.busy = false;
    if (currentScreen() === 'lobby') renderLobby();
  }
}

function leave(): void {
  if (app.session) app.session.leave();
  else endSession();
}

function openPlay(): void {
  app.tab = 'PLAY';
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openRing(syncVariant: boolean): void {
  if (syncVariant) {
    ui.ringVariantN = app.view?.config.variantN ?? app.solo.variantN;
    ui.ringSelectedId = 0;
    ui.ringHoverId = null;
  }
  app.tab = 'RING';
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ------------------------------------------------------------------------- */
/* Boot                                                                       */
/* ------------------------------------------------------------------------- */

function boot(): void {
  app.name = loadName();
  wireNav(openPlay, openRing);
  wireLobby({
    startSolo,
    createRoom: () => void onCreateRoom(),
    joinRoom,
    openRing: () => openRing(true),
    saveName,
  });
  wireRoom(leave);
  wirePick();
  wireReveal();
  wirePodium(leave);

  // Countdown display (the deadline itself is enforced by engine/server).
  setInterval(() => {
    if (currentScreen() === 'pick') updateTimer();
  }, 250);

  // ?room=CODE: rejoin straight away if this browser already holds a seat
  // there (e.g. a reload), otherwise prefill the join form.
  const code = normalizeCode(new URLSearchParams(location.search).get('room') ?? '');
  if (code) {
    app.lobbyMode = 'ROOM';
    $<HTMLInputElement>('input-room-code').value = code;
    if (hasSeatToken(code)) {
      joinRoom(code);
      return;
    }
    setRoomInUrl(null);
  }
  renderAll();
  if (code) $<HTMLInputElement>('input-player-name').focus();
}

boot();
