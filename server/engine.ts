import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { Chess } from 'chess.js';
import fs from 'fs';

export interface SearchOptions {
  fen: string;
  movetime?: number;
  depth?: number;
  multiPV?: number;
  skill?: number;
  elo?: number;
}

export interface SearchLine {
  multipv: number;
  depth: number;
  cp?: number;
  mate?: number;
  pv: string[];
}

export interface SearchResult {
  bestMove: string;
  san?: string;
  lines: SearchLine[];
  engine: string;
  ms: number;
}

export interface AnalyzeResult {
  bestMove: string;
  bestSan?: string;
  playedSan: string;
  cpBefore: number;
  cpAfter: number;
  lossPct: number;
  quality: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  pv: string[];
  engine: string;
}

interface QueuedTask {
  commands: string[];
  onLine: (line: string) => boolean; // return true when task is finished
  resolve: (res: any) => void;
  reject: (err: any) => void;
  timeoutMs: number;
}

function findStockfishPath(): string {
  if (process.env.STOCKFISH_PATH && fs.existsSync(process.env.STOCKFISH_PATH)) {
    return process.env.STOCKFISH_PATH;
  }
  const candidates = [
    '/usr/games/stockfish',
    '/usr/bin/stockfish',
    '/usr/local/bin/stockfish',
    'stockfish'
  ];
  for (const p of candidates) {
    if (p.startsWith('/') && fs.existsSync(p)) {
      return p;
    }
  }
  return 'stockfish';
}

export class EnginePool {
  private sfPath: string;
  private process: ChildProcessWithoutNullStreams | null = null;
  private queue: QueuedTask[] = [];
  private currentTask: QueuedTask | null = null;
  private currentTimer: NodeJS.Timeout | null = null;
  private isReady = false;
  private isDestroyed = false;
  private engineName = 'Stockfish';

  constructor(sfPath?: string) {
    this.sfPath = sfPath || findStockfishPath();
    this.initProcess();
  }

  private initProcess() {
    if (this.isDestroyed) return;
    try {
      this.process = spawn(this.sfPath);
      this.process.stdout.setEncoding('utf-8');

      let buffer = '';
      this.process.stdout.on('data', (data: string) => {
        buffer += data;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          this.handleLine(line.trim());
        }
      });

      this.process.stderr.on('data', (data: Buffer) => {
        console.error('[Stockfish stderr]:', data.toString());
      });

      this.process.on('close', (code: number) => {
        console.warn(`[Stockfish] process exited with code ${code}`);
        this.process = null;
        this.isReady = false;
        if (!this.isDestroyed) {
          // Restart on unexpected crash
          setTimeout(() => this.initProcess(), 500);
        }
      });

      // Send initial UCI setup
      this.sendCommand('uci');
      this.sendCommand('isready');
      this.isReady = true;
    } catch (err) {
      console.error('[Stockfish] Failed to spawn process:', err);
    }
  }

  private sendCommand(cmd: string) {
    if (this.process && this.process.stdin.writable) {
      this.process.stdin.write(`${cmd}\n`);
    }
  }

  private handleLine(line: string) {
    if (!line) return;
    if (line.startsWith('id name ')) {
      this.engineName = line.replace('id name ', '').trim();
    }

    if (this.currentTask) {
      try {
        const isDone = this.currentTask.onLine(line);
        if (isDone) {
          this.finishCurrentTask();
        }
      } catch (err) {
        if (this.currentTask) {
          this.currentTask.reject(err);
          this.finishCurrentTask();
        }
      }
    }
  }

  private finishCurrentTask(success: boolean = true) {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
    }
    const task = this.currentTask;
    this.currentTask = null;
    if (success && task) {
      task.resolve(undefined);
    }
    this.processNext();
  }

  private processNext() {
    if (this.currentTask || this.queue.length === 0 || !this.process) return;

    this.currentTask = this.queue.shift()!;
    this.currentTimer = setTimeout(() => {
      if (this.currentTask) {
        const task = this.currentTask;
        this.sendCommand('stop');
        this.finishCurrentTask(false);
        task.reject(new Error('Stockfish execution timeout'));
      }
    }, this.currentTask.timeoutMs);

    for (const cmd of this.currentTask.commands) {
      this.sendCommand(cmd);
    }
  }

  private enqueueTask<T>(commands: string[], onLine: (line: string) => boolean, timeoutMs: number = 8000): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.queue.length >= 50) {
        return reject(new Error('Engine queue overloaded (503)'));
      }
      this.queue.push({
        commands,
        onLine,
        resolve,
        reject,
        timeoutMs,
      });
      this.processNext();
    });
  }

  /**
   * Search position for best move and evaluations
   */
  async search(opts: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now();
    const chess = new Chess(opts.fen);
    const turn = chess.turn();

    const commands: string[] = [
      'ucinewgame',
      'isready',
    ];

    if (opts.skill !== undefined) {
      commands.push(`setoption name Skill Level value ${Math.max(0, Math.min(20, opts.skill))}`);
    }
    if (opts.elo !== undefined && opts.elo >= 1320) {
      commands.push(`setoption name UCI_LimitStrength value true`);
      commands.push(`setoption name UCI_Elo value ${Math.min(2850, Math.max(1350, opts.elo))}`);
    } else {
      commands.push(`setoption name UCI_LimitStrength value false`);
    }

    const multiPV = Math.max(1, Math.min(5, opts.multiPV || 1));
    commands.push(`setoption name MultiPV value ${multiPV}`);
    commands.push(`position fen ${opts.fen}`);

    let goCmd = 'go';
    if (opts.movetime) {
      goCmd += ` movetime ${Math.min(5000, Math.max(50, opts.movetime))}`;
    } else if (opts.depth) {
      goCmd += ` depth ${Math.min(25, Math.max(1, opts.depth))}`;
    } else {
      goCmd += ` movetime 400`;
    }
    commands.push(goCmd);

    const lines: SearchLine[] = [];
    let bestMove = '';

    await this.enqueueTask<void>(
      commands,
      (line) => {
        if (line.startsWith('info ') && line.includes(' score ')) {
          const multipvMatch = line.match(/multipv (\d+)/);
          const depthMatch = line.match(/depth (\d+)/);
          const cpMatch = line.match(/score cp (-?\d+)/);
          const mateMatch = line.match(/score mate (-?\d+)/);
          const pvMatch = line.match(/ pv (.+)/);

          const mpv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;
          const depth = depthMatch ? parseInt(depthMatch[1], 10) : 1;
          const pv = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];

          // Stockfish score is from the active player's perspective
          let cp = cpMatch ? parseInt(cpMatch[1], 10) : undefined;
          let mate = mateMatch ? parseInt(mateMatch[1], 10) : undefined;

          // Normalize score to White's perspective (+ white ahead, - black ahead)
          if (turn === 'b') {
            if (cp !== undefined) cp = -cp;
            if (mate !== undefined) mate = -mate;
          }

          const existingIdx = lines.findIndex((l) => l.multipv === mpv);
          const parsedLine: SearchLine = {
            multipv: mpv,
            depth,
            cp,
            mate,
            pv,
          };
          if (existingIdx >= 0) {
            lines[existingIdx] = parsedLine;
          } else {
            lines.push(parsedLine);
          }
        }

        if (line.startsWith('bestmove ')) {
          const parts = line.split(' ');
          bestMove = parts[1];
          return true; // task complete
        }
        return false;
      },
      (opts.movetime || 400) + 4000
    );

    lines.sort((a, b) => a.multipv - b.multipv);

    // Compute SAN for best move
    let san: string | undefined;
    try {
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promotion = bestMove.length > 4 ? bestMove.slice(4, 5) : undefined;
      const m = chess.move({ from, to, promotion });
      if (m) san = m.san;
    } catch {
      // ignore
    }

    return {
      bestMove,
      san,
      lines,
      engine: this.engineName,
      ms: Date.now() - startTime,
    };
  }

  /**
   * Lichess Win Probability formula:
   * winChance(cp) = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
   */
  static winChance(cp: number): number {
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  }

  /**
   * Analyze played move against engine evaluation
   */
  async analyzeMove(fenBefore: string, playedMoveInput: string, depth: number = 10): Promise<AnalyzeResult> {
    const chessBefore = new Chess(fenBefore);
    const turn = chessBefore.turn();

    // Convert move input to SAN & UCI
    let playedMoveObj = chessBefore.moves({ verbose: true }).find(
      (m) => m.san === playedMoveInput || `${m.from}${m.to}${m.promotion || ''}` === playedMoveInput
    );
    if (!playedMoveObj) {
      throw new Error(`Lance inválido para a posição: ${playedMoveInput}`);
    }

    const playedSan = playedMoveObj.san;
    const playedUci = `${playedMoveObj.from}${playedMoveObj.to}${playedMoveObj.promotion || ''}`;

    // 1. Search best move before
    const searchBefore = await this.search({
      fen: fenBefore,
      depth: Math.min(14, depth),
      multiPV: 1,
    });

    const bestMove = searchBefore.bestMove;
    const bestSan = searchBefore.san;
    const topPv = searchBefore.lines[0]?.pv || [];

    // Eval before from White's perspective
    let cpBefore = 0;
    if (searchBefore.lines[0]?.mate !== undefined) {
      cpBefore = searchBefore.lines[0].mate > 0 ? 10000 : -10000;
    } else if (searchBefore.lines[0]?.cp !== undefined) {
      cpBefore = searchBefore.lines[0].cp;
    }

    // 2. Play move to get fenAfter
    const chessAfter = new Chess(fenBefore);
    chessAfter.move(playedMoveObj);
    const fenAfter = chessAfter.fen();

    let cpAfter = cpBefore;
    if (chessAfter.isCheckmate()) {
      cpAfter = turn === 'w' ? 10000 : -10000;
    } else if (chessAfter.isDraw()) {
      cpAfter = 0;
    } else {
      const searchAfter = await this.search({
        fen: fenAfter,
        depth: Math.min(14, depth),
        multiPV: 1,
      });
      if (searchAfter.lines[0]?.mate !== undefined) {
        cpAfter = searchAfter.lines[0].mate > 0 ? 10000 : -10000;
      } else if (searchAfter.lines[0]?.cp !== undefined) {
        cpAfter = searchAfter.lines[0].cp;
      }
    }

    // Win Chance loss calculation (from player perspective)
    const winBefore = EnginePool.winChance(turn === 'w' ? cpBefore : -cpBefore);
    const winAfter = EnginePool.winChance(turn === 'w' ? cpAfter : -cpAfter);
    const lossPct = Math.max(0, winBefore - winAfter);

    let quality: 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
    if (playedUci === bestMove || lossPct <= 1.5) {
      quality = 'best';
    } else if (lossPct <= 5.0) {
      quality = 'good';
    } else if (lossPct <= 12.0) {
      quality = 'inaccuracy';
    } else if (lossPct <= 22.0) {
      quality = 'mistake';
    } else {
      quality = 'blunder';
    }

    return {
      bestMove,
      bestSan,
      playedSan,
      cpBefore,
      cpAfter,
      lossPct: Math.round(lossPct * 10) / 10,
      quality,
      pv: topPv,
      engine: searchBefore.engine,
    };
  }

  getStatus() {
    return {
      ok: !!this.process && this.isReady,
      engine: this.engineName,
      queued: this.queue.length,
    };
  }

  destroy() {
    this.isDestroyed = true;
    if (this.currentTimer) clearTimeout(this.currentTimer);
    if (this.process) {
      this.sendCommand('quit');
      setTimeout(() => {
        try {
          this.process?.kill('SIGKILL');
        } catch {}
      }, 500);
    }
  }
}

export const enginePool = new EnginePool();
