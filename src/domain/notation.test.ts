import { describe, expect, it } from "vitest";
import { parseAlgorithm, splitMoves } from "./notation";

describe("splitMoves", () => {
  it("splits a space-delimited algorithm into moves", () => {
    expect(splitMoves("R U R' U'")).toEqual(["R", "U", "R'", "U'"]);
  });

  it("handles multiple spaces between moves", () => {
    expect(splitMoves("R  U   R'")).toEqual(["R", "U", "R'"]);
  });

  it("returns an empty array for empty input", () => {
    expect(splitMoves("")).toEqual([]);
  });

  it("returns an empty array for whitespace-only input", () => {
    expect(splitMoves("   ")).toEqual([]);
  });
});

describe("parseAlgorithm", () => {
  it("accepts a valid algorithm", () => {
    const result = parseAlgorithm("R U R' U'");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves).toEqual(["R", "U", "R'", "U'"]);
      expect(result.value).toBe("R U R' U'");
    }
  });

  it("accepts double moves", () => {
    const result = parseAlgorithm("R2 U2");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves).toEqual(["R2", "U2"]);
    }
  });

  it("accepts single-face moves without suffix", () => {
    const result = parseAlgorithm("R U F");
    expect(result.ok).toBe(true);
  });

  it("rejects empty input", () => {
    const result = parseAlgorithm("");
    expect(result.ok).toBe(false);
  });

  it("rejects unsupported notation", () => {
    const result = parseAlgorithm("R U Rw");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Rw");
    }
  });

  it("accepts slice and rotation moves", () => {
    const result = parseAlgorithm("M E S x y z");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.moves).toHaveLength(6);
    }
  });
});
