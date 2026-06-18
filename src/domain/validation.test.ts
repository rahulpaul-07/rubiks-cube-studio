import { describe, expect, it } from "vitest";
import { countFacelets, validateFacelets } from "./validation";
import { faceletsFromCubeString } from "./facelets";
import { SOLVED_FACELETS, type Face } from "./cube";

describe("countFacelets", () => {
  it("counts each face in a solved state", () => {
    const facelets = faceletsFromCubeString(SOLVED_FACELETS);
    const counts = countFacelets(facelets);
    expect(counts).toEqual({ U: 9, R: 9, F: 9, D: 9, L: 9, B: 9 });
  });

  it("returns zero counts for an empty array", () => {
    const counts = countFacelets([]);
    expect(counts).toEqual({ U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 });
  });
});

describe("validateFacelets", () => {
  it("accepts a solved cube", () => {
    const facelets = faceletsFromCubeString(SOLVED_FACELETS);
    const result = validateFacelets(facelets);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects a state with incorrect length", () => {
    const facelets: Face[] = ["U", "R", "F"];
    const result = validateFacelets(facelets);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "invalid-length")).toBe(true);
  });

  it("rejects a state with unequal color counts", () => {
    const facelets = faceletsFromCubeString(SOLVED_FACELETS);
    facelets[0] = "R"; // extra R, missing one U
    const result = validateFacelets(facelets);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "invalid-color-count")).toBe(true);
  });

  it("rejects a state with a wrong center", () => {
    const facelets = faceletsFromCubeString(SOLVED_FACELETS);
    // Swap U center (index 4) with R center value while keeping counts balanced
    // Center of U face is index 4, center of R face is index 13
    facelets[4] = "R";
    facelets[13] = "U";
    const result = validateFacelets(facelets);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "invalid-center")).toBe(true);
  });

  it("collects multiple issues", () => {
    const facelets: Face[] = Array(54).fill("U") as Face[];
    const result = validateFacelets(facelets);
    expect(result.ok).toBe(false);
    // Should have color count issues for R, F, D, L, B and center issues
    expect(result.issues.length).toBeGreaterThan(1);
  });
});
