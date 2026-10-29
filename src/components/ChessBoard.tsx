import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { BoardArrow, PieceSet, BoardTheme } from '../types/chess';

interface ChessBoardProps {
  chess: Chess;
  orientation?: 'w' | 'b';
  onMove?: (move: { from: Square; to: Square; promotion?: string }) => boolean | void;
  interactive?: boolean;
  arrows?: BoardArrow[];
  lastMove?: { from: string; to: string } | null;
  boardTheme?: BoardTheme;
  pieceSet?: PieceSet;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

interface BoardSquareProps {
  square: Square;
  rank: string;
  file: string;
  isLight: boolean;
  piece: { type: PieceSymbol; color: 'w' | 'b' } | null;
  isSelected: boolean;
  isValidDest: boolean;
  isLastMove: boolean;
  isKingInCheck: boolean;
  isDraggingThisPiece: boolean;
  pieceSet?: PieceSet;
  showRankLabel: boolean;
  showFileLabel: boolean;
  themeStyle: {
    light: string;
    dark: string;
    selected: string;
    lastMove: string;
  };
  onSquareClick: (square: Square) => void;
  onPointerDownPiece: (e: React.PointerEvent, square: Square) => void;
}

const BoardSquare = React.memo<BoardSquareProps>(({
  square,
  rank,
  file,
  isLight,
  piece,
  isSelected,
  isValidDest,
  isLastMove,
  isKingInCheck,
  isDraggingThisPiece,
  pieceSet = 'cburnett',
  showRankLabel,
  showFileLabel,
  themeStyle,
  onSquareClick,
  onPointerDownPiece,
}) => {
  let squareBg = isLight ? themeStyle.light : themeStyle.dark;
  if (isLastMove) squareBg += ` ${themeStyle.lastMove}`;
  if (isSelected) squareBg = themeStyle.selected;

  return (
    <div
      onClick={() => onSquareClick(square)}
      className={`relative flex items-center justify-center select-none transition-colors duration-75 ${squareBg}`}
    >
      {/* Board Rank/File labels */}
      {showRankLabel && (
        <span className="absolute top-0.5 left-1 text-[10px] font-bold opacity-60 pointer-events-none select-none">
          {rank}
        </span>
      )}
      {showFileLabel && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-60 pointer-events-none select-none">
          {file}
        </span>
      )}

      {/* King in Check radial pulse effect */}
      {isKingInCheck && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.7) 40%, rgba(185, 28, 28, 0) 85%)',
          }}
        />
      )}

      {/* Chess piece */}
      {piece && (
        <div
          onPointerDown={(e) => onPointerDownPiece(e, square)}
          className={`w-[86%] h-[86%] flex items-center justify-center z-10 cursor-grab active:cursor-grabbing piece-shadow transition-opacity duration-100 ${
            isDraggingThisPiece ? 'opacity-20 scale-95' : 'hover:scale-105 active:scale-95'
          }`}
        >
          <ChessPiece type={piece.type} color={piece.color} set={pieceSet} />
        </div>
      )}

      {/* Valid Move Indicator (Lichess style: subtle dot for empty, ring for capture) */}
      {isValidDest && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          {piece ? (
            <div className="w-[84%] h-[84%] rounded-full border-[3.5px] border-amber-400/90 shadow-sm" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90 shadow-md ring-2 ring-black/20" />
          )}
        </div>
      )}
    </div>
  );
});

export const ChessBoard: React.FC<ChessBoardProps> = ({
  chess,
  orientation = 'w',
  onMove,
  interactive = true,
  arrows = [],
  lastMove = null,
  boardTheme = 'emerald',
  pieceSet = 'cburnett',
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  // Pointer drag state (touch & mouse)
  const [dragSquare, setDragSquare] = useState<Square | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragStartCoord = useRef<{ x: number; y: number } | null>(null);

  const displayFiles = useMemo(() => (orientation === 'w' ? FILES : [...FILES].reverse()), [orientation]);
  const displayRanks = useMemo(() => (orientation === 'w' ? RANKS : [...RANKS].reverse()), [orientation]);

  // Color schemes
  const themes = useMemo(
    () => ({
      emerald: {
        light: 'bg-[#eeeed2] text-[#769656]',
        dark: 'bg-[#769656] text-[#eeeed2]',
        selected: 'bg-[#baca44]/90 ring-2 ring-amber-300 ring-inset',
        lastMove: 'bg-[#cdd26a]/60',
      },
      wood: {
        light: 'bg-[#f0d9b5] text-[#b58863]',
        dark: 'bg-[#b58863] text-[#f0d9b5]',
        selected: 'bg-[#e5ad58]/90 ring-2 ring-amber-300 ring-inset',
        lastMove: 'bg-[#d8a356]/60',
      },
      tournament: {
        light: 'bg-[#dee3e6] text-[#8ca2ad]',
        dark: 'bg-[#8ca2ad] text-[#dee3e6]',
        selected: 'bg-[#68a6d6]/90 ring-2 ring-sky-300 ring-inset',
        lastMove: 'bg-[#7ba8cc]/60',
      },
      marble: {
        light: 'bg-[#e2e8f0] text-[#475569]',
        dark: 'bg-[#334155] text-[#cbd5e1]',
        selected: 'bg-[#818cf8]/90 ring-2 ring-indigo-300 ring-inset',
        lastMove: 'bg-[#6366f1]/50',
      },
    }),
    []
  );

  const currentTheme = themes[boardTheme];

  const executeMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      if (onMove) {
        onMove({ from, to, promotion });
      }
      setSelectedSquare(null);
      setValidMoves([]);
      setPromotionPending(null);
      setDragSquare(null);
      setDragPos(null);
    },
    [onMove]
  );

  // Convert pixel coordinates on board to Square
  const getSquareFromCoords = useCallback(
    (clientX: number, clientY: number): Square | null => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }

      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      const col = Math.floor((relX / rect.width) * 8);
      const row = Math.floor((relY / rect.height) * 8);

      if (col < 0 || col >= 8 || row < 0 || row >= 8) return null;

      const file = displayFiles[col];
      const rank = displayRanks[row];
      return `${file}${rank}` as Square;
    },
    [displayFiles, displayRanks]
  );

  // Click-to-move logic
  const handleSquareClick = useCallback(
    (square: Square) => {
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

        // Clicking another piece of same turn
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
    },
    [interactive, promotionPending, selectedSquare, chess, validMoves, executeMove]
  );

  // Pointer Down (Mouse, Touch, Stylus)
  const handlePointerDownPiece = useCallback(
    (e: React.PointerEvent, square: Square) => {
      if (!interactive) return;
      const piece = chess.get(square);
      if (!piece || piece.color !== chess.turn()) return;

      // Select square and compute valid moves immediately
      setSelectedSquare(square);
      const legal = chess.moves({ square, verbose: true }).map((m) => m.to as Square);
      setValidMoves(legal);

      // Start drag tracking
      setDragSquare(square);
      setDragPos({ x: e.clientX, y: e.clientY });
      dragStartCoord.current = { x: e.clientX, y: e.clientY };

      // Capture pointer on board container
      if (boardRef.current) {
        try {
          boardRef.current.setPointerCapture(e.pointerId);
        } catch {}
      }
    },
    [interactive, chess]
  );

  // Pointer Move (Tracking ghost piece)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragSquare) return;
      setDragPos({ x: e.clientX, y: e.clientY });
    },
    [dragSquare]
  );

  // Pointer Up (Dropping piece)
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragSquare) return;

      const targetSquare = getSquareFromCoords(e.clientX, e.clientY);
      const isDragMoved = dragStartCoord.current
        ? Math.hypot(e.clientX - dragStartCoord.current.x, e.clientY - dragStartCoord.current.y) > 12
        : false;

      if (targetSquare && targetSquare !== dragSquare && validMoves.includes(targetSquare)) {
        const piece = chess.get(dragSquare);
        const isPromotion = piece?.type === 'p' && (targetSquare.endsWith('8') || targetSquare.endsWith('1'));

        if (isPromotion) {
          setPromotionPending({ from: dragSquare, to: targetSquare });
        } else {
          executeMove(dragSquare, targetSquare);
        }
      } else if (!isDragMoved) {
        // Just a tap/click: leave selectedSquare active
      } else {
        // Dropped outside or invalid square
        setSelectedSquare(null);
        setValidMoves([]);
      }

      setDragSquare(null);
      setDragPos(null);
      dragStartCoord.current = null;
    },
    [dragSquare, getSquareFromCoords, validMoves, chess, executeMove]
  );

  const handlePointerCancel = useCallback(() => {
    setDragSquare(null);
    setDragPos(null);
    dragStartCoord.current = null;
  }, []);

  // Identify king in check
  const checkSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          return `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        }
      }
    }
    return null;
  }, [chess.fen()]);

  // Arrow coordinates
  const getSquareCenterPercent = useCallback(
    (square: string) => {
      const file = square.charAt(0);
      const rank = square.charAt(1);
      const fileIdx = displayFiles.indexOf(file);
      const rankIdx = displayRanks.indexOf(rank);
      return {
        x: (fileIdx + 0.5) * 12.5,
        y: (rankIdx + 0.5) * 12.5,
      };
    },
    [displayFiles, displayRanks]
  );

  // Pre-fetch board pieces for quick lookup
  const boardMatrix = useMemo(() => {
    const map: Record<Square, { type: PieceSymbol; color: 'w' | 'b' } | null> = {} as any;
    displayRanks.forEach((rank) => {
      displayFiles.forEach((file) => {
        const sq = `${file}${rank}` as Square;
        const p = chess.get(sq);
        map[sq] = p ? { type: p.type, color: p.color } : null;
      });
    });
    return map;
  }, [chess.fen(), displayRanks, displayFiles]);

  const draggedPieceInfo = dragSquare ? chess.get(dragSquare) : null;

  return (
    <div
      ref={boardRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{ touchAction: 'none' }}
      className="relative w-full max-w-[560px] aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800/80 select-none bg-slate-900"
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const isLight = (rIdx + fIdx) % 2 === 0;
            const piece = boardMatrix[square] || null;
            const isSelected = selectedSquare === square;
            const isValidDest = validMoves.includes(square);
            const isLastMove = Boolean(lastMove && (lastMove.from === square || lastMove.to === square));
            const isKingInCheck = checkSquare === square;
            const isDraggingThisPiece = dragSquare === square;

            return (
              <BoardSquare
                key={square}
                square={square}
                rank={rank}
                file={file}
                isLight={isLight}
                piece={piece}
                isSelected={isSelected}
                isValidDest={isValidDest}
                isLastMove={isLastMove}
                isKingInCheck={isKingInCheck}
                isDraggingThisPiece={isDraggingThisPiece}
                pieceSet={pieceSet}
                showRankLabel={fIdx === 0}
                showFileLabel={rIdx === 7}
                themeStyle={currentTheme}
                onSquareClick={handleSquareClick}
                onPointerDownPiece={handlePointerDownPiece}
              />
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
                strokeWidth={arr.width || 2.4}
                strokeLinecap="round"
                opacity={0.88}
                markerEnd={`url(#arrow-${arr.color})`}
              />
            );
          })}
        </svg>
      )}

      {/* Ghost Piece Following Finger/Cursor During Drag */}
      {dragSquare && dragPos && draggedPieceInfo && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 drop-shadow-2xl scale-110 opacity-95 transition-transform"
          style={{
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
          }}
        >
          <ChessPiece type={draggedPieceInfo.type} color={draggedPieceInfo.color} set={pieceSet} />
        </div>
      )}

      {/* Pawn Promotion Modal */}
      {promotionPending && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3">
            <span className="text-sm font-semibold text-slate-200">Escolha a Promoção</span>
            <div className="flex gap-2">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((pType) => (
                <button
                  key={pType}
                  onClick={() => executeMove(promotionPending.from, promotionPending.to, pType)}
                  className="w-14 h-14 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg flex items-center justify-center p-2 transition-all hover:scale-105"
                >
                  <ChessPiece type={pType} color={chess.turn()} set={pieceSet} />
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
