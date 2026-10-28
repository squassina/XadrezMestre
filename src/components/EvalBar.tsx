import React from 'react';

interface EvalBarProps {
  score: number; // in centipawns (+ is white, - is black)
  isCheckmate?: boolean;
  orientation?: 'w' | 'b';
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, isCheckmate = false, orientation = 'w' }) => {
  // Convert centipawns to display string
  const formatScore = () => {
    if (isCheckmate) {
      return score > 0 ? '+M' : '-M';
    }
    const val = (score / 100).toFixed(1);
    if (score > 0) return `+${val}`;
    return val;
  };

  // Calculate percentage height for white
  // 0 cp = 50%, +500 cp = ~85%, -500 cp = ~15%
  // Using sigmoid-like curve for smooth representation
  let whitePercent = 50 + (2 / (1 + Math.exp(-0.0035 * score)) - 1) * 50;
  whitePercent = Math.max(5, Math.min(95, whitePercent));

  if (isCheckmate) {
    whitePercent = score > 0 ? 100 : 0;
  }

  // If orientation is black, flip bar
  const topPercent = orientation === 'w' ? 100 - whitePercent : whitePercent;
  const bottomScoreText = orientation === 'w' ? formatScore() : formatScore();

  return (
    <div className="flex flex-col items-center gap-1 select-none w-8">
      {/* Visual Bar */}
      <div className="relative w-4 h-full min-h-[320px] max-h-[560px] rounded-full overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner flex flex-col justify-between">
        {/* Black side (top if white orientation) */}
        <div
          className="w-full bg-slate-800 transition-all duration-300 ease-out"
          style={{ height: `${topPercent}%` }}
        />
        {/* White side (bottom if white orientation) */}
        <div
          className="w-full bg-slate-100 transition-all duration-300 ease-out"
          style={{ height: `${100 - topPercent}%` }}
        />
      </div>

      {/* Numeric Score */}
      <div className="text-[11px] font-mono tabular-nums font-semibold px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-center">
        {bottomScoreText}
      </div>
    </div>
  );
};
