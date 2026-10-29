import { Chess } from 'chess.js';
import { getBotMove } from './engine';
import { BotLevel } from '../types/chess';

// Força o TypeScript a entender 'self' como o escopo do Worker
const workerSelf = self as unknown as DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<{ fen: string; botLevel: BotLevel }>) => {
  const { fen, botLevel } = event.data;

  // Reconstrói o estado do jogo a partir da FEN
  const chess = new Chess(fen);

  // Executa a busca pesada no Worker
  const move = getBotMove(chess, botLevel);

  // Envia o resultado de volta para a aplicação
  self.postMessage(move);
};
