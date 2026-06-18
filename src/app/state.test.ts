import { describe, expect, it } from "vitest";
import { createInitialState, reduceAppState, type AppState } from "./state";
import { SOLVED_FACELETS, type Face } from "../domain/cube";
import { faceletsFromCubeString } from "../domain/facelets";

function solved(): AppState {
  return createInitialState();
}

describe("createInitialState", () => {
  it("returns a solved cube with front face selected", () => {
    const state = createInitialState();
    expect(state.selectedFace).toBe("F");
    expect(state.facelets).toHaveLength(54);
    expect(state.solutionMoves).toEqual([]);
    expect(state.playbackStep).toBe(0);
    expect(state.lastScramble).toBe("");
    expect(state.solutionBase).toBe("");
  });
});

describe("reduceAppState", () => {
  it("select-face updates selectedFace", () => {
    const state = reduceAppState(solved(), { type: "select-face", face: "R" });
    expect(state.selectedFace).toBe("R");
  });

  it("paint-sticker applies the selected color", () => {
    let state = solved();
    state = reduceAppState(state, { type: "select-face", face: "R" });
    state = reduceAppState(state, { type: "paint-sticker", index: 0 });
    expect(state.facelets[0]).toBe("R");
  });

  it("paint-sticker clears the last scramble", () => {
    let state = solved();
    state = { ...state, lastScramble: "R U R'" };
    state = reduceAppState(state, { type: "paint-sticker", index: 0 });
    expect(state.lastScramble).toBe("");
  });

  it("replace-facelets updates the facelet array", () => {
    const newFacelets = faceletsFromCubeString(SOLVED_FACELETS);
    newFacelets[0] = "B";
    const state = reduceAppState(solved(), {
      type: "replace-facelets",
      facelets: newFacelets,
    });
    expect(state.facelets[0]).toBe("B");
  });

  it("replace-facelets with clearSolution resets solution state", () => {
    let state = solved();
    state = reduceAppState(state, {
      type: "set-solution",
      base: SOLVED_FACELETS,
      moves: ["R", "U"],
    });
    state = reduceAppState(state, {
      type: "replace-facelets",
      facelets: faceletsFromCubeString(SOLVED_FACELETS),
      clearSolution: true,
    });
    expect(state.solutionMoves).toEqual([]);
    expect(state.playbackStep).toBe(0);
  });

  it("set-solution stores base and moves", () => {
    const state = reduceAppState(solved(), {
      type: "set-solution",
      base: SOLVED_FACELETS,
      moves: ["R", "U", "R'", "U'"],
    });
    expect(state.solutionBase).toBe(SOLVED_FACELETS);
    expect(state.solutionMoves).toEqual(["R", "U", "R'", "U'"]);
    expect(state.playbackStep).toBe(0);
  });

  it("set-playback-step clamps within bounds", () => {
    let state = reduceAppState(solved(), {
      type: "set-solution",
      base: SOLVED_FACELETS,
      moves: ["R", "U"],
    });
    state = reduceAppState(state, { type: "set-playback-step", step: 5 });
    expect(state.playbackStep).toBe(2);

    state = reduceAppState(state, { type: "set-playback-step", step: -1 });
    expect(state.playbackStep).toBe(0);
  });

  it("clear-solution resets solution fields", () => {
    let state = reduceAppState(solved(), {
      type: "set-solution",
      base: SOLVED_FACELETS,
      moves: ["R"],
    });
    state = reduceAppState(state, { type: "clear-solution" });
    expect(state.solutionBase).toBe("");
    expect(state.solutionMoves).toEqual([]);
    expect(state.playbackStep).toBe(0);
  });

  it("does not mutate the original state", () => {
    const original = solved();
    const facelets = [...original.facelets] as Face[];
    reduceAppState(original, { type: "select-face", face: "B" });
    expect(original.selectedFace).toBe("F");
    expect(original.facelets).toEqual(facelets);
  });
});
