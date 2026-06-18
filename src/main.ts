import "./styles.css";
import { createInitialState, reduceAppState } from "./app/state";
import { FACES, FACE_NAMES, SOLVED_FACELETS, STICKERS_PER_FACE, type Face } from "./domain/cube";
import { faceletsFromCubeString, parseFacelets, serializeFacelets } from "./domain/facelets";
import { parseAlgorithm, splitMoves } from "./domain/notation";
import { createScramble } from "./domain/scramble";
import { countFacelets, validateFacelets } from "./domain/validation";
import { cubeSolver } from "./solver/cubejsSolver";
import { getAppElements, getAppRoot } from "./ui/dom";
import { renderAppTemplate } from "./ui/template";
import { createElement, Pause, Play } from "lucide";
import Cube from "cubejs";
import * as THREE from "three";

type Tone = "neutral" | "good" | "warn" | "bad";

const FACE_COLORS: Record<Face, string> = {
  U: "#f8fafc",
  R: "#e9413a",
  F: "#21b36b",
  D: "#f5c84c",
  L: "#f28a2e",
  B: "#3667d6",
};

const FACE_TEXT: Record<Face, string> = {
  U: "#111827",
  R: "#ffffff",
  F: "#ffffff",
  D: "#1f2937",
  L: "#111827",
  B: "#ffffff",
};

renderAppTemplate(getAppRoot());
const elements = getAppElements();

let appState = createInitialState();
let playTimer = 0;
let preview: CubePreview;

function startApp() {
  preview = new CubePreview(elements.preview);
  renderPalette();
  renderAll("Ready", "neutral");
  bindEvents();
}

function bindEvents() {
  elements.solveBtn.addEventListener("click", () => {
    void solveCurrentState();
  });
  elements.scrambleBtn.addEventListener("click", scrambleCube);
  elements.validateBtn.addEventListener("click", () => {
    const validation = validateFacelets(appState.facelets);
    setStatus(
      validation.ok ? "Looks valid" : validation.issues[0].message,
      validation.ok ? "good" : "warn",
    );
  });
  elements.resetBtn.addEventListener("click", () => {
    stopPlayback();
    setFacelets(faceletsFromCubeString(SOLVED_FACELETS), { clearSolution: true });
    renderAll("Reset to solved", "neutral");
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

function renderAll(message?: string, tone: Tone = "neutral") {
  renderNet();
  renderColorBalance();
  renderStateInput();
  renderSolution();
  preview.update(appState.facelets);
  updateStateLabels();
  if (message) {
    setStatus(message, tone);
  }
}

function renderPalette() {
  elements.palette.innerHTML = "";
  for (const face of FACES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch-btn";
    button.dataset.face = face;
    button.ariaPressed = String(face === appState.selectedFace);
    button.innerHTML = `<span class="swatch" style="--swatch:${FACE_COLORS[face]}"></span><span>${face}</span>`;
    button.title = `${FACE_NAMES[face]} color`;
    button.addEventListener("click", () => {
      appState = reduceAppState(appState, { type: "select-face", face });
      renderPalette();
    });
    elements.palette.appendChild(button);
  }
}

function renderNet() {
  elements.faceNet.innerHTML = "";
  for (const face of FACES) {
    const faceIndex = FACES.indexOf(face);
    const facePanel = document.createElement("div");
    facePanel.className = `face face-${face}`;
    facePanel.setAttribute("aria-label", `${FACE_NAMES[face]} face`);
    facePanel.innerHTML = `<div class="face-title">${face}</div>`;

    const grid = document.createElement("div");
    grid.className = "stickers";

    for (let localIndex = 0; localIndex < STICKERS_PER_FACE; localIndex += 1) {
      const globalIndex = faceIndex * STICKERS_PER_FACE + localIndex;
      const stickerFace = appState.facelets[globalIndex];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sticker";
      button.style.setProperty("--sticker", FACE_COLORS[stickerFace]);
      button.style.setProperty("--sticker-text", FACE_TEXT[stickerFace]);
      button.textContent = stickerFace;
      button.ariaLabel = `${FACE_NAMES[face]} sticker ${localIndex + 1}, ${FACE_NAMES[stickerFace]} color`;
      if (localIndex === 4) {
        button.disabled = true;
        button.title = "Centers are fixed on a 3x3 cube";
      } else {
        button.addEventListener("click", () => paintSticker(globalIndex));
      }
      grid.appendChild(button);
    }

    facePanel.appendChild(grid);
    elements.faceNet.appendChild(facePanel);
  }
}

function renderColorBalance() {
  const counts = countFacelets(appState.facelets);
  elements.colorBalance.innerHTML = FACES.map((face) => {
    const ok = counts[face] === STICKERS_PER_FACE;
    return `
      <div class="count ${ok ? "ok" : "warn"}">
        <span class="mini-swatch" style="--swatch:${FACE_COLORS[face]}"></span>
        <span>${face}</span>
        <strong>${counts[face]}</strong>
      </div>
    `;
  }).join("");
}

function renderStateInput() {
  const state = serializeFacelets(appState.facelets);
  if (elements.stateInput.value !== state) {
    elements.stateInput.value = state;
  }
}

function renderSolution() {
  const moveCount = appState.solutionMoves.length;
  elements.solutionTitle.textContent = moveCount ? `${moveCount} move solution` : "No solve yet";
  elements.solutionMoves.innerHTML = moveCount
    ? appState.solutionMoves
        .map(
          (move, index) =>
            `<span class="move-chip ${index < appState.playbackStep ? "done" : ""}">${move}</span>`,
        )
        .join("")
    : "Create or enter a scramble, then solve.";

  elements.prevStepBtn.disabled = !moveCount || appState.playbackStep <= 0;
  elements.nextStepBtn.disabled = !moveCount || appState.playbackStep >= moveCount;
  elements.playBtn.disabled = !moveCount;
  elements.copyBtn.disabled = !moveCount;
  elements.stepLabel.textContent = `${appState.playbackStep} / ${moveCount}`;
  elements.progressFill.style.width = moveCount
    ? `${(appState.playbackStep / moveCount) * 100}%`
    : "0%";

  const playIcon = playTimer ? Pause : Play;
  elements.playBtn.innerHTML = createElement(playIcon, {
    width: 18,
    height: 18,
    "aria-hidden": "true",
  }).outerHTML;
  elements.playBtn.ariaLabel = playTimer ? "Pause solution" : "Play solution";
}

function updateStateLabels() {
  const validation = validateFacelets(appState.facelets);
  const cubeSolved = validation.ok && makeCube(serializeFacelets(appState.facelets))?.isSolved();
  elements.stateLabel.textContent = cubeSolved
    ? "Solved state"
    : validation.ok
      ? "Solvable input shape"
      : "Needs attention";
  elements.moveCountLabel.textContent = appState.lastScramble
    ? `Scramble: ${appState.lastScramble}`
    : `${appState.solutionMoves.length || 0} moves`;
}

function paintSticker(index: number) {
  stopPlayback();
  appState = reduceAppState(appState, { type: "paint-sticker", index });
  renderAll("Sticker updated", "neutral");
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
    setStatus(parsed.message, "warn");
    return;
  }
  stopPlayback();
  setFacelets(parsed.facelets, { clearSolution: true });
  renderAll("Facelet string imported", "neutral");
}

function applyAlgorithm() {
  const algorithm = parseAlgorithm(elements.algorithmInput.value);
  if (!algorithm.ok) {
    setStatus(algorithm.message, "warn");
    return;
  }

  const cube = makeCube(serializeFacelets(appState.facelets));
  if (!cube) {
    setStatus("Fix the cube colors before applying moves", "warn");
    return;
  }

  try {
    cube.move(algorithm.value);
    stopPlayback();
    setFacelets(faceletsFromCubeString(cube.asString()), { clearSolution: true });
    elements.algorithmInput.value = "";
    renderAll("Moves applied", "good");
  } catch {
    setStatus("That move notation is not supported", "warn");
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
  renderAll("Scramble generated", "good");
}

async function solveCurrentState() {
  stopPlayback();
  const state = serializeFacelets(appState.facelets);
  const validation = validateFacelets(appState.facelets);
  if (!validation.ok) {
    setStatus(validation.issues[0].message, "warn");
    return;
  }

  const cube = makeCube(state);
  if (!cube) {
    setStatus("The cube state could not be read", "bad");
    return;
  }

  try {
    elements.solveBtn.disabled = true;
    if (!cubeSolver.ready) {
      setStatus("Preparing solver tables", "neutral");
      await cubeSolver.initialize();
    }

    const result = cubeSolver.solve(state);
    appState = reduceAppState(appState, {
      type: "set-solution",
      base: state,
      moves: splitMoves(result.algorithm),
    });

    if (appState.solutionMoves.length === 0) {
      renderAll("Cube is already solved", "good");
    } else {
      renderAll(
        `Solved in ${appState.solutionMoves.length} moves (${result.durationMs} ms)`,
        "good",
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The solver rejected this cube";
    setStatus(message.includes("Error") ? "The cube appears impossible" : message, "bad");
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
      () => setStatus("Solution copied", "good"),
      () => setStatus(text, "neutral"),
    );
  } else {
    setStatus(text, "neutral");
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
  renderAll();
  if (appState.playbackStep >= appState.solutionMoves.length) {
    stopPlayback();
    setStatus("Playback complete", "good");
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
  renderSolution();
}

function stopPlayback() {
  if (playTimer) {
    window.clearInterval(playTimer);
    playTimer = 0;
    renderSolution();
  }
}

function setStatus(message: string, tone: Tone) {
  elements.statusPill.textContent = message;
  elements.statusPill.dataset.tone = tone;
}

function makeCube(state: string) {
  try {
    return Cube.fromString(state);
  } catch {
    return null;
  }
}

class CubePreview {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  private readonly cubeGroup = new THREE.Group();
  private readonly stickerGroup = new THREE.Group();
  private readonly stickerGeometry = new THREE.PlaneGeometry(0.82, 0.82);
  private readonly materials = new Map<Face, THREE.MeshStandardMaterial>();
  private readonly boxMaterial = new THREE.MeshStandardMaterial({
    color: "#111827",
    roughness: 0.62,
    metalness: 0.04,
  });
  private drag = { active: false, x: 0, y: 0 };

  constructor(private readonly host: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.host.appendChild(this.renderer.domElement);
    this.camera.position.set(5.2, 4.4, 6.4);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.HemisphereLight("#ffffff", "#aeb7c9", 2.1));
    const keyLight = new THREE.DirectionalLight("#ffffff", 2.4);
    keyLight.position.set(4, 7, 5);
    this.scene.add(keyLight);

    this.cubeGroup.rotation.set(-0.46, 0.66, 0.04);
    this.cubeGroup.add(this.stickerGroup);
    this.scene.add(this.cubeGroup);
    this.createCubies();
    this.bindPointer();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.animate();
  }

  update(state: Face[]) {
    this.stickerGroup.clear();
    state.forEach((face, index) => {
      const placement = stickerPlacement(index);
      const sticker = new THREE.Mesh(this.stickerGeometry, this.getMaterial(face));
      sticker.position.set(placement.position[0], placement.position[1], placement.position[2]);
      sticker.rotation.set(placement.rotation[0], placement.rotation[1], placement.rotation[2]);
      this.stickerGroup.add(sticker);
    });
  }

  resetView() {
    this.cubeGroup.rotation.set(-0.46, 0.66, 0.04);
  }

  private createCubies() {
    const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const spacing = 1.04;

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const cubie = new THREE.Mesh(geometry, this.boxMaterial);
          cubie.position.set(x * spacing, y * spacing, z * spacing);
          this.cubeGroup.add(cubie);
        }
      }
    }
  }

  private getMaterial(face: Face) {
    const existing = this.materials.get(face);
    if (existing) {
      return existing;
    }
    const material = new THREE.MeshStandardMaterial({
      color: FACE_COLORS[face],
      roughness: 0.5,
      metalness: 0.02,
    });
    this.materials.set(face, material);
    return material;
  }

  private bindPointer() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", (event) => {
      this.drag = { active: true, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!this.drag.active) {
        return;
      }
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      this.cubeGroup.rotation.y += dx * 0.008;
      this.cubeGroup.rotation.x += dy * 0.008;
      this.drag.x = event.clientX;
      this.drag.y = event.clientY;
    });
    canvas.addEventListener("pointerup", () => {
      this.drag.active = false;
    });
    canvas.addEventListener("pointerleave", () => {
      this.drag.active = false;
    });
  }

  private resize() {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private animate = () => {
    window.requestAnimationFrame(this.animate);
    if (!this.drag.active) {
      this.cubeGroup.rotation.y += 0.002;
    }
    this.renderer.render(this.scene, this.camera);
  };
}

function stickerPlacement(index: number) {
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
        position: [x, surface, (row - 1) * spacing] as [number, number, number],
        rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
      };
    case "R":
      return {
        position: [surface, y, (1 - col) * spacing] as [number, number, number],
        rotation: [0, Math.PI / 2, 0] as [number, number, number],
      };
    case "F":
      return {
        position: [x, y, surface] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
      };
    case "D":
      return {
        position: [x, -surface, (1 - row) * spacing] as [number, number, number],
        rotation: [Math.PI / 2, 0, 0] as [number, number, number],
      };
    case "L":
      return {
        position: [-surface, y, (col - 1) * spacing] as [number, number, number],
        rotation: [0, -Math.PI / 2, 0] as [number, number, number],
      };
    case "B":
      return {
        position: [(1 - col) * spacing, y, -surface] as [number, number, number],
        rotation: [0, Math.PI, 0] as [number, number, number],
      };
  }
}

startApp();
