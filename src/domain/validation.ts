import { FACES, FACE_NAMES, STICKERS_PER_FACE, TOTAL_FACELETS, type Face } from "./cube";

export type FaceletValidationIssue =
  | {
      code: "invalid-length";
      message: string;
      actual: number;
      expected: number;
    }
  | {
      code: "invalid-color-count";
      message: string;
      face: Face;
      actual: number;
      expected: number;
    }
  | {
      code: "invalid-center";
      message: string;
      face: Face;
      actual: Face | undefined;
      expected: Face;
    };

export type FaceletValidationResult =
  | { ok: true; issues: [] }
  | { ok: false; issues: FaceletValidationIssue[] };

export function countFacelets(state: readonly Face[]): Record<Face, number> {
  const counts: Record<Face, number> = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };

  for (const face of state) {
    counts[face] += 1;
  }

  return counts;
}

export function validateFacelets(state: readonly Face[]): FaceletValidationResult {
  const issues: FaceletValidationIssue[] = [];

  if (state.length !== TOTAL_FACELETS) {
    issues.push({
      code: "invalid-length",
      message: `A 3x3 cube needs ${TOTAL_FACELETS} stickers`,
      actual: state.length,
      expected: TOTAL_FACELETS,
    });
  }

  const counts = countFacelets(state);
  for (const face of FACES) {
    if (counts[face] !== STICKERS_PER_FACE) {
      issues.push({
        code: "invalid-color-count",
        message: `${FACE_NAMES[face]} color has ${counts[face]} stickers, expected ${STICKERS_PER_FACE}`,
        face,
        actual: counts[face],
        expected: STICKERS_PER_FACE,
      });
    }
  }

  for (const face of FACES) {
    const centerIndex = FACES.indexOf(face) * STICKERS_PER_FACE + 4;
    if (state[centerIndex] !== face) {
      issues.push({
        code: "invalid-center",
        message: `${FACE_NAMES[face]} center must stay ${face}`,
        face,
        actual: state[centerIndex],
        expected: face,
      });
    }
  }

  return issues.length === 0 ? { ok: true, issues: [] } : { ok: false, issues };
}
