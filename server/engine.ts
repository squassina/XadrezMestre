// server/engine.ts — pool de processos Stockfish NATIVO (UCI via stdin/stdout)
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { Chess } from 'chess.js';

export interface EngineLine {
  multipv: number;
  depth: number;
  cp?: number;   // centipawns do ponto de vista de QUEM JOGA
  mate?: number; // mate em N (negativo = quem joga leva mate)
  pv: string[];  // lances UCI
}

export interface SearchRequest {
  fen: string;
  movetime?: number; // ms
  depth?: number;
  multiPV?: number;
  skill?: number;    // 0..20
  elo?: number;      // 1320..3190 (UCI_LimitStrength)
}

export interface SearchResponse {
  bestMove: string;       // UCI (e2e4)
  san: string | null;     // mesmo lance em SAN
  lines: EngineLine[];
  engine: string;
  ms: number;
}

const INFO_RE = /^info .*?depth (\d+)(?: .*?multipv (\d+))? .*?score (cp|mate) (-?\d+).*? pv (.+)$/;

class UciProcess {
  private proc!: ChildProcessWithoutNullStreams;
  private listeners = new Set<(line: string) => void>();
  name = 'Stockfish';
  ready!: Promise<void>;

  constructor(private path: string, private hashMb: number) {
    this.start();
  }

  private start() {
    this.proc = spawn(this.path, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    createInterface({ input: this.proc.stdout }).on('line', (l) => {
      this.listeners.forEach((f) => f(l));
    });
    this.proc.on('error', (e) => console.error('[engine] erro no processo:', e.message));
    this.ready = this.init();
  }

  send(cmd: string) {
    this.proc.stdin.write(cmd + '\n');
  }

  waitFor(pred: (l: string) => boolean, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(fn);
        reject(new Error('timeout do motor'));
      }, timeoutMs);
      const fn = (l: string) => {
        if (pred(l)) {
          clearTimeout(timer);
          this.listeners.delete(fn);
          resolve(l);
        }
      };
      this.listeners.add(fn);
    });
  }

  on(fn: (l: string) => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }

  private async init() {
    const idLines: string[] = [];
    const off = this.on((l) => l.startsWith('id name ') && idLines.push(l.slice(8)));
    this.send('uci');
    await this.waitFor((l) => l === 'uciok', 10_000);
    off();
    if (idLines[0]) this.name = idLines[0];
    this.send(`setoption name Hash value ${this.hashMb}`);
    this.send('setoption name Threads value 1');
    this.send('isready');
    await this.waitFor((l) => l === 'readyok', 10_000);
  }

  /** mata e recria o processo (usado após timeout/erro) */
  restart() {
    this.listeners.clear();
    this.proc.removeAllListeners();
    this.proc.kill('SIGKILL');
    this.start();
  }

  close() {
    this.proc.kill('SIGKILL');
  }
}

export class EnginePool {
  private workers: UciProcess[] = [];
  private idle: UciProcess[] = [];
  private queue: Array<() => void> = [];
  readonly maxQueue: number;

  constructor(opts: { path: string; size?: number; hashMb?: number; maxQueue?: number }) {
    const size = Math.max(1, opts.size ?? 1);
    this.maxQueue = opts.maxQueue ?? 50;
    for (let i = 0; i < size; i++) {
      const w = new UciProcess(opts.path, opts.hashMb ?? 64);
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  get size() { return this.workers.length; }
  get queued() { return this.queue.length; }

  async ready() { await Promise.all(this.workers.map((w) => w.ready)); }

  private acquire(): Promise<UciProcess> {
    const w = this.idle.pop();
    if (w) return Promise.resolve(w);
    if (this.queue.length >= this.maxQueue) return Promise.reject(new Error('fila cheia'));
    return new Promise((resolve) => this.queue.push(() => resolve(this.idle.pop()!)));
  }

  private release(w: UciProcess) {
    this.idle.push(w);
    const next = this.queue.shift();
    if (next) next();
  }

  async search(req: SearchRequest): Promise<SearchResponse> {
    // ---- validação e limites (nunca confie no cliente) ----
    let chess: Chess;
    try { chess = new Chess(req.fen); } catch { throw new Error('FEN inválida'); }
    if (chess.isGameOver()) throw new Error('partida já terminou');

    const movetime = req.depth ? undefined : clamp(req.movetime ?? 500, 50, 5000);
    const depth = req.depth ? clamp(req.depth, 1, 30) : undefined;
    const multiPV = clamp(req.multiPV ?? 1, 1, 5);
    const elo = req.elo ? clamp(req.elo, 1320, 3190) : undefined;
    const skill = clamp(req.skill ?? 20, 0, 20);

    const w = await this.acquire();
    const t0 = Date.now();
    try {
      await w.ready;
      const lines = new Map<number, EngineLine>();
      const off = w.on((l) => {
        const m = INFO_RE.exec(l);
        if (!m) return;
        const mp = m[2] ? Number(m[2]) : 1;
        const v = Number(m[4]);
        lines.set(mp, {
          multipv: mp,
          depth: Number(m[1]),
          cp: m[3] === 'cp' ? v : undefined,
          mate: m[3] === 'mate' ? v : undefined,
          pv: m[5].trim().split(' '),
        });
      });

      w.send('ucinewgame');
      w.send(`setoption name MultiPV value ${multiPV}`);
      if (elo) {
        w.send('setoption name UCI_LimitStrength value true');
        w.send(`setoption name UCI_Elo value ${elo}`);
      } else {
        w.send('setoption name UCI_LimitStrength value false');
        w.send(`setoption name Skill Level value ${skill}`);
      }
      w.send('isready');
      await w.waitFor((l) => l === 'readyok', 5_000);
      w.send(`position fen ${req.fen}`);
      w.send(depth ? `go depth ${depth}` : `go movetime ${movetime}`);

      const best = await w.waitFor((l) => l.startsWith('bestmove'), (movetime ?? 15_000) + 5_000);
      off();

      const uci = best.split(' ')[1];
      let san: string | null = null;
      try {
        const mv = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
        san = mv.san;
      } catch { /* lance ilegal vindo do motor: não deveria ocorrer */ }

      return {
        bestMove: uci,
        san,
        lines: [...lines.values()].sort((a, b) => a.multipv - b.multipv),
        engine: w.name,
        ms: Date.now() - t0,
      };
    } catch (e) {
      w.restart(); // processo em estado desconhecido
      throw e;
    } finally {
      this.release(w);
    }
  }

  /**
   * Analisa UM lance: compara o melhor lance do motor com o lance jogado,
   * na MESMA profundidade, em chance de vitória (0..100).
   */
  async analyzeMove(fen: string, move: string, opts: { depth?: number; movetime?: number } = {}): Promise<MoveAnalysis> {
    const chess = new Chess(fen);
    let played;
    try {
      // aceita UCI (e2e4) ou SAN (e4)
      played = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)
        ? chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
        : chess.move(move);
    } catch { throw new Error('lance ilegal'); }
    const playedUci = played.from + played.to + (played.promotion ?? '');
    const after = chess.fen();
    const mover = new Chess(fen).turn();

    const before = await this.search({ fen, ...opts, multiPV: 1 });
    const bestLine = before.lines[0];
    const cpBefore = lineToCp(bestLine); // do ponto de vista de quem joga

    let cpAfter: number;
    if (playedUci === before.bestMove) {
      cpAfter = cpBefore; // jogou o melhor lance: não precisa buscar de novo
    } else if (chess.isCheckmate()) {
      cpAfter = MATE_CP;
    } else if (chess.isGameOver()) {
      cpAfter = 0; // empate/afogamento
    } else {
      const a = await this.search({ fen: after, ...opts, multiPV: 1 });
      cpAfter = -lineToCp(a.lines[0]); // inverte: a busca vem do ponto de vista do adversário
    }

    const lossPct = Math.max(0, winPct(cpBefore) - winPct(cpAfter));
    const quality =
      playedUci === before.bestMove ? 'best'
      : lossPct >= 15 ? 'blunder'
      : lossPct >= 10 ? 'mistake'
      : lossPct >= 5 ? 'inaccuracy'
      : lossPct >= 2 ? 'good'
      : 'brilliant';

    // placares das BRANCAS (a barra de avaliação usa esse lado)
    const sign = mover === 'w' ? 1 : -1;
    return {
      bestMove: before.bestMove,
      bestSan: before.san,
      playedSan: played.san,
      cpBefore: sign * cpBefore,
      cpAfter: sign * cpAfter,
      lossPct: Math.round(lossPct * 10) / 10,
      quality,
      pv: bestLine?.pv ?? [],
      engine: before.engine,
    };
  }

  close() { this.workers.forEach((w) => w.close()); }
}

export interface MoveAnalysis {
  bestMove: string;
  bestSan: string | null;
  playedSan: string;
  cpBefore: number;   // centipawns, ponto de vista das brancas
  cpAfter: number;
  lossPct: number;    // pontos percentuais de chance de vitória perdidos
  quality: 'best' | 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  pv: string[];
  engine: string;
}

const MATE_CP = 10_000;

/** cp de quem joga; mate vira valor grande (mais rápido = maior) */
export function lineToCp(l?: EngineLine): number {
  if (!l) return 0;
  if (l.mate !== undefined) return Math.sign(l.mate) * (MATE_CP - Math.abs(l.mate));
  return l.cp ?? 0;
}

/** Curva de chance de vitória (Lichess). cp -> 0..100 */
export const winPct = (cp: number) => 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);

function clamp(n: number, lo: number, hi: number) {
  n = Number(n);
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}
