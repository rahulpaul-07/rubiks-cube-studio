import "./styles/index.css";
import { createInitialState, reduceAppState } from "./app/state";
import { SOLVED_FACELETS, type Face } from "./domain/cube";
import { faceletsFromCubeString, parseFacelets, serializeFacelets } from "./domain/facelets";
import { parseAlgorithm, splitMoves } from "./domain/notation";
import { createScramble } from "./domain/scramble";
import { validateFacelets } from "./domain/validation";
import { CubePreview } from "./rendering/CubePreview";
import { invertMove } from "./rendering/moveRotation";
import { cubeSolver } from "./solver/cubejsSolver";
import { CubeScanner } from "./scan/CubeScanner";
import { getAppElements, getAppRoot } from "./ui/dom";
import { renderAppTemplate } from "./ui/template";
import {
  renderAll,
  renderFaceletState,
  renderNet,
  renderSolution,
  renderStateInput,
  setStatus,
  updateStateLabels,
} from "./ui/view";
import Cube from "cubejs";

const TURN_DURATION_MS = 320;
const PLAYBACK_GAP_MS = 90;

renderAppTemplate(getAppRoot());
const elements = getAppElements();

let appState = createInitialState();
let playing = false;
let animating = false;
let preview: CubePreview;
let scanner: CubeScanner | null = null;

type Stage = "scan" | "verify" | "solve" | "play";
const STAGE_ORDER: readonly Stage[] = ["scan", "verify", "solve", "play"];

function setStage(next: Stage) {
  const activeIndex = STAGE_ORDER.indexOf(next);
  elements.wizard.querySelectorAll<HTMLElement>(".wizard-step").forEach((el) => {
    const index = STAGE_ORDER.indexOf(el.dataset.stage as Stage);
    el.classList.toggle("active", index === activeIndex);
    el.classList.toggle("done", index < activeIndex);
  });
}

function startApp() {
  window.addEventListener("error", (e) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled application error:", e.error);
    const statusPill = document.getElementById("statusPill");
    if (statusPill) {
      statusPill.textContent = "Application Error";
      statusPill.className = "status-pill bad";
    }
  });

  preview = new CubePreview(elements.preview);
  preview.setTurnDuration(TURN_DURATION_MS);
  renderAll(elements, appState, preview, playing, { onSelectFace, onPaint }, "Ready", "neutral");
  setStage("scan");
  bindEvents();
  window.addEventListener("pagehide", disposeApp, { once: true });

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => {
      void cubeSolver.initialize();
    });
  } else {
    setTimeout(() => {
      void cubeSolver.initialize();
    }, 1000);
  }
}

function disposeApp() {
  stopPlayback();
  preview.dispose();
}

function bindEvents() {
  elements.scanBtn.addEventListener("click", openScanner);
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
      playing,
      { onSelectFace, onPaint },
      "Reset to solved",
      "neutral",
    );
    setStage("scan");
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
  elements.prevStepBtn.addEventListener("click", () => void stepBackward());
  elements.nextStepBtn.addEventListener("click", () => void stepForward());
  elements.playBtn.addEventListener("click", togglePlayback);

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    switch (event.key) {
      case " ":
        event.preventDefault();
        togglePlayback();
        break;
      case "ArrowLeft":
        void stepBackward();
        break;
      case "ArrowRight":
        void stepForward();
        break;
      case "s":
      case "S":
        if (!elements.solveBtn.disabled) {
          void solveCurrentState();
        }
        break;
      case "r":
      case "R":
        scrambleCube();
        break;
    }
  });
}

function openScanner() {
  stopPlayback();
  scanner = new CubeScanner({
    onComplete: (facelets) => {
      scanner = null;
      setFacelets(facelets, { clearSolution: true });
      renderAll(
        elements,
        appState,
        preview,
        playing,
        { onSelectFace, onPaint },
        "Scanned - verify the colors, then Solve",
        "good",
      );
      setStage("verify");
    },
    onCancel: () => {
      scanner = null;
    },
  });
  void scanner.open();
}

function onSelectFace(face: Face) {
  appState = reduceAppState(appState, { type: "select-face", face });
  renderAll(elements, appState, preview, playing, { onSelectFace, onPaint });
}

function paintSticker(index: number) {
  stopPlayback();
  appState = reduceAppState(appState, { type: "paint-sticker", index });
  renderFaceletState(elements, appState, preview, playing, { onPaint }, { colorBalance: true });
  setStage("verify");
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
  renderFaceletState(elements, appState, preview, playing, { onPaint }, { colorBalance: true });
  setStage("verify");
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
    renderFaceletState(elements, appState, preview, playing, { onPaint });
    setStage("verify");
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
  renderFaceletState(elements, appState, preview, playing, { onPaint });
  setStage("verify");
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

    renderSolution(elements, appState, playing);
    updateStateLabels(elements, appState);
    setStage("solve");

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

/**
 * Recomputes the facelet array for the current playback step and refreshes the
 * 2D editor, textarea, and status labels -- without rebuilding the animated
 * 3D preview, whose cubies are already in the correct positions from the turn
 * that just played.
 */
function syncFaceletsToStep() {
  if (!appState.solutionBase) {
    return;
  }
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
  renderNet(elements, appState, onPaint);
  renderStateInput(elements, appState);
  updateStateLabels(elements, appState);
}

async function stepForward() {
  if (animating || !appState.solutionMoves.length) {
    return;
  }
  if (appState.playbackStep >= appState.solutionMoves.length) {
    return;
  }
  const token = appState.solutionMoves[appState.playbackStep];
  animating = true;
  setStage("play");
  appState = reduceAppState(appState, {
    type: "set-playback-step",
    step: appState.playbackStep + 1,
  });
  renderSolution(elements, appState, playing);
  await preview.animateMove(token);
  syncFaceletsToStep();
  animating = false;
  if (!playing && appState.playbackStep >= appState.solutionMoves.length) {
    setStatus(elements, "Playback complete", "good");
  }
}

async function stepBackward() {
  if (animating || appState.playbackStep <= 0) {
    return;
  }
  const token = invertMove(appState.solutionMoves[appState.playbackStep - 1]);
  animating = true;
  appState = reduceAppState(appState, {
    type: "set-playback-step",
    step: appState.playbackStep - 1,
  });
  renderSolution(elements, appState, playing);
  await preview.animateMove(token);
  syncFaceletsToStep();
  animating = false;
}

function jumpToStep(step: number) {
  if (!appState.solutionMoves.length || !appState.solutionBase) {
    return;
  }
  appState = reduceAppState(appState, { type: "set-playback-step", step });
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
  renderFaceletState(elements, appState, preview, playing, { onPaint });
}

function togglePlayback() {
  if (!appState.solutionMoves.length) {
    return;
  }
  if (playing) {
    stopPlayback();
    return;
  }
  if (appState.playbackStep >= appState.solutionMoves.length) {
    jumpToStep(0);
  }
  playing = true;
  setStage("play");
  renderSolution(elements, appState, playing);
  void runPlayLoop();
}

async function runPlayLoop() {
  while (playing && appState.playbackStep < appState.solutionMoves.length) {
    await stepForward();
    if (!playing) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, PLAYBACK_GAP_MS));
  }
  if (appState.playbackStep >= appState.solutionMoves.length) {
    playing = false;
    renderSolution(elements, appState, playing);
    setStatus(elements, "Playback complete", "good");
  }
}

function stopPlayback() {
  if (playing) {
    playing = false;
    renderSolution(elements, appState, playing);
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
