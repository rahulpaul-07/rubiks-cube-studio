import { describe, expect, it } from "vitest";
import { faceletsFromCubeString, parseFacelets, serializeFacelets } from "./facelets";
import type { Face } from "./cube";
import { SOLVED_FACELETS } from "./cube";

describe("parseFacelets", () => {
  it("parses a valid 54-character facelet string", () => {
    const result = parseFacelets(SOLVED_FACELETS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.facelets).toHaveLength(54);
      expect(result.facelets[0]).toBe("U");
    }
  });

  it("normalizes lowercase input to uppercase", () => {
    const input = "uuuuuuuuurrrrrrrrrfffffffffdddddddddlllllllllbbbbbbbbb";
    const result = parseFacelets(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.facelets[0]).toBe("U");
    }
  });

  it("strips whitespace before parsing", () => {
    const input = "UUUUUUUUU RRRRRRRRR FFFFFFFFF DDDDDDDDD LLLLLLLLL BBBBBBBBB";
    const result = parseFacelets(input);
    expect(result.ok).toBe(true);
  });

  it("rejects strings with wrong length", () => {
    const result = parseFacelets("UUUUUU");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("54");
    }
  });

  it("rejects strings with invalid face characters", () => {
    const input = "XUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
    const result = parseFacelets(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("X");
    }
  });
});

describe("serializeFacelets", () => {
  it("joins face array into a string", () => {
    const facelets: Face[] = ["U", "R", "F"];
    expect(serializeFacelets(facelets)).toBe("URF");
  });

  it("round-trips with parseFacelets", () => {
    const result = parseFacelets(SOLVED_FACELETS);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(serializeFacelets(result.facelets)).toBe(SOLVED_FACELETS);
    }
  });
});

describe("faceletsFromCubeString", () => {
  it("returns a face array for a valid string", () => {
    const facelets = faceletsFromCubeString(SOLVED_FACELETS);
    expect(facelets).toHaveLength(54);
    expect(facelets[0]).toBe("U");
  });

  it("throws for an invalid string", () => {
    expect(() => faceletsFromCubeString("bad")).toThrow();
  });
});
