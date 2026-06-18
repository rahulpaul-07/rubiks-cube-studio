import { describe, expect, it } from "vitest";
import { FACE_COLORS, FACE_TEXT_COLORS } from "./colors";
import { FACES } from "./cube";

describe("FACE_COLORS", () => {
  it("defines a color for every canonical face", () => {
    for (const face of FACES) {
      expect(FACE_COLORS[face]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe("FACE_TEXT_COLORS", () => {
  it("defines a text color for every canonical face", () => {
    for (const face of FACES) {
      expect(FACE_TEXT_COLORS[face]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
