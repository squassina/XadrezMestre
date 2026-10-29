import { Router, Request, Response } from 'express';
import { Chess } from 'chess.js';
import { enginePool } from './engine';

export const engineRouter = Router();

// Simple in-memory rate limiter per IP (max 30 requests per 10 seconds)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 10000;
const MAX_REQUESTS_PER_WINDOW = 35;

function checkRateLimit(req: Request, res: Response, next: () => void) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, record);
  } else {
    record.count++;
  }

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: 'Muitas requisições ao motor. Aguarde alguns segundos.' });
  }

  next();
}

engineRouter.use(checkRateLimit);

// GET /api/engine/health
engineRouter.get('/health', (_req, res) => {
  const status = enginePool.getStatus();
  res.json(status);
});

// POST /api/engine/search
engineRouter.post('/search', async (req, res) => {
  try {
    const { fen, movetime, depth, multiPV, skill, elo } = req.body;

    if (!fen || typeof fen !== 'string') {
      return res.status(400).json({ error: 'Parâmetro fen é obrigatório e deve ser uma string.' });
    }

    try {
      const testChess = new Chess(fen);
      if (testChess.isGameOver()) {
        return res.status(400).json({ error: 'A partida indicada pela FEN já está encerrada.' });
      }
    } catch {
      return res.status(400).json({ error: 'FEN inválida fornecida.' });
    }

    const result = await enginePool.search({
      fen,
      movetime: movetime ? Number(movetime) : undefined,
      depth: depth ? Number(depth) : undefined,
      multiPV: multiPV ? Number(multiPV) : 1,
      skill: skill !== undefined ? Number(skill) : undefined,
      elo: elo ? Number(elo) : undefined,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[Engine API Search Error]:', err);
    return res.status(err.message?.includes('overloaded') ? 503 : 500).json({
      error: err.message || 'Erro interno no motor Stockfish',
    });
  }
});

// POST /api/engine/analyze-move
engineRouter.post('/analyze-move', async (req, res) => {
  try {
    const { fen, move, depth } = req.body;

    if (!fen || !move) {
      return res.status(400).json({ error: 'Parâmetros fen e move são obrigatórios.' });
    }

    try {
      new Chess(fen);
    } catch {
      return res.status(400).json({ error: 'FEN inválida fornecida.' });
    }

    const result = await enginePool.analyzeMove(fen, move, depth ? Number(depth) : 10);
    return res.json(result);
  } catch (err: any) {
    console.error('[Engine API Analyze Error]:', err);
    return res.status(500).json({
      error: err.message || 'Erro ao analisar lance com motor Stockfish',
    });
  }
});
