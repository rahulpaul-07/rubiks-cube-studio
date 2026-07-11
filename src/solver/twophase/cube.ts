import { SOLVED_FACELETS } from "../../domain/cube";

/**
 * Cubie-level cube model used by the from-scratch two-phase solver.
 *
 * A cube is described by corner permutation/orientation and edge
 * permutation/orientation arrays. All move definitions and facelet conversions
 * follow the standard URFDLB convention and were validated move-for-move
 * against a reference implementation (see `twophase.test.ts`).
 */
export interface Cubie {
  cp: number[]; // corner permutation (0..7)
  co: number[]; // corner orientation (0..2)
  ep: number[]; // edge permutation (0..11)
  eo: number[]; // edge orientation (0..1)
}

// Corner slots: URF UFL ULB UBR DFR DLF DBL DRB
// Edge slots:   UR UF UL UB DR DF DL DB FR FL BL BR
export const SOLVED_STRING = SOLVED_FACELETS;

export function solvedCubie(): Cubie {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

const [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB] = [0, 1, 2, 3, 4, 5, 6, 7];
const [UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Canonical quarter-turn definitions (Kociemba).
const BASIC_MOVES: Record<string, Cubie> = {
  U: {
    cp: [UBR, URF, UFL, ULB, DFR, DLF, DBL, DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UB, UR, UF, UL, DR, DF, DL, DB, FR, FL, BL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  R: {
    cp: [DFR, UFL, ULB, URF, DRB, DLF, DBL, UBR],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [FR, UF, UL, UB, BR, DF, DL, DB, DR, FL, BL, UR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    cp: [UFL, DLF, ULB, UBR, URF, DFR, DBL, DRB],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [UR, FL, UL, UB, DR, FR, DL, DB, UF, DF, BL, BR],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [URF, UFL, ULB, UBR, DLF, DBL, DRB, DFR],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [UR, UF, UL, UB, DF, DL, DB, DR, FR, FL, BL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  L: {
    cp: [URF, ULB, DBL, UBR, DFR, UFL, DLF, DRB],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [UR, UF, BL, UB, DR, DF, FL, DB, FR, UL, DL, BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  B: {
    cp: [URF, UFL, UBR, DRB, DFR, DLF, ULB, DBL],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [UR, UF, UL, BR, DR, DF, DL, BL, FR, FL, UB, DB],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
};

export function multiply(a: Cubie, b: Cubie): Cubie {
  const cp = new Array<number>(8);
  const co = new Array<number>(8);
  const ep = new Array<number>(12);
  const eo = new Array<number>(12);
  for (let i = 0; i < 8; i += 1) {
    cp[i] = a.cp[b.cp[i]];
    co[i] = (a.co[b.cp[i]] + b.co[i]) % 3;
  }
  for (let i = 0; i < 12; i += 1) {
    ep[i] = a.ep[b.ep[i]];
    eo[i] = (a.eo[b.ep[i]] + b.eo[i]) % 2;
  }
  return { cp, co, ep, eo };
}

/** Applies a WCA move token (`U`, `U2`, `U'`) to a cube, returning a new cube. */
export function applyToken(cube: Cubie, token: string): Cubie {
  const base = BASIC_MOVES[token[0]];
  const times = token.includes("2") ? 2 : token.includes("'") ? 3 : 1;
  let out = cube;
  for (let t = 0; t < times; t += 1) {
    out = multiply(out, base);
  }
  return out;
}

const U = 0;
const D = 3;
const cornerFacelet = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];
const cornerColor = [
  [0, 1, 2],
  [0, 2, 4],
  [0, 4, 5],
  [0, 5, 1],
  [3, 2, 1],
  [3, 4, 2],
  [3, 5, 4],
  [3, 1, 5],
];
const edgeFacelet = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];
const edgeColor = [
  [0, 1],
  [0, 2],
  [0, 4],
  [0, 5],
  [3, 1],
  [3, 2],
  [3, 4],
  [3, 5],
  [2, 1],
  [2, 4],
  [5, 4],
  [5, 1],
];
const FACE_INDEX: Record<string, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const FACE_LETTERS = "URFDLB";

export function faceletToCubie(str: string): Cubie {
  const f = [...str].map((ch) => FACE_INDEX[ch]);
  const cp = new Array<number>(8).fill(-1);
  const co = new Array<number>(8).fill(0);
  const ep = new Array<number>(12).fill(-1);
  const eo = new Array<number>(12).fill(0);
  for (let i = 0; i < 8; i += 1) {
    let ori = 0;
    for (; ori < 3; ori += 1) {
      const face = f[cornerFacelet[i][ori]];
      if (face === U || face === D) break;
    }
    const col1 = f[cornerFacelet[i][(ori + 1) % 3]];
    const col2 = f[cornerFacelet[i][(ori + 2) % 3]];
    for (let j = 0; j < 8; j += 1) {
      if (col1 === cornerColor[j][1] && col2 === cornerColor[j][2]) {
        cp[i] = j;
        co[i] = ori % 3;
        break;
      }
    }
  }
  for (let i = 0; i < 12; i += 1) {
    for (let j = 0; j < 12; j += 1) {
      if (f[edgeFacelet[i][0]] === edgeColor[j][0] && f[edgeFacelet[i][1]] === edgeColor[j][1]) {
        ep[i] = j;
        eo[i] = 0;
        break;
      }
      if (f[edgeFacelet[i][0]] === edgeColor[j][1] && f[edgeFacelet[i][1]] === edgeColor[j][0]) {
        ep[i] = j;
        eo[i] = 1;
        break;
      }
    }
  }
  return { cp, co, ep, eo };
}

export function cubieToFacelet(c: Cubie): string {
  const f = new Array<number>(54);
  const centers = [0, 1, 2, 3, 4, 5];
  for (let i = 0; i < 6; i += 1) f[i * 9 + 4] = centers[i];
  for (let i = 0; i < 8; i += 1) {
    for (let k = 0; k < 3; k += 1) {
      f[cornerFacelet[i][(k + c.co[i]) % 3]] = cornerColor[c.cp[i]][k];
    }
  }
  for (let i = 0; i < 12; i += 1) {
    for (let k = 0; k < 2; k += 1) {
      f[edgeFacelet[i][(k + c.eo[i]) % 2]] = edgeColor[c.ep[i]][k];
    }
  }
  return f.map((x) => FACE_LETTERS[x]).join("");
}
