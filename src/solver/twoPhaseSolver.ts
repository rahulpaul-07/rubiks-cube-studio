import type { AsyncSolverService, SolveResult } from "./types";

type WorkerResponse =
  | { id: number; type: "ready" }
  | { id: number; type: "result"; ok: boolean; algorithm: string; durationMs: number };

/**
 * Main-thread client for the two-phase solver Web Worker. Correlates requests
 * and responses by id and exposes a small async solver interface.
 */
export class TwoPhaseSolver implements AsyncSolverService {
  private worker: Worker | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private sequence = 0;
  private initResolve: (() => void) | null = null;
  private readonly pending = new Map<
    number,
    { resolve: (result: SolveResult) => void; reject: (error: Error) => void }
  >();

  get ready(): boolean {
    return this.initialized;
  }

  initialize(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        const worker = new Worker(new URL("./twophase.worker.ts", import.meta.url), {
          type: "module",
        });
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handleMessage(event.data);
        worker.onerror = () => reject(new Error("Solver worker failed to start"));
        this.worker = worker;
        this.initResolve = () => {
          this.initialized = true;
          resolve();
        };
        worker.postMessage({ id: ++this.sequence, type: "init" });
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Solver worker init failed"));
      }
    });
    return this.initPromise;
  }

  solve(facelets: string): Promise<SolveResult> {
    return new Promise<SolveResult>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Solver must be initialized before solving"));
        return;
      }
      const id = ++this.sequence;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, type: "solve", facelet: facelets });
    });
  }

  private handleMessage(message: WorkerResponse): void {
    if (message.type === "ready") {
      this.initResolve?.();
      return;
    }
    const entry = this.pending.get(message.id);
    if (!entry) return;
    this.pending.delete(message.id);
    if (message.ok) {
      entry.resolve({ algorithm: message.algorithm, durationMs: message.durationMs });
    } else {
      entry.reject(new Error("The cube state is not solvable"));
    }
  }
}

export const twoPhaseSolver: AsyncSolverService = new TwoPhaseSolver();
