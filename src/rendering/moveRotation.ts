import { FACES, STICKERS_PER_FACE, type Face } from "../domain/cube";

/**
 * Geometry helpers that translate WCA face-turn notation into 3D layer
 * rotations for the animated preview. The mapping is anchored to the same
 * URFDLB facelet convention used across the domain layer, so a cubie sticker's
 * colour and its animated motion always agree.
 */

export type Axis = "x" | "y" | "z";

export type MoveRotation = {
  /** Face letter that was turned (U, R, F, D, L, B). */
  readonly face: Face;
  /** World axis the layer rotates about. */
  readonly axis: Axis;
  /** Coordinate (-1, 0, 1) of the layer on that axis. */
  readonly layer: -1 | 1;
  /** Signed rotation in radians (positive = right-hand rule about +axis). */
  readonly angle: number;
  /** Number of quarter turns (1 or 2). */
  readonly turns: 1 | 2;
};

const AXIS_BY_FACE: Readonly<Record<Face, Axis>> = {
  U: "y",
  D: "y",
  R: "x",
  L: "x",
  F: "z",
  B: "z",
};

const LAYER_BY_FACE: Readonly<Record<Face, -1 | 1>> = {
  U: 1,
  D: -1,
  R: 1,
  L: -1,
  F: 1,
  B: -1,
};

// Sign of a base (clockwise) quarter turn about the positive axis, verified
// move-for-move against cubejs for all 18 face turns.
const BASE_SIGN: Readonly<Record<Face, -1 | 1>> = {
  U: -1,
  D: 1,
  R: -1,
  L: 1,
  F: -1,
  B: 1,
};

const OUTER_FACES = new Set<Face>(FACES);

/** Returns the rotation for a single WCA move token such as `R`, `U'`, `F2`. */
export function moveRotation(token: string): MoveRotation | null {
  const face = token[0] as Face;
  if (!OUTER_FACES.has(face)) {
    return null;
  }
  const turns: 1 | 2 = token.includes("2") ? 2 : 1;
  const direction = token.includes("'") ? -1 : 1;
  const angle = BASE_SIGN[face] * direction * (Math.PI / 2) * turns;
  return { face, axis: AXIS_BY_FACE[face], layer: LAYER_BY_FACE[face], angle, turns };
}

/** Inverts a move token (`R` -> `R'`, `U'` -> `U`, `F2` -> `F2`). */
export function invertMove(token: string): string {
  const face = token[0];
  if (token.includes("2")) {
    return `${face}2`;
  }
  return token.includes("'") ? face : `${face}'`;
}

/**
 * The home cubie coordinate and outward normal that a given facelet index
 * occupies on a solved cube. This is the exact inverse of the placement used
 * by {@link faceletIndexForCubie}, letting the animated preview colour each
 * cubie sticker from a 54-character facelet array.
 */
export function faceletIndexForCubie(face: Face, x: number, y: number, z: number): number {
  const base = FACES.indexOf(face) * STICKERS_PER_FACE;
  switch (face) {
    case "U":
      return base + (z + 1) * 3 + (x + 1);
    case "D":
      return base + (1 - z) * 3 + (x + 1);
    case "F":
      return base + (1 - y) * 3 + (x + 1);
    case "R":
      return base + (1 - y) * 3 + (1 - z);
    case "L":
      return base + (1 - y) * 3 + (z + 1);
    case "B":
      return base + (1 - y) * 3 + (1 - x);
  }
}
