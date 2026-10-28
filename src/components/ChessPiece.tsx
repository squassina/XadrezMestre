import React from 'react';
import { PieceSymbol, Color } from 'chess.js';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#FFFFFF' : '#1e293b';
  const stroke = isWhite ? '#1e293b' : '#f8fafc';
  const accent = isWhite ? '#cbd5e1' : '#0f172a';

  switch (type) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 L 34,39.5 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {isWhite && (
            <path
              d="m 22.5,10 c -1.65,0 -3,1.35 -3,3 0,0.7 0.24,1.34 0.65,1.85 C 18.5,15.8 17.5,17.2 17.5,19"
              fill="none"
              stroke={accent}
              strokeWidth="1"
            />
          )}
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,26 8,16 22,10 z" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.95,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.99,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.05,5.14 20,7 C 22,5 24,8 24,8 z" />
            <circle cx="15.5" cy="15.5" r="1.5" fill={isWhite ? '#0f172a' : '#f8fafc'} stroke="none" />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <circle cx="22.5" cy="8" r="2" />
            <path d="m 17.5,18 10,0 M 22.5,13.5 l 0,9" stroke={isWhite ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 12,14 L 33,14 L 31,32 L 14,32 z" />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 13.5,36.5 15,36.5 17.5,36.5 C 20,36.5 22.5,36.5 25,36.5 C 27.5,36.5 29,36.5 31.5,36 C 31.5,36 32,34.5 30.5,33.5 C 30,31 30,31.5 31,30 C 32,28 33.5,28 33.5,26 z" />
            <path d="M 11.5,30 C 15,29 30,29 33.5,30" fill="none" />
            <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" fill="none" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
          </g>
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.5 L 22.5,6 M 20,8 L 25,8" stroke={isWhite ? '#0f172a' : '#f8fafc'} strokeWidth="1.5" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" />
            <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,35 34,26.5 34,26.5 C 34,26.5 32,24.5 30,26.5 C 28,28.5 28,29.5 26,27.5 C 24,25.5 21,25.5 19,27.5 C 17,29.5 17,28.5 15,26.5 C 13,24.5 11,26.5 11,26.5 C 11,26.5 8.5,35 11.5,37 z" />
            <path d="M 11.5,30 C 17,27 28,27 33.5,30" fill="none" />
            <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" fill="none" />
            <path d="M 11.5,37 C 17,34 28,34 33.5,37" fill="none" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
