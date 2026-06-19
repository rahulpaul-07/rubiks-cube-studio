/**
 * The 6 faces of a standard Rubik's Cube in URFDLB notation.
 */
export const FACES = ["U", "R", "F", "D", "L", "B"] as const;

/**
 * Represents a single face of the cube.
 */
export type Face = (typeof FACES)[number];

/**
 * Number of facelets (stickers) per face.
 */
export const STICKERS_PER_FACE = 9;

/**
 * Total number of facelets on a 3x3x3 Rubik's Cube.
 */
export const TOTAL_FACELETS = FACES.length * STICKERS_PER_FACE;

/**
 * Human-readable names for each face.
 */
export const FACE_NAMES: Readonly<Record<Face, string>> = {
  U: "Up",
  R: "Right",
  F: "Front",
  D: "Down",
  L: "Left",
  B: "Back",
};

/**
 * The standard solved state of a Rubik's Cube as a 54-character string.
 */
export const SOLVED_FACELETS = FACES.map((face) => face.repeat(STICKERS_PER_FACE)).join("");
