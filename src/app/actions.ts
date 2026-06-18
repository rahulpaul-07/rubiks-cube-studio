import type { Face } from "../domain/cube";

export type AppAction =
  | { type: "select-face"; face: Face }
  | { type: "paint-sticker"; index: number }
  | {
      type: "replace-facelets";
      facelets: Face[];
      lastScramble?: string;
      clearSolution?: boolean;
    }
  | { type: "set-solution"; base: string; moves: string[] }
  | { type: "set-playback-step"; step: number }
  | { type: "clear-solution" };
