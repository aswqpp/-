/**
 * ROUND LOG: who threw what in every finished round, and what it scored.
 * Shown while picking so you can study the bots' habits.
 */
import { fmtId } from '../../shared/judge';
import { $, esc } from '../dom';
import { iconHtml } from '../icons';
import { activeVariant, app, isMe } from '../store';

export function renderHistory(wrapId: string, tableId: string): void {
  const v = app.view;
  const wrap = $(wrapId);
  const rounds = v ? Math.max(0, ...v.players.map((p) => p.history.length)) : 0;
  wrap.classList.toggle('hidden', rounds === 0);
  if (!v || rounds === 0) return;

  const variant = activeVariant();
  const n = variant.n;
  const head = Array.from({ length: rounds }, (_, i) => `
    <th scope="col" class="px-1.5 py-1.5 font-mono text-[10px] font-bold text-ink/60 text-center">R${i + 1}</th>`).join('');

  const rows = v.players.map((p) => {
    const mine = isMe(p);
    const cells = Array.from({ length: rounds }, (_, r) => {
      const pick = p.history[r];
      const it = pick === undefined ? null : variant.items[pick];
      const pts = p.roundPts[r] ?? 0;
      const ptsCls = pts > 0 ? 'text-deep' : 'text-ink/35';
      return `
        <td class="px-1 py-1 text-center align-middle">
          ${it ? `
            <div class="inline-flex flex-col items-center leading-none" title="${esc(`${fmtId(it.id, n)} ${it.name} · +${pts}`)}">
              ${iconHtml(it, 30)}
              <span class="font-mono text-[9px] font-bold mt-0.5 ${ptsCls}">+${pts}</span>
            </div>` : '<span class="text-ink/30">·</span>'}
        </td>`;
    }).join('');
    return `
      <tr class="border-t border-ink/15 ${mine ? 'bg-paper' : ''}">
        <th scope="row" class="sticky left-0 z-10 ${mine ? 'bg-paper' : 'bg-stock'} pl-2 pr-3 py-1.5 text-left">
          <div class="flex items-center gap-1.5">
            <span class="font-sans font-bold text-xs uppercase truncate max-w-[88px]">${esc(p.name)}</span>
            ${p.bot ? '<span class="font-mono text-[8px] font-bold px-1 border border-ink/50 rounded-[2px] text-ink/60">BOT</span>' : ''}
          </div>
        </th>
        ${cells}
        <td class="pl-2 pr-3 py-1 text-right font-mono text-xs font-bold">${p.score}</td>
      </tr>`;
  }).join('');

  $(tableId).innerHTML = `
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th scope="col" class="sticky left-0 z-10 bg-stock pl-2 pr-3 py-1.5 text-left font-mono text-[10px] font-bold text-ink/60">PLAYER</th>
          ${head}
          <th scope="col" class="pl-2 pr-3 py-1.5 text-right font-mono text-[10px] font-bold text-ink/60">PTS</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}
