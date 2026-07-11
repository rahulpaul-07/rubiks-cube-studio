import { solveFacelets } from "./twophase/search";
import { buildTables, type SolverTables } from "./twophase/tables";

/**
 * Dedicated Web Worker that owns the solver's lookup tables and answers solve
 * requests off the main thread, so building tables (~1s) and searching never
 * block rendering or the animation loop.
 */
type SolveRequest =
  | { id: number; type: "init" }
  | { id: number; type: "solve"; facelet: string; maxTimeMs?: number };

interface WorkerScope {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<SolveRequest>) => void) | null;
}

const ctx = self as unknown as WorkerScope;
let tables: SolverTables | null = null;

ctx.onmessage = (event) => {
  const message = event.data;
  tables ??= buildTables();

  if (message.type === "init") {
    ctx.postMessage({ id: message.id, type: "ready" });
    return;
  }

  const started = performance.now();
  const output = solveFacelets(message.facelet, tables, { maxTimeMs: message.maxTimeMs ?? 600 });
  const durationMs = Math.max(1, Math.round(performance.now() - started));
  ctx.postMessage({
    id: message.id,
    type: "result",
    ok: output !== null,
    algorithm: output?.solution ?? "",
    durationMs,
  });
};
