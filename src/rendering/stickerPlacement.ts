import { FACES, STICKERS_PER_FACE } from "../domain/cube";

type Vector3Tuple = [number, number, number];

export type StickerPlacement = {
  position: Vector3Tuple;
  rotation: Vector3Tuple;
};

export function stickerPlacement(index: number): StickerPlacement {
  const face = FACES[Math.floor(index / STICKERS_PER_FACE)];
  const local = index % STICKERS_PER_FACE;
  const row = Math.floor(local / 3);
  const col = local % 3;
  const spacing = 1.04;
  const surface = 1.58;
  const x = (col - 1) * spacing;
  const y = (1 - row) * spacing;

  switch (face) {
    case "U":
      return {
        position: [x, surface, (row - 1) * spacing],
        rotation: [-Math.PI / 2, 0, 0],
      };
    case "R":
      return {
        position: [surface, y, (1 - col) * spacing],
        rotation: [0, Math.PI / 2, 0],
      };
    case "F":
      return {
        position: [x, y, surface],
        rotation: [0, 0, 0],
      };
    case "D":
      return {
        position: [x, -surface, (1 - row) * spacing],
        rotation: [Math.PI / 2, 0, 0],
      };
    case "L":
      return {
        position: [-surface, y, (col - 1) * spacing],
        rotation: [0, -Math.PI / 2, 0],
      };
    case "B":
      return {
        position: [(1 - col) * spacing, y, -surface],
        rotation: [0, Math.PI, 0],
      };
  }
}
