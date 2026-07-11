import { applyToken, cubieToFacelet, faceletToCubie, SOLVED_STRING, type Cubie } from "./cube";
import {
  getCornerPerm,
  getEdge8Perm,
  getFlip,
  getSliceLocation,
  getSliceSort,
  getTwist,
} from "./coords";
import { PHASE1_MOVES, PHASE2_MOVES, SLICE_SOLVED, type SolverTables } from "./tables";

export interface SolveOutput {
  solution: string;
  moves: string[];
}

export interface SolveOptions {
  maxTimeMs?: number;
  maxLength?: number;
}

const PHASE1_FACE = PHASE1_MOVES.map((m) => "URFDLB".indexOf(m[0]));
const PHASE2_FACE = PHASE2_MOVES.map((m) => "URFDLB".indexOf(m[0]));

// Two consecutive moves on the same face are redundant; commuting opposite
// faces are only allowed in a canonical order to avoid exploring duplicates.
function permutationParity(arr: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = i + 1; j < arr.length; j += 1) {
      if (arr[j] < arr[i]) count ^= 1;
    }
  }
  return count;
}

// A cube is solvable iff every cubie is present, corner-orientation sum is a
// multiple of 3, edge-orientation sum is even, and corner and edge permutation
// parities agree. Impossible states (e.g. a single flipped edge) are rejected
// here rather than being handed to a search that could never terminate.
function isSolvable(c: Cubie): boolean {
  if (c.cp.some((x) => x < 0) || new Set(c.cp).size !== 8) return false;
  if (c.ep.some((x) => x < 0) || new Set(c.ep).size !== 12) return false;
  if (c.co.reduce((a, b) => a + b, 0) % 3 !== 0) return false;
  if (c.eo.reduce((a, b) => a + b, 0) % 2 !== 0) return false;
  return permutationParity(c.cp) === permutationParity(c.ep);
}

function allowed(face: number, lastFace: number): boolean {
  if (lastFace < 0) return true;
  if (face === lastFace) return false;
  if (face % 3 === lastFace % 3 && face < lastFace) return false;
  return true;
}

/**
 * Solves a cube given as a 54-character URFDLB facelet string using Kociemba's
 * two-phase algorithm with IDA* search. Returns the shortest solution found
 * within the time budget, or `null` if the state is unsolvable.
 */
export function solveFacelets(
  facelet: string,
  tables: SolverTables,
  options: SolveOptions = {},
): SolveOutput | null {
  const maxTimeMs = options.maxTimeMs ?? 400;
  const maxLength = options.maxLength ?? 25;
  const cube = faceletToCubie(facelet);
  if (!isSolvable(cube)) return null;
  if (cubieToFacelet(cube) === SOLVED_STRING) {
    return { solution: "", moves: [] };
  }

  const twist0 = getTwist(cube);
  const flip0 = getFlip(cube);
  const slice0 = getSliceLocation(cube);
  const start = Date.now();
  const found: { value: { p1: number[]; p2: number[]; len: number } | null } = { value: null };
  const p1seq: number[] = [];

  function phase2(
    corner: number,
    edge8: number,
    slice: number,
    togo: number,
    lastFace: number,
    seq: number[],
  ): number[] | null {
    if (togo === 0) {
      return corner === 0 && edge8 === 0 && slice === 0 ? seq.slice() : null;
    }
    if (tables.prunCornerSlice[corner * 24 + slice] > togo) return null;
    if (tables.prunEdgeSlice[edge8 * 24 + slice] > togo) return null;
    for (let m = 0; m < 10; m += 1) {
      const face = PHASE2_FACE[m];
      if (!allowed(face, lastFace)) continue;
      seq.push(m);
      const result = phase2(
        tables.cornerMove[corner * 10 + m],
        tables.edge8Move[edge8 * 10 + m],
        tables.sliceSortMove[slice * 10 + m],
        togo - 1,
        face,
        seq,
      );
      seq.pop();
      if (result) return result;
    }
    return null;
  }

  function reachedG1(): void {
    let g1 = cube;
    for (const m of p1seq) g1 = applyToken(g1, PHASE1_MOVES[m]);
    const corner = getCornerPerm(g1);
    const edge8 = getEdge8Perm(g1);
    const slice = getSliceSort(g1);
    const lastFace = p1seq.length ? PHASE1_FACE[p1seq[p1seq.length - 1]] : -1;
    const budget = (found.value ? found.value.len : maxLength) - p1seq.length - 1;
    for (let depth = 0; depth <= budget; depth += 1) {
      const result = phase2(corner, edge8, slice, depth, lastFace, []);
      if (result) {
        const len = p1seq.length + result.length;
        if (!found.value || len < found.value.len)
          found.value = { p1: p1seq.slice(), p2: result, len };
        return;
      }
    }
  }

  function phase1(
    twist: number,
    flip: number,
    slice: number,
    togo: number,
    lastFace: number,
  ): void {
    if (togo === 0) {
      if (twist === 0 && flip === 0 && slice === SLICE_SOLVED) reachedG1();
      return;
    }
    if (tables.prunTwistSlice[twist * 495 + slice] > togo) return;
    if (tables.prunFlipSlice[flip * 495 + slice] > togo) return;
    for (let m = 0; m < 18; m += 1) {
      const face = PHASE1_FACE[m];
      if (!allowed(face, lastFace)) continue;
      p1seq.push(m);
      phase1(
        tables.twistMove[twist * 18 + m],
        tables.flipMove[flip * 18 + m],
        tables.sliceMove[slice * 18 + m],
        togo - 1,
        face,
      );
      p1seq.pop();
      if (Date.now() - start > maxTimeMs) return;
    }
  }

  for (let depth = 0; depth <= maxLength; depth += 1) {
    phase1(twist0, flip0, slice0, depth, -1);
    if (found.value && depth >= found.value.len) break;
    if (Date.now() - start > maxTimeMs) break;
  }

  if (!found.value) return null;
  const bestSolution = found.value;
  const moves = [
    ...bestSolution.p1.map((m) => PHASE1_MOVES[m]),
    ...bestSolution.p2.map((m) => PHASE2_MOVES[m]),
  ];
  return { solution: moves.join(" "), moves };
}
