export const FACES = ["U", "R", "F", "D", "L", "B"] as const;

export type Face = (typeof FACES)[number];

export const STICKERS_PER_FACE = 9;
export const TOTAL_FACELETS = FACES.length * STICKERS_PER_FACE;

export const FACE_NAMES: Record<Face, string> = {
  U: "Up",
  R: "Right",
  F: "Front",
  D: "Down",
  L: "Left",
  B: "Back",
};

export const SOLVED_FACELETS = FACES.map((face) => face.repeat(STICKERS_PER_FACE)).join("");
