import { describe, expect, it } from "vitest";
import { averageRgba, classifyColor, rgbToHsv } from "./colorDetection";

describe("colorDetection", () => {
  it("converts primary colors to expected hues", () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 }).h).toBeCloseTo(0);
    expect(rgbToHsv({ r: 0, g: 255, b: 0 }).h).toBeCloseTo(120);
    expect(rgbToHsv({ r: 0, g: 0, b: 255 }).h).toBeCloseTo(240);
    expect(rgbToHsv({ r: 255, g: 255, b: 255 }).s).toBeCloseTo(0);
  });

  it("classifies the six standard cube colors to the right faces", () => {
    expect(classifyColor({ r: 245, g: 245, b: 245 })).toBe("U"); // white
    expect(classifyColor({ r: 245, g: 200, b: 40 })).toBe("D"); // yellow
    expect(classifyColor({ r: 200, g: 40, b: 40 })).toBe("R"); // red
    expect(classifyColor({ r: 235, g: 130, b: 30 })).toBe("L"); // orange
    expect(classifyColor({ r: 30, g: 170, b: 90 })).toBe("F"); // green
    expect(classifyColor({ r: 40, g: 90, b: 210 })).toBe("B"); // blue
  });

  it("averages an RGBA buffer", () => {
    const buffer = new Uint8ClampedArray([0, 0, 0, 255, 200, 100, 50, 255]);
    expect(averageRgba(buffer)).toEqual({ r: 100, g: 50, b: 25 });
  });
});
