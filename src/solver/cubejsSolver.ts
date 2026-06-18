import Cube from "cubejs";
import type { SolveResult, SolverService } from "./types";

export class CubeJsSolver implements SolverService {
  private initialized = false;

  get ready(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const { default: solveSource } = await import("cubejs/lib/solve.js?raw");
    const requireShim = (path: string) => {
      if (path === "./cube") {
        return Cube;
      }
      throw new Error(`Unsupported cubejs dependency: ${path}`);
    };

    const moduleShim = { exports: {} };
    const scope = { Cube };
    // cubejs publishes its solver as CommonJS source, so the adapter evaluates it
    // with a restricted require shim until the dependency integration is replaced.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const load = new Function("require", "module", "exports", solveSource);
    load.call(scope, requireShim, moduleShim, moduleShim.exports);
    Cube.initSolver();
    this.initialized = true;
  }

  solve(facelets: string): SolveResult {
    if (!this.initialized) {
      throw new Error("Solver must be initialized before solving");
    }

    const cube = Cube.fromString(facelets);
    const start = performance.now();
    const algorithm = cube.solve();

    return {
      algorithm,
      durationMs: Math.max(1, Math.round(performance.now() - start)),
    };
  }
}

export const cubeSolver: SolverService = new CubeJsSolver();
