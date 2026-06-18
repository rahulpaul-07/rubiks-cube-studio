import { describe, expect, it } from "vitest";
import { FACES, FACE_NAMES, SOLVED_FACELETS, STICKERS_PER_FACE, TOTAL_FACELETS } from "./cube";

describe("cube constants", () => {
  it("defines six canonical faces in URFDLB order", () => {
    expect(FACES).toEqual(["U", "R", "F", "D", "L", "B"]);
  });

  it("defines nine stickers per face", () => {
    expect(STICKERS_PER_FACE).toBe(9);
  });

  it("defines 54 total facelets", () => {
    expect(TOTAL_FACELETS).toBe(54);
  });

  it("maps each face to a human-readable name", () => {
    expect(FACE_NAMES.U).toBe("Up");
    expect(FACE_NAMES.R).toBe("Right");
    expect(FACE_NAMES.F).toBe("Front");
    expect(FACE_NAMES.D).toBe("Down");
    expect(FACE_NAMES.L).toBe("Left");
    expect(FACE_NAMES.B).toBe("Back");
  });

  it("generates a solved facelet string of length 54", () => {
    expect(SOLVED_FACELETS).toHaveLength(54);
    expect(SOLVED_FACELETS).toBe("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB");
  });
});
