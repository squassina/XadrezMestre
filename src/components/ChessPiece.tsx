import React from 'react';
import { PieceSymbol, Color } from 'chess.js';

export type PieceSet = 'staunty' | 'modern' | 'merida' | 'alpha';

// Caminho base considerando a subpasta base do Vite (ex: /XadrezMestre/pieces)
const DEFAULT_BASE_PATH = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/pieces`;

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  set?: PieceSet;
  className?: string;
  customBasePath?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = React.memo(({
  type,
  color,
  set = 'staunty',
  className = 'w-full h-full',
  customBasePath = DEFAULT_BASE_PATH,
}) => {
  const isWhite = color === 'w';
  const colorPrefix = isWhite ? 'w' : 'b';
  const pieceCode = type.toUpperCase();
  const cleanBasePath = customBasePath.replace(/\/$/, '');

  // Caminho gerado: /XadrezMestre/pieces/[set]/[colorPrefix][pieceCode].svg
  // Exemplo: /XadrezMestre/pieces/staunty/wR.svg
  const src = `${cleanBasePath}/${set}/${colorPrefix}${pieceCode}.svg`;

  return (
    <img
      src={src}
      alt={`${isWhite ? 'White' : 'Black'} ${type}`}
      className={`select-none pointer-events-none object-contain ${className}`}
      draggable={false}
    />
  );
});
