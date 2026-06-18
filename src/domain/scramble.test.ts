import { describe, expect, it } from "vitest";
import { createScramble, DEFAULT_SCRAMBLE_LENGTH } from "./scramble";
import { FACES } from "./cube";

describe("createScramble", () => {
  it("generates a scramble of the default length", () => {
    const scramble = createScramble();
    const moves = scramble.split(" ");
    expect(moves).toHaveLength(DEFAULT_SCRAMBLE_LENGTH);
  });

  it("generates a scramble of a specified length", () => {
    const scramble = createScramble(10);
    const moves = scramble.split(" ");
    expect(moves).toHaveLength(10);
  });

  it("never produces consecutive moves on the same face", () => {
    const scramble = createScramble(100);
    const moves = scramble.split(" ");
    for (let i = 1; i < moves.length; i += 1) {
      const prevFace = moves[i - 1][0];
      const currFace = moves[i][0];
      expect(currFace).not.toBe(prevFace);
    }
  });

  it("only produces valid face moves with legal suffixes", () => {
    const scramble = createScramble(50);
    const moves = scramble.split(" ");
    const faceSet = new Set(FACES as readonly string[]);
    const suffixes = new Set(["", "'", "2"]);
    for (const move of moves) {
      expect(faceSet.has(move[0])).toBe(true);
      expect(suffixes.has(move.slice(1))).toBe(true);
    }
  });

  it("throws for non-positive length", () => {
    expect(() => createScramble(0)).toThrow(RangeError);
    expect(() => createScramble(-1)).toThrow(RangeError);
  });

  it("throws for non-integer length", () => {
    expect(() => createScramble(3.5)).toThrow(RangeError);
  });

  it("uses the provided random function", () => {
    let callCount = 0;
    const fakeRandom = () => {
      callCount += 1;
      return 0.1;
    };
    createScramble(5, fakeRandom);
    expect(callCount).toBeGreaterThan(0);
  });
});
