import { applyToken, solvedCubie, type Cubie } from "./cube";
import {
  getCornerPerm,
  getEdge8Perm,
  getFlip,
  getSliceLocation,
  getSliceSort,
  getTwist,
  setCornerPerm,
  setEdge8Perm,
  setFlip,
  setSliceLocation,
  setSliceSort,
  setTwist,
} from "./coords";

/** Move set for phase 1 (all 18 quarter/half turns) and phase 2 (the 10 G1 moves). */
export const PHASE1_MOVES = [
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
] as const;
export const PHASE2_MOVES = ["U", "U2", "U'", "D", "D2", "D'", "R2", "L2", "F2", "B2"] as const;

export const SLICE_SOLVED = 494; // UD-slice location of a solved cube

export interface SolverTables {
  twistMove: Int32Array;
  flipMove: Int32Array;
  sliceMove: Int32Array;
  cornerMove: Int32Array;
  edge8Move: Int32Array;
  sliceSortMove: Int32Array;
  prunTwistSlice: Uint8Array;
  prunFlipSlice: Uint8Array;
  prunCornerSlice: Uint8Array;
  prunEdgeSlice: Uint8Array;
}

type GetCoord = (c: Cubie) => number;
type SetCoord = (c: Cubie, index: number) => void;

function buildMoveTable(
  size: number,
  setCoord: SetCoord,
  getCoord: GetCoord,
  moves: readonly string[],
): Int32Array {
  const n = moves.length;
  const table = new Int32Array(size * n);
  for (let c = 0; c < size; c += 1) {
    const cube = solvedCubie();
    setCoord(cube, c);
    for (let m = 0; m < n; m += 1) {
      table[c * n + m] = getCoord(applyToken(cube, moves[m]));
    }
  }
  return table;
}

function buildPruningTable(
  sizeA: number,
  sizeB: number,
  tableA: Int32Array,
  tableB: Int32Array,
  moveCount: number,
  goalA: number,
  goalB: number,
): Uint8Array {
  const total = sizeA * sizeB;
  const prun = new Uint8Array(total).fill(0xff);
  const goal = goalA * sizeB + goalB;
  prun[goal] = 0;
  let frontier: number[] = [goal];
  let depth = 0;
  while (frontier.length > 0) {
    const next: number[] = [];
    for (const idx of frontier) {
      const a = Math.floor(idx / sizeB);
      const b = idx % sizeB;
      const baseA = a * moveCount;
      const baseB = b * moveCount;
      for (let m = 0; m < moveCount; m += 1) {
        const ni = tableA[baseA + m] * sizeB + tableB[baseB + m];
        if (prun[ni] === 0xff) {
          prun[ni] = depth + 1;
          next.push(ni);
        }
      }
    }
    frontier = next;
    depth += 1;
  }
  return prun;
}

/**
 * Builds every move and pruning table. Runs once per Web Worker (~1s) and then
 * every solve is a table lookup. Total footprint is a few MB of typed arrays.
 */
export function buildTables(): SolverTables {
  const twistMove = buildMoveTable(2187, setTwist, getTwist, PHASE1_MOVES);
  const flipMove = buildMoveTable(2048, setFlip, getFlip, PHASE1_MOVES);
  const sliceMove = buildMoveTable(495, setSliceLocation, getSliceLocation, PHASE1_MOVES);
  const cornerMove = buildMoveTable(40320, setCornerPerm, getCornerPerm, PHASE2_MOVES);
  const edge8Move = buildMoveTable(40320, setEdge8Perm, getEdge8Perm, PHASE2_MOVES);
  const sliceSortMove = buildMoveTable(24, setSliceSort, getSliceSort, PHASE2_MOVES);

  return {
    twistMove,
    flipMove,
    sliceMove,
    cornerMove,
    edge8Move,
    sliceSortMove,
    prunTwistSlice: buildPruningTable(2187, 495, twistMove, sliceMove, 18, 0, SLICE_SOLVED),
    prunFlipSlice: buildPruningTable(2048, 495, flipMove, sliceMove, 18, 0, SLICE_SOLVED),
    prunCornerSlice: buildPruningTable(40320, 24, cornerMove, sliceSortMove, 10, 0, 0),
    prunEdgeSlice: buildPruningTable(40320, 24, edge8Move, sliceSortMove, 10, 0, 0),
  };
}
