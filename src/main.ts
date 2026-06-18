import "./styles/index.css";
import { createInitialState, reduceAppState } from "./app/state";
import { SOLVED_FACELETS, type Face } from "./domain/cube";
import { faceletsFromCubeString, parseFacelets, serializeFacelets } from "./domain/facelets";
import { parseAlgorithm, splitMoves } from "./domain/notation";
import { createScramble } from "./domain/scramble";
import { validateFacelets } from "./domain/validation";
import { CubePreview } from "./rendering/CubePreview";
import { cubeSolver } from "./solver/cubejsSolver";
import { getAppElements, getAppRoot } from "./ui/dom";
import { renderAppTemplate } from "./ui/template";
import {
  renderAll,
  renderFaceletState,
  renderSolution,
  setStatus,
  updateStateLabels,
} from "./ui/view";
import Cube from "cubejs";

renderAppTemplate(getAppRoot());
const elements = getAppElements();

let appState = createInitialState();
let playTimer = 0;
let preview: CubePreview;

function startApp() {
  preview = new CubePreview(elements.preview);
  renderAll(
    elements,
    appState,
    preview,
    !!playTimer,
    { onSelectFace, onPaint },
    "Ready",
    "neutral",
  );
  bindEvents();
  window.addEventListener("pagehide", disposeApp, { once: true });
}

function disposeApp() {
  stopPlayback();
  preview.dispose();
}

function bindEvents() {
  elements.solveBtn.addEventListener("click", () => {
    void solveCurrentState();
  });
  elements.scrambleBtn.addEventListener("click", scrambleCube);
  elements.validateBtn.addEventListener("click", () => {
    const validation = validateFacelets(appState.facelets);
    if (!validation.ok) {
      setStatus(elements, validation.issues[0].message, "warn");
      return;
    }
    try {
      Cube.fromString(serializeFacelets(appState.facelets));
      setStatus(elements, "Cube is valid and solvable", "good");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The solver rejected this cube";
      setStatus(
        elements,
        message.includes("Error") ? "The cube state is physically impossible" : message,
        "warn",
      );
    }
  });
  elements.resetBtn.addEventListener("click", () => {
    stopPlayback();
    setFacelets(faceletsFromCubeString(SOLVED_FACELETS), { clearSolution: true });
    renderAll(
      elements,
      appState,
      preview,
      !!playTimer,
      { onSelectFace, onPaint },
      "Reset to solved",
      "neutral",
    );
  });
  elements.resetViewBtn.addEventListener("click", () => preview.resetView());
  elements.applyAlgorithmBtn.addEventListener("click", applyAlgorithm);
  elements.algorithmInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyAlgorithm();
    }
  });
  elements.stateInput.addEventListener("input", importFaceletString);
  elements.copyBtn.addEventListener("click", copySolution);
  elements.prevStepBtn.addEventListener("click", () => stepPlayback(appState.playbackStep - 1));
  elements.nextStepBtn.addEventListener("click", () => stepPlayback(appState.playbackStep + 1));
  elements.playBtn.addEventListener("click", togglePlayback);
}

function onSelectFace(face: Face) {
  appState = reduceAppState(appState, { type: "select-face", face });
  renderAll(elements, appState, preview, !!playTimer, { onSelectFace, onPaint });
}

function paintSticker(index: number) {
  stopPlayback();
  appState = reduceAppState(appState, { type: "paint-sticker", index });
  renderFaceletState(elements, appState, preview, !!playTimer, { onPaint }, { colorBalance: true });
  setStatus(elements, "Sticker updated", "neutral");
}

function onPaint(index: number) {
  paintSticker(index);
}

function setFacelets(nextFacelets: Face[], options: { clearSolution?: boolean } = {}) {
  appState = reduceAppState(appState, {
    type: "replace-facelets",
    facelets: nextFacelets,
    clearSolution: options.clearSolution,
  });
}

function importFaceletString() {
  const parsed = parseFacelets(elements.stateInput.value);
  if (!parsed.ok) {
    setStatus(elements, parsed.message, "warn");
    return;
  }
  stopPlayback();
  setFacelets(parsed.facelets, { clearSolution: true });
  renderFaceletState(elements, appState, preview, !!playTimer, { onPaint }, { colorBalance: true });
  setStatus(elements, "Facelet string imported", "neutral");
}

function applyAlgorithm() {
  const algorithm = parseAlgorithm(elements.algorithmInput.value);
  if (!algorithm.ok) {
    setStatus(elements, algorithm.message, "warn");
    return;
  }

  const cube = makeCube(serializeFacelets(appState.facelets));
  if (!cube) {
    setStatus(elements, "Fix the cube colors before applying moves", "warn");
    return;
  }

  try {
    cube.move(algorithm.value);
    stopPlayback();
    setFacelets(faceletsFromCubeString(cube.asString()), { clearSolution: true });
    elements.algorithmInput.value = "";
    renderFaceletState(elements, appState, preview, !!playTimer, { onPaint });
    setStatus(elements, "Moves applied", "good");
  } catch {
    setStatus(elements, "That move notation is not supported", "warn");
  }
}

function scrambleCube() {
  const scramble = createScramble();
  const cube = new Cube();
  cube.move(scramble);
  stopPlayback();
  appState = reduceAppState(appState, {
    type: "replace-facelets",
    facelets: faceletsFromCubeString(cube.asString()),
    lastScramble: scramble,
    clearSolution: true,
  });
  renderFaceletState(elements, appState, preview, !!playTimer, { onPaint });
  setStatus(elements, "Scramble generated", "good");
}

async function solveCurrentState() {
  stopPlayback();
  const state = serializeFacelets(appState.facelets);
  const validation = validateFacelets(appState.facelets);
  if (!validation.ok) {
    setStatus(elements, validation.issues[0].message, "warn");
    return;
  }

  const cube = makeCube(state);
  if (!cube) {
    setStatus(elements, "The cube state could not be read", "bad");
    return;
  }

  try {
    elements.solveBtn.disabled = true;
    if (!cubeSolver.ready) {
      setStatus(elements, "Preparing solver tables", "neutral");
      await cubeSolver.initialize();
    }

    const result = cubeSolver.solve(state);
    appState = reduceAppState(appState, {
      type: "set-solution",
      base: state,
      moves: splitMoves(result.algorithm),
    });

    renderSolution(elements, appState, !!playTimer);
    updateStateLabels(elements, appState);

    if (appState.solutionMoves.length === 0) {
      setStatus(elements, "Cube is already solved", "good");
    } else {
      setStatus(
        elements,
        `Solved in ${appState.solutionMoves.length} moves (${result.durationMs} ms)`,
        "good",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The solver rejected this cube";
    setStatus(elements, message.includes("Error") ? "The cube appears impossible" : message, "bad");
  } finally {
    elements.solveBtn.disabled = false;
  }
}

function copySolution() {
  if (!appState.solutionMoves.length) {
    return;
  }
  const text = appState.solutionMoves.join(" ");
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(
      () => setStatus(elements, "Solution copied", "good"),
      () => setStatus(elements, text, "neutral"),
    );
  } else {
    setStatus(elements, text, "neutral");
  }
}

function stepPlayback(nextStep: number) {
  if (!appState.solutionMoves.length || !appState.solutionBase) {
    return;
  }
  appState = reduceAppState(appState, { type: "set-playback-step", step: nextStep });
  const cube = Cube.fromString(appState.solutionBase);
  const prefix = appState.solutionMoves.slice(0, appState.playbackStep).join(" ");
  if (prefix) {
    cube.move(prefix);
  }
  appState = reduceAppState(appState, {
    type: "replace-facelets",
    facelets: faceletsFromCubeString(cube.asString()),
    lastScramble: appState.lastScramble,
  });
  renderFaceletState(elements, appState, preview, !!playTimer, { onPaint });
  if (appState.playbackStep >= appState.solutionMoves.length) {
    stopPlayback();
    setStatus(elements, "Playback complete", "good");
  }
}

function togglePlayback() {
  if (!appState.solutionMoves.length) {
    return;
  }
  if (playTimer) {
    stopPlayback();
    return;
  }
  if (appState.playbackStep >= appState.solutionMoves.length) {
    stepPlayback(0);
  }
  playTimer = window.setInterval(() => stepPlayback(appState.playbackStep + 1), 520);
  renderSolution(elements, appState, !!playTimer);
}

function stopPlayback() {
  if (playTimer) {
    window.clearInterval(playTimer);
    playTimer = 0;
    renderSolution(elements, appState, !!playTimer);
  }
}

function makeCube(state: string) {
  try {
    return Cube.fromString(state);
  } catch {
    return null;
  }
}

startApp();
