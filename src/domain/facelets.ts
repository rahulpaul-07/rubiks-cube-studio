import { FACES, TOTAL_FACELETS, type Face } from "./cube";

const FACE_SET = new Set<string>(FACES);

export type FaceletParseResult = { ok: true; facelets: Face[] } | { ok: false; message: string };

export function parseFacelets(value: string): FaceletParseResult {
  const normalized = value.toUpperCase().replace(/\s+/g, "");

  if (normalized.length !== TOTAL_FACELETS) {
    return {
      ok: false,
      message: `Paste ${TOTAL_FACELETS} characters using ${FACES.join(", ")}`,
    };
  }

  const invalidFacelet = [...normalized].find((facelet) => !FACE_SET.has(facelet));
  if (invalidFacelet) {
    return {
      ok: false,
      message: `Unsupported facelet "${invalidFacelet}". Use ${FACES.join(", ")}`,
    };
  }

  return {
    ok: true,
    facelets: [...normalized] as Face[],
  };
}

export function serializeFacelets(facelets: readonly Face[]): string {
  return facelets.join("");
}

export function faceletsFromCubeString(value: string): Face[] {
  const parsed = parseFacelets(value);
  if (!parsed.ok) {
    throw new Error(`Invalid cube facelet string: ${parsed.message}`);
  }
  return parsed.facelets;
}
