import { FACES, type Face } from "./cube";

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
  let previousFace: Face | "" = "";

  for (let i = 0; i < length; i += 1) {
    // Pick from the faces that don't repeat the previous move. Building the
    // candidate list up front (instead of rejection-sampling from FACES until
    // a non-matching face turns up) guarantees termination in exactly `length`
    // iterations no matter what `random` returns. The previous implementation
    // retried in a `while` loop, which spun forever whenever `random` produced
    // the same value twice in a row (e.g. any fixed/stubbed RNG) -- this is
    // exactly what the "uses the provided random function" test below does,
    // and it hung the process (confirmed against this repo's own CI history:
    // https://github.com/rahulpaul-07/rubiks-cube-studio/actions/workflows/ci.yml
    // shows multiple runs timing out at GitHub's 6-hour job limit).
    const candidates = FACES.filter((face) => face !== previousFace);
    const face = candidates[Math.floor(random() * candidates.length)];
    const suffix = MOVE_SUFFIXES[Math.floor(random() * MOVE_SUFFIXES.length)];
    moves.push(`${face}${suffix}`);
    previousFace = face;
  }

  return moves.join(" ");
}
