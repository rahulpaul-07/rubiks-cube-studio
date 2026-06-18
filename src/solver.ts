import Cube from "cubejs";

let solverLoaded = false;

export async function ensureSolverLoaded() {
  if (solverLoaded && typeof Cube.initSolver === "function") {
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
  const load = new Function("require", "module", "exports", solveSource);
  load.call(scope, requireShim, moduleShim, moduleShim.exports);
  solverLoaded = true;
}

export { Cube };
