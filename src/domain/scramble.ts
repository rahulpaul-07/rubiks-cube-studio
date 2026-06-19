import { FACES } from "./cube";

const MOVE_SUFFIXES = ["", "'", "2"] as const;

export const DEFAULT_SCRAMBLE_LENGTH = 24;

/**
 * Generates a random valid Rubik's Cube scramble sequence.
 * Ensures consecutive moves don't turn the same face.
 *
 * @param length The number of moves to generate (defaults to 24).
 * @param random A random number generator function (defaults to Math.random).
 * @returns A space-separated string of WCA notation moves.
 */
export function createScramble(length = DEFAULT_SCRAMBLE_LENGTH, random = Math.random): string {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("Scramble length must be a positive integer");
  }

  const moves: string[] = [];
  let previousFace = "";

  while (moves.length < length) {
    const face = FACES[Math.floor(random() * FACES.length)];
    if (face === previousFace) {
      continue;
    }

    const suffix = MOVE_SUFFIXES[Math.floor(random() * MOVE_SUFFIXES.length)];
    moves.push(`${face}${suffix}`);
    previousFace = face;
  }

  return moves.join(" ");
}
