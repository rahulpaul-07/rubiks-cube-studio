import type { AppAction } from "./actions";
import { SOLVED_FACELETS, type Face } from "../domain/cube";
import { faceletsFromCubeString } from "../domain/facelets";

export type AppState = {
  selectedFace: Face;
  facelets: Face[];
  solutionBase: string;
  solutionMoves: string[];
  playbackStep: number;
  lastScramble: string;
};

export function createInitialState(): AppState {
  return {
    selectedFace: "F",
    facelets: faceletsFromCubeString(SOLVED_FACELETS),
    solutionBase: "",
    solutionMoves: [],
    playbackStep: 0,
    lastScramble: "",
  };
}

export function reduceAppState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "select-face":
      return { ...state, selectedFace: action.face };
    case "paint-sticker": {
      const facelets = [...state.facelets];
      facelets[action.index] = state.selectedFace;
      return clearSolutionState({ ...state, facelets, lastScramble: "" });
    }
    case "replace-facelets": {
      const nextState = {
        ...state,
        facelets: [...action.facelets],
        lastScramble: action.lastScramble ?? "",
      };
      return action.clearSolution ? clearSolutionState(nextState) : nextState;
    }
    case "set-solution":
      return {
        ...state,
        solutionBase: action.base,
        solutionMoves: [...action.moves],
        playbackStep: 0,
      };
    case "set-playback-step":
      return {
        ...state,
        playbackStep: Math.max(0, Math.min(state.solutionMoves.length, action.step)),
      };
    case "clear-solution":
      return clearSolutionState(state);
  }
}

function clearSolutionState(state: AppState): AppState {
  return {
    ...state,
    solutionBase: "",
    solutionMoves: [],
    playbackStep: 0,
  };
}
