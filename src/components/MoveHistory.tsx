import React, { useRef, useEffect } from 'react';
import { AnalyzedMove, MoveQuality } from '../types/chess';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Copy, Check } from 'lucide-react';
import { ChessPiece } from './ChessPiece';
import { PieceSymbol, Color } from 'chess.js';
import { useI18n } from '../i18n';

interface MoveHistoryProps {
  moves: AnalyzedMove[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
  capturedWhite: PieceSymbol[];
  capturedBlack: PieceSymbol[];
  materialDiff: number; // positive = white has more, negative = black has more
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove,
  capturedWhite,
  capturedBlack,
  materialDiff,
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  const getQualityBadge = (move?: AnalyzedMove) => {
    if (!move) return null;
    if (move.isBookMove) {
      return <span className="text-[10px] font-bold text-sky-400 font-mono" title={t('Livro Teórico de Aberturas')}>📖</span>;
    }
    switch (move.quality) {
      case 'brilliant':
        return <span className="text-[10px] font-bold text-cyan-400 font-mono">!!</span>;
      case 'best':
        return <span className="text-[10px] font-bold text-emerald-400 font-mono">!</span>;
      case 'good':
        return null;
      case 'inaccuracy':
        return <span className="text-[10px] font-bold text-amber-400 font-mono">?!</span>;
      case 'mistake':
        return <span className="text-[10px] font-bold text-orange-400 font-mono">?</span>;
      case 'blunder':
        return <span className="text-[10px] font-bold text-rose-500 font-mono">??</span>;
      case 'missed_win':
        return <span className="text-[10px] font-bold text-purple-400 font-mono">+-</span>;
      default:
        return null;
    }
  };

  const copyPGN = () => {
    let pgn = '';
    for (let i = 0; i < moves.length; i += 2) {
      const turnNum = Math.floor(i / 2) + 1;
      const whiteMove = moves[i]?.san || '';
      const blackMove = moves[i + 1]?.san || '';
      pgn += `${turnNum}. ${whiteMove} ${blackMove} `.trim() + ' ';
    }
    navigator.clipboard.writeText(pgn.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Group moves into pairs (White & Black)
  const movePairs: { turn: number; white?: AnalyzedMove; black?: AnalyzedMove; whiteIdx?: number; blackIdx?: number }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      turn: Math.floor(i / 2) + 1,
      white: moves[i],
      whiteIdx: i,
      black: moves[i + 1],
      blackIdx: i + 1,
    });
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Captured Pieces & Material Differential Bar */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/60 flex flex-col gap-1 text-xs">
        {/* Black captured pieces */}
        <div className="flex items-center justify-between min-h-[22px]">
          <div className="flex items-center gap-0.5 flex-wrap">
            {capturedWhite.map((type, idx) => (
              <div key={idx} className="w-4 h-4 opacity-80">
                <ChessPiece type={type} color="w" />
              </div>
            ))}
          </div>
          {materialDiff < 0 && (
            <span className="text-[11px] font-mono font-bold text-slate-300">
              +{Math.abs(materialDiff)}
            </span>
          )}
        </div>

        {/* White captured pieces */}
        <div className="flex items-center justify-between min-h-[22px]">
          <div className="flex items-center gap-0.5 flex-wrap">
            {capturedBlack.map((type, idx) => (
              <div key={idx} className="w-4 h-4 opacity-80">
                <ChessPiece type={type} color="b" />
              </div>
            ))}
          </div>
          {materialDiff > 0 && (
            <span className="text-[11px] font-mono font-bold text-slate-300">
              +{materialDiff}
            </span>
          )}
        </div>
      </div>

      {/* Move list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-sans text-xs italic">
            Nenhum lance jogado ainda.
          </div>
        ) : (
          movePairs.map((pair) => (
            <div key={pair.turn} className="flex items-center py-1 px-1.5 rounded hover:bg-slate-800/40">
              <span className="w-7 text-slate-500 font-semibold">{pair.turn}.</span>

              {/* White move */}
              {pair.white && (
                <button
                  onClick={() => onSelectMove(pair.whiteIdx!)}
                  className={`flex-1 flex items-center justify-between px-2 py-0.5 rounded transition-colors text-left ${
                    currentMoveIndex === pair.whiteIdx
                      ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{pair.white.san}</span>
                  {getQualityBadge(pair.white)}
                </button>
              )}

              {/* Black move */}
              {pair.black ? (
                <button
                  onClick={() => onSelectMove(pair.blackIdx!)}
                  className={`flex-1 flex items-center justify-between px-2 py-0.5 rounded transition-colors text-left ${
                    currentMoveIndex === pair.blackIdx
                      ? 'bg-amber-500/20 text-amber-200 font-bold border border-amber-500/30'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{pair.black.san}</span>
                  {getQualityBadge(pair.black)}
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Navigation Buttons & PGN Copy */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectMove(-1)}
            disabled={currentMoveIndex === -1 || moves.length === 0}
            title="Início"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronFirst className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectMove(Math.max(-1, currentMoveIndex - 1))}
            disabled={currentMoveIndex === -1 || moves.length === 0}
            title="Lance Anterior"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectMove(Math.min(moves.length - 1, currentMoveIndex + 1))}
            disabled={currentMoveIndex >= moves.length - 1}
            title="Próximo Lance"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectMove(moves.length - 1)}
            disabled={currentMoveIndex >= moves.length - 1}
            title="Último Lance"
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronLast className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={copyPGN}
          disabled={moves.length === 0}
          title="Copiar PGN da Partida"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs disabled:opacity-30"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? t('Copiado') : t('PGN')}</span>
        </button>
      </div>
    </div>
  );
};
