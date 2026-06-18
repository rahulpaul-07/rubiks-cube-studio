import { describe, expect, it } from "vitest";
import { CubeJsSolver } from "./cubejsSolver";
import { SOLVED_FACELETS } from "../domain/cube";

describe("CubeJsSolver", () => {
  it("initializes to not ready", () => {
    const solver = new CubeJsSolver();
    expect(solver.ready).toBe(false);
  });

  it("throws when solve is called before initialization", () => {
    const solver = new CubeJsSolver();
    expect(() => solver.solve(SOLVED_FACELETS)).toThrow(/initialized/i);
  });

  it("can be initialized and then solves a cube", async () => {
    const solver = new CubeJsSolver();
    await solver.initialize();
    expect(solver.ready).toBe(true);

    const result = solver.solve(SOLVED_FACELETS);
    expect(typeof result.algorithm).toBe("string");
    expect(result.durationMs).toBeGreaterThan(0);
  });

  it("subsequent initialize calls return the same promise", () => {
    const solver = new CubeJsSolver();
    const p1 = solver.initialize();
    const p2 = solver.initialize();
    expect(p1).toBe(p2);
  });
});
