import React from 'react';
import { PieceSymbol, Color } from 'chess.js';

export type PieceSet = 'staunty' | 'modern-minimalist' | 'merida' | 'alpha' | 'cburnett';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  set?: PieceSet;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = React.memo(({
  type,
  color,
  set = 'staunty',
  className = 'w-full h-full',
}) => {
  const isWhite = color === 'w';

  // -------------------------------------------------------------
  // 1. STAUNTY: Realista com Gradientes e Polimento estilo Madeira / Marfim
  // -------------------------------------------------------------
  if (set === 'staunty') {
    const whiteGradId = `staunty-white-${type}`;
    const blackGradId = `staunty-black-${type}`;
    const gradUrl = isWhite ? `url(#${whiteGradId})` : `url(#${blackGradId})`;
    const strokeColor = isWhite ? '#785434' : '#140c09';
    const detailColor = isWhite ? '#b48a60' : '#4a3525';
    const highlightColor = isWhite ? '#ffffff' : '#5c4033';

    return (
      <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={whiteGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffaf0" />
            <stop offset="45%" stopColor="#f7ecdc" />
            <stop offset="100%" stopColor="#dfc5a4" />
          </linearGradient>
          <linearGradient id={blackGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#443228" />
            <stop offset="50%" stopColor="#2c1f18" />
            <stop offset="100%" stopColor="#150e0a" />
          </linearGradient>
        </defs>

        {type === 'p' && (
          <g fill={gradUrl} stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,9 C 20,9 18,11 18,13.5 C 18,14.8 18.6,16 19.5,16.8 C 17,18.5 16,21 16,23.5 C 16,25.5 17,27 18.5,28 C 15,30 11,34 11,40 L 34,40 C 34,34 30,30 26.5,28 C 28,27 29,25.5 29,23.5 C 29,21 28,18.5 25.5,16.8 C 26.4,16 27,14.8 27,13.5 C 27,11 25,9 22.5,9 Z" />
            <circle cx="22.5" cy="13.5" r="3.2" fill={gradUrl} />
            <path d="M 17,37.5 L 28,37.5 M 19,30 L 26,30" stroke={detailColor} strokeWidth="1" fill="none" />
            <ellipse cx="21" cy="12" rx="1.5" ry="1" fill={highlightColor} opacity={0.6} stroke="none" />
          </g>
        )}

        {type === 'n' && (
          <g fill={gradUrl} stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,8 C 15,8 10,13 10,21 C 10,26 8,28 7,30 C 9.5,31.5 13,31 15,29 C 14,32 17,35 15,39 L 34,39 C 34,31 35,21 27,14 C 27,11 25,8 22,8 Z" />
            <path d="M 24,14 C 23,17 19,20 16,21 C 15,22 14,24 13,25" stroke={detailColor} strokeWidth="1.2" fill="none" />
            <circle cx="14" cy="18" r="1.5" fill={isWhite ? '#5c3a21' : '#f5e6d3'} stroke="none" />
            <path d="M 12,39 L 33,39" stroke={detailColor} strokeWidth="1.5" />
          </g>
        )}

        {type === 'b' && (
          <g fill={gradUrl} stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="7" r="1.8" />
            <path d="M 15,39 L 30,39 C 30,34 29,29 28,26 C 29.5,23.5 30.5,19 28,14 C 25.5,10 22.5,9 22.5,9 C 22.5,9 19.5,10 17,14 C 14.5,19 15.5,23.5 17,26 C 16,29 15,34 15,39 Z" />
            <path d="M 20,15 L 26,21 M 26,15 L 20,21" stroke={detailColor} strokeWidth="1.2" />
            <path d="M 17,36 L 28,36" stroke={detailColor} strokeWidth="1.2" />
          </g>
        )}

        {type === 'r' && (
          <g fill={gradUrl} stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 12,39 L 33,39 L 33,35 L 12,35 Z" />
            <path d="M 14,35 L 15,17 L 30,17 L 31,35 Z" />
            <path d="M 12,17 L 12,9 L 16,9 L 16,13 L 20,13 L 20,9 L 25,9 L 25,13 L 29,13 L 29,9 L 33,9 L 33,17 Z" />
            <path d="M 15,23 L 30,23 M 15,29 L 30,29" stroke={detailColor} strokeWidth="1.2" />
          </g>
        )}

        {type === 'q' && (
          <g fill={gradUrl} stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="13" r="1.8" />
            <circle cx="15" cy="10" r="1.8" />
            <circle cx="22.5" cy="8" r="2.2" />
            <circle cx="30" cy="10" r="1.8" />
            <circle cx="37" cy="13" r="1.8" />
            <path d="M 9,39 L 36,39 C 36,33 34,30 33,26 C 35,22 37,16 37,16 L 30,24 L 22.5,12 L 15,24 L 8,16 C 8,16 10,22 12,26 C 11,30 9,33 9,39 Z" />
            <path d="M 13,35 L 32,35 M 15,31 L 30,31" stroke={detailColor} strokeWidth="1.2" />
          </g>
        )}

        {type === 'k' && (
          <g fill={gradUrl} stroke={strokeColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,4.5 L 22.5,11 M 19,7.5 L 26,7.5" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
            <path d="M 11,39 L 34,39 C 34,32 32,28 31,24 C 33,19 32,13 22.5,13 C 13,13 12,19 14,24 C 13,28 11,32 11,39 Z" />
            <circle cx="22.5" cy="18" r="3" fill={gradUrl} stroke={detailColor} strokeWidth="1" />
            <path d="M 14,35 L 31,35 M 15,31 L 30,31" stroke={detailColor} strokeWidth="1.2" />
          </g>
        )}
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 2. MODERN-MINIMALIST: Vetor Limpo, Leve e Elegante
  // -------------------------------------------------------------
  if (set === 'modern-minimalist') {
    const fill = isWhite ? '#ffffff' : '#1e293b';
    const stroke = isWhite ? '#334155' : '#0f172a';
    const innerStroke = isWhite ? '#94a3b8' : '#475569';

    return (
      <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
        {type === 'p' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="13.5" r="4.3" />
            <line x1="18.5" y1="19" x2="26.5" y2="19" strokeWidth="1.2" />
            <path d="M 19,20 C 17,24 15,28 13.5,35 L 31.5,35 C 30,28 28,24 26,20 Z" />
            <path d="M 12,35.5 C 12,37.5 14,38.5 22.5,38.5 C 31,38.5 33,37.5 33,35.5 Z" />
            <line x1="16.5" y1="33" x2="28.5" y2="33" stroke={innerStroke} strokeWidth="0.9" />
          </g>
        )}

        {type === 'n' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 21.5,9 C 18,9 13,11 11.5,17 C 10.5,21 8,24 7,27 C 8.5,27.8 11.5,27.5 13,26 C 11.5,29 13.5,34 14,35 L 31,35 C 31.5,30 33,21 28,14 C 27.5,11 25,9 21.5,9 Z" />
            <path d="M 20.5,9 L 23.5,5.5 L 24.5,9.5" fill={fill} />
            <circle cx="15" cy="16.5" r="1.3" fill={stroke} stroke="none" />
            <path d="M 24,13 C 25,18 23.5,24 19,27" fill="none" stroke={innerStroke} strokeWidth="1" />
            <path d="M 12.5,35.5 C 12.5,37.5 14.5,38.5 22.5,38.5 C 30.5,38.5 32.5,37.5 32.5,35.5 Z" />
          </g>
        )}

        {type === 'b' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="8" r="1.8" />
            <path d="M 22.5,10 C 17,13.5 16,21 17.5,26 C 16,29 14.5,32 14,35 L 31,35 C 30.5,32 29,29 27.5,26 C 29,21 28,13.5 22.5,10 Z" />
            <line x1="21" y1="15" x2="25.5" y2="21" stroke={stroke} strokeWidth="1.4" />
            <path d="M 12.5,35.5 C 12.5,37.5 14.5,38.5 22.5,38.5 C 30.5,38.5 32.5,37.5 32.5,35.5 Z" />
            <line x1="17" y1="33" x2="28" y2="33" stroke={innerStroke} strokeWidth="0.9" />
          </g>
        )}

        {type === 'r' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 13.5,17 L 13.5,10 L 17,10 L 17,13 L 21,13 L 21,10 L 24,10 L 24,13 L 28,13 L 28,10 L 31.5,10 L 31.5,17 Z" />
            <path d="M 15.5,17 L 14.5,35 L 30.5,35 L 29.5,17 Z" />
            <path d="M 12,35.5 C 12,37.5 14,38.5 22.5,38.5 C 31,38.5 33,37.5 33,35.5 Z" />
            <line x1="16.5" y1="33" x2="28.5" y2="33" stroke={innerStroke} strokeWidth="0.9" />
          </g>
        )}

        {type === 'q' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="14" r="1.6" />
            <circle cx="22.5" cy="9.5" r="2" />
            <circle cx="35" cy="14" r="1.6" />
            <path d="M 10,15.5 L 14,24 L 22.5,11.5 L 31,24 L 35,15.5 C 34.5,22 31.5,27 29.5,30 C 27.5,32 29,34 30.5,35 L 14.5,35 C 16,34 17.5,32 15.5,30 C 13.5,27 10.5,22 10,15.5 Z" />
            <ellipse cx="22.5" cy="28" rx="4" ry="1.5" fill="none" stroke={innerStroke} strokeWidth="0.9" />
            <path d="M 12,35.5 C 12,37.5 14,38.5 22.5,38.5 C 31,38.5 33,37.5 33,35.5 Z" />
          </g>
        )}

        {type === 'k' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,4.5 L 22.5,10.5 M 19.5,7.5 L 25.5,7.5" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 22.5,11 C 15,11 13.5,17 16,22 C 14,26 13,31 13,35 L 32,35 C 32,31 31,26 29,22 C 31.5,17 30,11 22.5,11 Z" />
            <path d="M 17,21 C 20,23 25,23 28,21" fill="none" stroke={innerStroke} strokeWidth="1" />
            <path d="M 11.5,35.5 C 11.5,37.5 13.5,38.5 22.5,38.5 C 31.5,38.5 33.5,37.5 33.5,35.5 Z" />
            <line x1="16" y1="33" x2="29" y2="33" stroke={innerStroke} strokeWidth="0.9" />
          </g>
        )}
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 3. MERIDA: Estilo Clássico de Gravura Europeia
  // -------------------------------------------------------------
  if (set === 'merida') {
    const fill = isWhite ? '#f8fafc' : '#1e293b';
    const stroke = isWhite ? '#0f172a' : '#f1f5f9';
    const innerAccent = isWhite ? '#94a3b8' : '#475569';

    return (
      <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
        {type === 'p' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,9 C 20.5,9 18.5,10.5 18.5,13 C 18.5,14.5 19.5,16 20.5,16.5 C 17.5,18 16.5,21.5 16.5,24.5 C 16.5,26.5 17.5,28 19,29 C 15,31 11,35.5 11,39.5 L 34,39.5 C 34,35.5 30,31 26,29 C 27.5,28 28.5,26.5 28.5,24.5 C 28.5,21.5 27.5,18 24.5,16.5 C 25.5,16 26.5,14.5 26.5,13 C 26.5,10.5 24.5,9 22.5,9 Z" />
            <path d="M 16,36 L 29,36" stroke={innerAccent} strokeWidth="1" fill="none" />
          </g>
        )}

        {type === 'n' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,8 C 14,8 10,13 10,21 C 10,24 8,26 6.5,28 C 9,30 13,29 14,27 C 13.5,30 16,34 14,39 L 34,39 C 34,29 35,18 27,12 C 27,10 25,8 22,8 Z" />
            <path d="M 23,15 C 22,18 17,21 14,22" stroke={innerAccent} strokeWidth="1.2" fill="none" />
            <circle cx="14" cy="17" r="1.5" fill={isWhite ? '#0f172a' : '#f8fafc'} stroke="none" />
            <path d="M 20,29 C 24,28 27,24 28,19" stroke={innerAccent} strokeWidth="1" fill="none" />
          </g>
        )}

        {type === 'b' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="7.5" r="2" />
            <path d="M 14.5,39 L 30.5,39 C 30.5,33 29,28 27.5,25.5 C 30,22 30.5,17 27.5,12.5 C 24.5,8 22.5,8 22.5,8 C 22.5,8 20.5,8 17.5,12.5 C 14.5,17 15,22 17.5,25.5 C 16,28 14.5,33 14.5,39 Z" />
            <path d="M 22.5,13 L 22.5,21 M 19,17 L 26,17" stroke={innerAccent} strokeWidth="1.3" />
          </g>
        )}

        {type === 'r' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 11,39 L 34,39 L 34,35 L 11,35 Z" />
            <path d="M 13.5,35 L 14.5,16 L 30.5,16 L 31.5,35 Z" />
            <path d="M 11,16 L 11,9 L 15.5,9 L 15.5,12.5 L 20,12.5 L 20,9 L 25,9 L 25,12.5 L 29.5,12.5 L 29.5,9 L 34,9 L 34,16 Z" />
          </g>
        )}

        {type === 'q' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7" cy="14" r="1.8" />
            <circle cx="14" cy="10" r="1.8" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="10" r="1.8" />
            <circle cx="38" cy="14" r="1.8" />
            <path d="M 9,39 L 36,39 C 36,32 33,28 32,25 C 34.5,20 38,15 38,15 L 30,23 L 22.5,11 L 15,23 L 7,15 C 7,15 10.5,20 13,25 C 12,28 9,32 9,39 Z" />
            <circle cx="22.5" cy="27" r="2.5" fill="none" stroke={innerAccent} strokeWidth="1.2" />
          </g>
        )}

        {type === 'k' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,4 L 22.5,11 M 19,7 L 26,7" stroke={stroke} strokeWidth="1.8" />
            <path d="M 11.5,39 L 33.5,39 C 33.5,32 31,28 30,24 C 33,19 32,13 22.5,13 C 13,13 12,19 15,24 C 14,28 11.5,32 11.5,39 Z" />
            <path d="M 17,21 C 19.5,23 25.5,23 28,21" stroke={innerAccent} strokeWidth="1.2" fill="none" />
          </g>
        )}
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 4. ALPHA: Contemporâneo Geométrico com Detalhes em Azul
  // -------------------------------------------------------------
  if (set === 'alpha') {
    const fill = isWhite ? '#ffffff' : '#0f172a';
    const stroke = isWhite ? '#0284c7' : '#38bdf8';
    const ringColor = isWhite ? '#38bdf8' : '#0284c7';

    return (
      <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
        {type === 'p' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="13" r="5" />
            <path d="M 18,19 C 14,25 12,32 12,38 L 33,38 C 33,32 31,25 27,19 Z" />
            <line x1="16" y1="34" x2="29" y2="34" stroke={ringColor} strokeWidth="1.4" />
          </g>
        )}

        {type === 'n' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 21,9 C 14,9 11,14 11,20 C 11,24 8,27 7,29 C 10,30 14,29 15,27 C 14,31 17,35 15,38 L 33,38 C 33,28 34,18 26,12 C 26,10 24,9 21,9 Z" />
            <circle cx="15" cy="16" r="1.8" fill={ringColor} stroke="none" />
            <line x1="16" y1="34" x2="30" y2="34" stroke={ringColor} strokeWidth="1.4" />
          </g>
        )}

        {type === 'b' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="8" r="2.2" fill={ringColor} />
            <path d="M 22.5,11 C 15,14 15,24 18,29 C 15,32 14,35 14,38 L 31,38 C 31,35 30,32 27,29 C 30,24 30,14 22.5,11 Z" />
            <line x1="22.5" y1="16" x2="22.5" y2="24" stroke={ringColor} strokeWidth="1.6" />
          </g>
        )}

        {type === 'r' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 13,38 L 32,38 L 31,18 L 14,18 Z" />
            <path d="M 12,18 L 12,10 L 16,10 L 16,13 L 20.5,13 L 20.5,10 L 24.5,10 L 24.5,13 L 29,13 L 29,10 L 33,10 L 33,18 Z" />
            <line x1="16" y1="33" x2="29" y2="33" stroke={ringColor} strokeWidth="1.4" />
          </g>
        )}

        {type === 'q' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="13" r="2" fill={ringColor} />
            <circle cx="22.5" cy="8" r="2.4" fill={ringColor} />
            <circle cx="36" cy="13" r="2" fill={ringColor} />
            <path d="M 11,38 L 34,38 C 34,32 32,27 30,23 L 36,15 L 28,21 L 22.5,12 L 17,21 L 9,15 L 15,23 C 13,27 11,32 11,38 Z" />
            <circle cx="22.5" cy="27" r="3" fill="none" stroke={ringColor} strokeWidth="1.5" />
          </g>
        )}

        {type === 'k' && (
          <g fill={fill} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,4 L 22.5,10 M 19.5,7 L 25.5,7" stroke={ringColor} strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 12,38 L 33,38 C 33,31 31,26 29,22 C 32,17 30,12 22.5,12 C 15,12 13,17 16,22 C 14,26 12,31 12,38 Z" />
            <line x1="16" y1="33" x2="29" y2="33" stroke={ringColor} strokeWidth="1.4" />
          </g>
        )}
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 5. CBURNETT: Padrão Lichess / Torneios Oficiais (Fallback)
  // -------------------------------------------------------------
  const fill = isWhite ? '#FFFFFF' : '#1e293b';
  const stroke = isWhite ? '#1e293b' : '#f8fafc';
  const accent = isWhite ? '#cbd5e1' : '#0f172a';

  switch (type) {
    case 'p':
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

    case 'n':
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,26 8,16 22,10 z" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.95,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.99,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.05,5.14 20,7 C 22,5 24,8 24,8 z" />
            <circle cx="15.5" cy="15.5" r="1.5" fill={isWhite ? '#0f172a' : '#f8fafc'} stroke="none" />
          </g>
        </svg>
      );

    case 'b':
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

    case 'r':
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

    case 'q':
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

    case 'k':
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
});
