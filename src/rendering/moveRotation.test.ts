import { describe, expect, it } from "vitest";
import Cube from "cubejs";
import { FACES, SOLVED_FACELETS, type Face } from "../domain/cube";
import { faceletIndexForCubie, invertMove, moveRotation } from "./moveRotation";
import { cubeSolver } from "../solver/cubejsSolver";
import { createScramble } from "../domain/scramble";

type Vec = [number, number, number];

const NORMAL: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

type Sticker = { normal: Vec; color: Face };
type Cubie = { pos: Vec; stickers: Sticker[] };

function buildModel(): Cubie[] {
  const cubies: Cubie[] = [];
  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const stickers: Sticker[] = [];
        for (const face of FACES) {
          const n = NORMAL[face];
          const onFace =
            (n[0] !== 0 && x === n[0]) || (n[1] !== 0 && y === n[1]) || (n[2] !== 0 && z === n[2]);
          if (onFace) {
            stickers.push({ normal: [...n], color: face });
          }
        }
        cubies.push({ pos: [x, y, z], stickers });
      }
    }
  }
  return cubies;
}

// Apply a quarter turn about +axis, `k` times (k may be negative), using
// integer math so there is no floating-point drift.
function rotate(v: Vec, axis: "x" | "y" | "z", k: number): Vec {
  let [x, y, z] = v;
  const times = ((k % 4) + 4) % 4;
  for (let i = 0; i < times; i += 1) {
    if (axis === "x") [y, z] = [-z, y];
    else if (axis === "y") [x, z] = [z, -x];
    else [x, y] = [-y, x];
  }
  return [x, y, z];
}

function applyMove(cubies: Cubie[], token: string): void {
  const move = moveRotation(token);
  if (!move) throw new Error(`bad token ${token}`);
  const quarter = Math.round(move.angle / (Math.PI / 2));
  const axisIndex = { x: 0, y: 1, z: 2 }[move.axis];
  for (const cubie of cubies) {
    if (cubie.pos[axisIndex] === move.layer) {
      cubie.pos = rotate(cubie.pos, move.axis, quarter);
      for (const sticker of cubie.stickers) {
        sticker.normal = rotate(sticker.normal, move.axis, quarter);
      }
    }
  }
}

function readFacelets(cubies: Cubie[]): string {
  let out = "";
  for (const face of FACES) {
    for (let i = 0; i < 9; i += 1) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const pos = facePos(face, row, col);
      const cubie = cubies.find(
        (c) => c.pos[0] === pos[0] && c.pos[1] === pos[1] && c.pos[2] === pos[2],
      )!;
      const normal = NORMAL[face];
      const sticker = cubie.stickers.find(
        (s) => s.normal[0] === normal[0] && s.normal[1] === normal[1] && s.normal[2] === normal[2],
      )!;
      out += sticker.color;
    }
  }
  return out;
}

// Inverse of faceletIndexForCubie: the home cubie coordinate for facelet (face,row,col).
function facePos(face: Face, row: number, col: number): Vec {
  switch (face) {
    case "U":
      return [col - 1, 1, row - 1];
    case "D":
      return [col - 1, -1, 1 - row];
    case "F":
      return [col - 1, 1 - row, 1];
    case "R":
      return [1, 1 - row, 1 - col];
    case "L":
      return [-1, 1 - row, col - 1];
    case "B":
      return [1 - col, 1 - row, -1];
  }
}

describe("moveRotation", () => {
  it("parses direction and half turns", () => {
    expect(moveRotation("R")!.turns).toBe(1);
    expect(moveRotation("R2")!.turns).toBe(2);
    expect(moveRotation("R")!.angle).toBeCloseTo(-Math.PI / 2);
    expect(moveRotation("R'")!.angle).toBeCloseTo(Math.PI / 2);
    expect(moveRotation("M")).toBeNull();
  });

  it("inverts moves", () => {
    expect(invertMove("R")).toBe("R'");
    expect(invertMove("R'")).toBe("R");
    expect(invertMove("F2")).toBe("F2");
  });

  it("faceletIndexForCubie and facePos are inverse mappings", () => {
    for (const face of FACES) {
      for (let i = 0; i < 9; i += 1) {
        const [x, y, z] = facePos(face, Math.floor(i / 3), i % 3);
        expect(faceletIndexForCubie(face, x, y, z)).toBe(FACES.indexOf(face) * 9 + i);
      }
    }
  });

  it("reproduces cubejs for every one of the 18 face turns", () => {
    for (const face of ["U", "D", "R", "L", "F", "B"]) {
      for (const suffix of ["", "'", "2"]) {
        const token = `${face}${suffix}`;
        const cube = new Cube();
        cube.move(token);
        const model = buildModel();
        applyMove(model, token);
        expect(readFacelets(model), `move ${token}`).toBe(cube.asString());
      }
    }
  });

  it("animates a scramble and solution back to solved", async () => {
    await cubeSolver.initialize();
    for (let trial = 0; trial < 5; trial += 1) {
      const scramble = createScramble();
      const cube = new Cube();
      cube.move(scramble);
      const model = buildModel();
      scramble
        .trim()
        .split(/\s+/)
        .forEach((m: string) => applyMove(model, m));
      expect(readFacelets(model)).toBe(cube.asString());
      const solution = cube.solve().trim();
      if (solution) {
        solution.split(/\s+/).forEach((m: string) => applyMove(model, m));
      }
      expect(readFacelets(model)).toBe(SOLVED_FACELETS);
    }
  });
});
