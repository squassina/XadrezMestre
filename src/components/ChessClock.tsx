import React from 'react';
import { Flag, Clock } from 'lucide-react';

interface ChessClockProps {
  timeRemainingMs: number;
  isActive: boolean;
  playerColor: 'w' | 'b';
  compact?: boolean;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeRemainingMs,
  isActive,
  playerColor,
  compact = false,
}) => {
  const isFlagged = timeRemainingMs <= 0;
  const totalSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
  const tenths = Math.max(0, Math.floor((timeRemainingMs % 1000) / 100));

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const isLowTime = totalSeconds < 30 && !isFlagged;
  const isCriticalTime = totalSeconds < 10 && !isFlagged;

  // Format string
  let displayTime = '';
  if (isFlagged) {
    displayTime = '00:00';
  } else if (totalSeconds < 10) {
    // Show tenths of second under 10 seconds for intense bullet/blitz tension
    displayTime = `0${seconds}.${tenths}`;
  } else {
    const padMin = minutes.toString().padStart(2, '0');
    const padSec = seconds.toString().padStart(2, '0');
    displayTime = `${padMin}:${padSec}`;
  }

  const containerClasses = isFlagged
    ? 'bg-rose-950/80 text-rose-300 border-rose-600/80 ring-1 ring-rose-500/50'
    : isCriticalTime
    ? 'bg-rose-950/50 text-rose-300 border-rose-500/80 animate-pulse'
    : isLowTime
    ? 'bg-amber-950/40 text-amber-300 border-amber-500/60'
    : isActive
    ? 'bg-slate-900 text-slate-100 border-amber-500/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
    : 'bg-slate-950/80 text-slate-400 border-slate-800';

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs tabular-nums select-none transition-all ${containerClasses}`}
      >
        {isFlagged ? (
          <Flag className="w-3 h-3 text-rose-400 shrink-0" />
        ) : (
          <Clock className={`w-3 h-3 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
        )}
        <span>{displayTime}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2 rounded-xl border select-none transition-all ${containerClasses}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full border ${
            playerColor === 'w' ? 'bg-white border-slate-400' : 'bg-slate-950 border-slate-600'
          }`}
        />
        <span className="text-[11px] text-slate-400 font-medium">
          {playerColor === 'w' ? 'Brancas' : 'Pretas'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-mono font-bold text-base tabular-nums tracking-wider">
        {isFlagged && <Flag className="w-4 h-4 text-rose-400 animate-bounce" />}
        <span>{displayTime}</span>
      </div>
    </div>
  );
};
