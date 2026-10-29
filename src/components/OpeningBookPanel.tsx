import React from 'react';
import { BookOpen, Compass, ChevronRight, Check } from 'lucide-react';
import { getOpeningForPosition, BookMove } from '../data/openings';
import { useI18n } from '../i18n';

interface OpeningBookPanelProps {
  fen: string;
  moveCount: number;
  onPreviewMove?: (san: string) => void;
}

export const OpeningBookPanel: React.FC<OpeningBookPanelProps> = ({
  fen,
  moveCount,
  onPreviewMove,
}) => {
  const { t } = useI18n();
  const opening = getOpeningForPosition(fen);

  if (!opening || moveCount > 30) {
    if (moveCount > 20) {
      return (
        <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-500" />
            <span>{t('Fase de Meio-Jogo / Fim da Teoria')}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">{t('Motor de Cálculo Ativo')}</span>
        </div>
      );
    }
    return null;
  }

  const totalWeight = opening.moves.reduce((sum, m) => sum + m.weight, 0);

  return (
    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2.5 shadow-md">
      {/* Header: ECO & Opening Name */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-sky-400 px-1 py-0.2 rounded bg-sky-950/60 border border-sky-800/60">
                {opening.eco}
              </span>
              <h4 className="text-xs font-bold text-slate-100">{t(opening.name)}</h4>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40">
          {t('Linha Teórica')}
        </span>
      </div>

      {/* Strategic Plan */}
      {opening.plan && (
        <p className="text-[11px] text-slate-300 leading-relaxed italic">
          <strong className="text-slate-200 not-italic">{t('Plano:')}</strong> {t(opening.plan)}
        </p>
      )}

      {/* Candidate Main-Line Moves */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {t('Lances Principais do Livro (Mestres)')}
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {opening.moves.map((m, idx) => {
            const pct = Math.round((m.weight / totalWeight) * 100);
            return (
              <div
                key={m.san}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-300 text-sm">{m.san}</span>
                    {m.name && <span className="text-slate-300 font-medium text-[11px]">{t(m.name)}</span>}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{pct}%</span>
                </div>

                {/* Frequency bar */}
                <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>

                {m.comment && (
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t(m.comment)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
