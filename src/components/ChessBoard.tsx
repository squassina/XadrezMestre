import React, { useState } from 'react';
import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { BoardArrow } from '../types/chess';

interface ChessBoardProps {
  chess: Chess;
  orientation?: 'w' | 'b';
  onMove?: (move: { from: Square; to: Square; promotion?: string }) => boolean | void;
  interactive?: boolean;
  arrows?: BoardArrow[];
  lastMove?: { from: string; to: string } | null;
  boardTheme?: 'tournament' | 'wood' | 'emerald';
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  orientation = 'w',
  onMove,
  interactive = true,
  arrows = [],
  lastMove = null,
  boardTheme = 'emerald',
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  const displayFiles = orientation === 'w' ? FILES : [...FILES].reverse();
  const displayRanks = orientation === 'w' ? RANKS : [...RANKS].reverse();

  // Color schemes
  const themes = {
    emerald: {
      light: 'bg-[#ebd4b4] text-[#769656]',
      dark: 'bg-[#769656] text-[#ebd4b4]',
      selected: 'bg-amber-400/80 ring-2 ring-amber-300 ring-inset',
      lastMove: 'bg-amber-300/40',
      check: 'bg-rose-500/80 animate-pulse',
    },
    wood: {
      light: 'bg-[#e3c099] text-[#b88b4a]',
      dark: 'bg-[#b88b4a] text-[#e3c099]',
      selected: 'bg-amber-500/80 ring-2 ring-amber-300 ring-inset',
      lastMove: 'bg-amber-400/40',
      check: 'bg-rose-600/80 animate-pulse',
    },
    tournament: {
      light: 'bg-[#dee3e6] text-[#8ca2ad]',
      dark: 'bg-[#8ca2ad] text-[#dee3e6]',
      selected: 'bg-sky-400/80 ring-2 ring-sky-300 ring-inset',
      lastMove: 'bg-sky-300/40',
      check: 'bg-rose-500/80 animate-pulse',
    },
  };

  const currentTheme = themes[boardTheme];

  const handleSquareClick = (square: Square) => {
    if (!interactive) return;

    if (promotionPending) {
      setPromotionPending(null);
      return;
    }

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      // Check if clicking another own piece
      const clickedPiece = chess.get(square);
      if (clickedPiece && clickedPiece.color === chess.turn()) {
        setSelectedSquare(square);
        const legal = chess.moves({ square, verbose: true }).map((m) => m.to as Square);
        setValidMoves(legal);
        return;
      }

      // Attempt move
      if (validMoves.includes(square)) {
        const piece = chess.get(selectedSquare);
        const isPromotion = piece?.type === 'p' && (square.endsWith('8') || square.endsWith('1'));

        if (isPromotion) {
          setPromotionPending({ from: selectedSquare, to: square });
          return;
        }

        executeMove(selectedSquare, square);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const legal = chess.moves({ square, verbose: true }).map((m) => m.to as Square);
        setValidMoves(legal);
      }
    }
  };

  const executeMove = (from: Square, to: Square, promotion?: string) => {
    if (onMove) {
      onMove({ from, to, promotion });
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setPromotionPending(null);
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!interactive) return;
    const piece = chess.get(square);
    if (!piece || piece.color !== chess.turn()) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setSelectedSquare(square);
    const legal = chess.moves({ square, verbose: true }).map((m) => m.to as Square);
    setValidMoves(legal);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    if (!draggedSquare) return;

    if (validMoves.includes(targetSquare)) {
      const piece = chess.get(draggedSquare);
      const isPromotion = piece?.type === 'p' && (targetSquare.endsWith('8') || targetSquare.endsWith('1'));

      if (isPromotion) {
        setPromotionPending({ from: draggedSquare, to: targetSquare });
      } else {
        executeMove(draggedSquare, targetSquare);
      }
    }

    setDraggedSquare(null);
  };

  // King in check identification
  const inCheck = chess.inCheck();
  let checkSquare: Square | null = null;
  if (inCheck) {
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          checkSquare = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        }
      }
    }
  }

  // Calculate coordinates for arrows in percentage (0 to 100)
  const getSquareCenterPercent = (square: string) => {
    const file = square.charAt(0);
    const rank = square.charAt(1);
    const fileIdx = displayFiles.indexOf(file);
    const rankIdx = displayRanks.indexOf(rank);
    return {
      x: (fileIdx + 0.5) * 12.5,
      y: (rankIdx + 0.5) * 12.5,
    };
  };

  return (
    <div className="relative w-full max-w-[560px] aspect-square rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 select-none bg-slate-900">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const isLight = (rIdx + fIdx) % 2 === 0;
            const piece = chess.get(square);
            const isSelected = selectedSquare === square;
            const isValidDest = validMoves.includes(square);
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isKingInCheck = checkSquare === square;

            let squareBg = isLight ? currentTheme.light : currentTheme.dark;
            if (isLastMove) squareBg += ` ${currentTheme.lastMove}`;
            if (isSelected) squareBg = currentTheme.selected;
            if (isKingInCheck) squareBg = currentTheme.check;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${squareBg}`}
              >
                {/* Board Rank/File labels */}
                {fIdx === 0 && (
                  <span className="absolute top-0.5 left-1 text-[10px] font-bold opacity-60 pointer-events-none">
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-60 pointer-events-none">
                    {file}
                  </span>
                )}

                {/* Chess piece */}
                {piece && (
                  <div
                    draggable={interactive && piece.color === chess.turn()}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-[84%] h-[84%] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing z-10"
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Valid Move Indicator */}
                {isValidDest && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {piece ? (
                      // Capture ring
                      <div className="w-[80%] h-[80%] rounded-full border-4 border-amber-400/80 ring-2 ring-black/20" />
                    ) : (
                      // Empty square dot
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90 shadow-md ring-2 ring-black/20" />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Arrows Layer */}
      {arrows.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 100 100">
          <defs>
            <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M 0,0 L 6,3 L 0,6 z" fill="#10b981" />
            </marker>
            <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M 0,0 L 6,3 L 0,6 z" fill="#ef4444" />
            </marker>
            <marker id="arrow-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M 0,0 L 6,3 L 0,6 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M 0,0 L 6,3 L 0,6 z" fill="#38bdf8" />
            </marker>
          </defs>
          {arrows.map((arr, i) => {
            const start = getSquareCenterPercent(arr.from);
            const end = getSquareCenterPercent(arr.to);
            const colorMap = {
              green: '#10b981',
              red: '#ef4444',
              amber: '#f59e0b',
              blue: '#38bdf8',
            };
            return (
              <line
                key={`arrow-${i}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={colorMap[arr.color] || '#10b981'}
                strokeWidth={arr.width || 2.2}
                strokeLinecap="round"
                opacity={0.88}
                markerEnd={`url(#arrow-${arr.color})`}
              />
            );
          })}
        </svg>
      )}

      {/* Pawn Promotion Modal */}
      {promotionPending && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3">
            <span className="text-sm font-semibold text-slate-200">Escolha a Promoção</span>
            <div className="flex gap-2">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((pType) => (
                <button
                  key={pType}
                  onClick={() => executeMove(promotionPending.from, promotionPending.to, pType)}
                  className="w-14 h-14 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center p-2 transition-all hover:scale-105"
                >
                  <ChessPiece type={pType} color={chess.turn()} />
                </button>
              ))}
            </div>
            <button
              onClick={() => setPromotionPending(null)}
              className="text-xs text-slate-400 hover:text-slate-200 underline mt-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
