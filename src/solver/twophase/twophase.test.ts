import { beforeAll, describe, expect, it } from "vitest";
import Cube from "cubejs";
import { applyToken, cubieToFacelet, solvedCubie, SOLVED_STRING } from "./cube";
import { buildTables, type SolverTables } from "./tables";
import { solveFacelets } from "./search";

let tables: SolverTables;

beforeAll(() => {
  tables = buildTables();
}, 30000);

const FACES = ["U", "R", "F", "D", "L", "B"];
const SUFFIX = ["", "2", "'"];
function randomScramble(length: number): string {
  const moves: string[] = [];
  let prev = -1;
  for (let i = 0; i < length; i += 1) {
    let face = Math.floor(Math.random() * 6);
    while (face === prev) face = Math.floor(Math.random() * 6);
    prev = face;
    moves.push(FACES[face] + SUFFIX[Math.floor(Math.random() * 3)]);
  }
  return moves.join(" ");
}

describe("two-phase solver", () => {
  it("returns an empty solution for an already-solved cube", () => {
    const result = solveFacelets(SOLVED_STRING, tables);
    expect(result).toEqual({ solution: "", moves: [] });
  });

  it("solves random cubes, verified by cubejs's independent move engine", () => {
    const N = 60;
    let maxLen = 0;
    for (let i = 0; i < N; i += 1) {
      let cube = solvedCubie();
      for (const move of randomScramble(25).split(" ")) cube = applyToken(cube, move);
      const facelet = cubieToFacelet(cube);

      const result = solveFacelets(facelet, tables, { maxTimeMs: 80 });
      expect(result).not.toBeNull();
      const solution = result!;

      // independent verification: apply the solution through cubejs
      const reference = Cube.fromString(facelet);
      if (solution.solution) reference.move(solution.solution);
      expect(reference.asString()).toBe(SOLVED_STRING);
      expect(solution.moves.length).toBeLessThanOrEqual(26);
      maxLen = Math.max(maxLen, solution.moves.length);
    }
    expect(maxLen).toBeLessThanOrEqual(26);
  }, 30000);

  it("rejects a physically impossible cube (single flipped edge)", () => {
    const facelets = [...SOLVED_STRING];
    [facelets[7], facelets[19]] = [facelets[19], facelets[7]];
    expect(solveFacelets(facelets.join(""), tables, { maxTimeMs: 200 })).toBeNull();
  });

  it("produces only legal half-turn-metric moves", () => {
    const legal = new Set([
      "U",
      "U2",
      "U'",
      "R",
      "R2",
      "R'",
      "F",
      "F2",
      "F'",
      "D",
      "D2",
      "D'",
      "L",
      "L2",
      "L'",
      "B",
      "B2",
      "B'",
    ]);
    let cube = solvedCubie();
    for (const move of randomScramble(25).split(" ")) cube = applyToken(cube, move);
    const result = solveFacelets(cubieToFacelet(cube), tables, { maxTimeMs: 80 });
    expect(result).not.toBeNull();
    for (const move of result!.moves) expect(legal.has(move)).toBe(true);
  });
});
