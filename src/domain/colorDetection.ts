import type { Face } from "./cube";

/**
 * Maps sampled camera colours to cube faces. The application uses the standard
 * Western colour scheme, so each physical sticker colour corresponds to exactly
 * one face:
 *
 * - White  -> U
 * - Yellow -> D
 * - Red    -> R
 * - Orange -> L
 * - Green  -> F
 * - Blue   -> B
 *
 * Detection is intentionally simple (HSV thresholds); the Verify step lets the
 * user correct any misreads, so the classifier only needs to be a good first
 * guess under reasonable lighting.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsv = { h: number; s: number; v: number };

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

/** Classifies a single averaged sticker colour into a cube face. */
export function classifyColor(rgb: Rgb): Face {
  const { h, s, v } = rgbToHsv(rgb);

  // Low saturation + reasonable brightness reads as the white face.
  if (s < 0.25 && v > 0.5) {
    return "U";
  }

  if (h < 18 || h >= 330) {
    return "R";
  }
  if (h < 45) {
    return "L"; // orange
  }
  if (h < 72) {
    return "D"; // yellow
  }
  if (h < 170) {
    return "F"; // green
  }
  if (h < 265) {
    return "B"; // blue
  }
  return "R";
}

/**
 * Averages the pixels in an RGBA buffer (as returned by
 * `CanvasRenderingContext2D.getImageData`).
 */
export function averageRgba(data: Uint8ClampedArray): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / pixels, g: g / pixels, b: b / pixels };
}
