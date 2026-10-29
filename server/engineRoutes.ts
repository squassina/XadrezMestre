// server/engineRoutes.ts — rotas HTTP do motor
import type { Express, Request, Response, NextFunction } from 'express';
import { EnginePool } from './engine';

// limitador simples por IP (janela de 10 s) — troque por express-rate-limit se preferir
function rateLimit(max: number, windowMs = 10_000) {
  const hits = new Map<string, { n: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'x';
    const now = Date.now();
    const h = hits.get(ip);
    if (!h || now > h.reset) { hits.set(ip, { n: 1, reset: now + windowMs }); return next(); }
    if (++h.n > max) return res.status(429).json({ error: 'muitas requisições' });
    next();
  };
}

export function mountEngineRoutes(app: Express) {
  const path = process.env.STOCKFISH_PATH || '/usr/local/bin/stockfish';
  const pool = new EnginePool({
    path,
    size: Number(process.env.ENGINE_POOL || 1),
    hashMb: Number(process.env.ENGINE_HASH_MB || 64),
  });
  pool.ready().then(
    () => console.log(`[engine] pronto (${pool.size} processo(s)) -> ${path}`),
    (e) => console.error('[engine] falha ao iniciar:', e.message),
  );

  app.get('/api/engine/health', (_req, res) => {
    res.json({ ok: true, pool: pool.size, queued: pool.queued });
  });

  app.post('/api/engine/search', rateLimit(Number(process.env.ENGINE_RATE || 20)), async (req, res) => {
    try {
      const { fen, movetime, depth, multiPV, skill, elo } = req.body ?? {};
      if (typeof fen !== 'string' || fen.length > 120) return res.status(400).json({ error: 'fen obrigatória' });
      const out = await pool.search({ fen, movetime, depth, multiPV, skill, elo });
      res.json(out);
    } catch (e: any) {
      const msg = String(e?.message || e);
      const code = msg === 'fila cheia' ? 503 : msg.includes('FEN') || msg.includes('partida') ? 400 : 500;
      res.status(code).json({ error: msg });
    }
  });

  app.post('/api/engine/analyze-move', rateLimit(Number(process.env.ENGINE_RATE || 20)), async (req, res) => {
    try {
      const { fen, move, depth, movetime } = req.body ?? {};
      if (typeof fen !== 'string' || fen.length > 120 || typeof move !== 'string' || move.length > 10) {
        return res.status(400).json({ error: 'fen e move são obrigatórios' });
      }
      const d = depth ? Math.min(20, Math.max(1, Number(depth))) : undefined;
      res.json(await pool.analyzeMove(fen, move, { depth: d, movetime }));
    } catch (e: any) {
      const msg = String(e?.message || e);
      const code = msg === 'fila cheia' ? 503 : msg.includes('ilegal') || msg.includes('FEN') ? 400 : 500;
      res.status(code).json({ error: msg });
    }
  });

  return pool;
}
