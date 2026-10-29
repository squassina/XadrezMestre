import { useEffect, useRef, useCallback } from 'react';
import { Move } from 'chess.js';
import { BotLevel } from '../types/chess';

export function useChessWorker() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Instancia o Web Worker usando suporte nativo de módulos ES
    workerRef.current = new Worker(
      new URL('../utils/chess/engine.worker.ts', import.meta.url),
      { type: 'module' }
    );

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const calculateBotMove = useCallback(
    (fen: string, botLevel: BotLevel): Promise<Move | null> => {
      return new Promise((resolve) => {
        if (!workerRef.current) return resolve(null);

        const handleMessage = (e: MessageEvent<Move | null>) => {
          workerRef.current?.removeEventListener('message', handleMessage);
          resolve(e.data);
        };

        workerRef.current.addEventListener('message', handleMessage);
        workerRef.current.postMessage({ fen, botLevel });
      });
    },
    []
  );

  return { calculateBotMove };
}
