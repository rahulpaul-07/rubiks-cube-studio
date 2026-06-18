import "./styles.css";
import {
  FACES,
  FACE_NAMES,
  SOLVED_FACELETS,
  STICKERS_PER_FACE,
  TOTAL_FACELETS,
  type Face,
} from "./domain/cube";
import { faceletsFromCubeString, parseFacelets, serializeFacelets } from "./domain/facelets";
import { Cube, ensureSolverLoaded } from "./solver";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  createElement,
  Pause,
  Play,
  RefreshCcw,
  Rotate3D,
  Send,
  Shuffle,
  Sparkles,
  SquarePen,
} from "lucide";
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

const MOVE_PATTERN = /^[URFDLBMESxyzurfdlb](2|'|)?$/;
const SCRAMBLE_LENGTH = 24;

const icon = (node: unknown, label: string) => {
  const svg = createElement(node as Parameters<typeof createElement>[0], {
    width: 18,
    height: 18,
    "aria-hidden": "true",
  });
  return `${svg.outerHTML}<span>${label}</span>`;
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">3x3 cube solver</p>
        <h1>Rubik's Cube Studio</h1>
      </div>
      <div class="status-pill" id="statusPill">Ready</div>
    </header>

    <main class="workspace">
      <section class="panel preview-panel" aria-label="Cube preview">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Live preview</p>
            <h2>Interactive cube</h2>
          </div>
          <button class="icon-btn" id="resetViewBtn" type="button" title="Reset 3D view" aria-label="Reset 3D view">
            ${createElement(Rotate3D, { width: 18, height: 18, "aria-hidden": "true" }).outerHTML}
          </button>
        </div>
        <div class="preview-canvas" id="preview"></div>
        <div class="preview-footer">
          <span id="stateLabel">Solved state</span>
          <span id="moveCountLabel">0 moves</span>
        </div>
      </section>

      <section class="panel editor-panel" aria-label="Cube facelet editor">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Sticker editor</p>
            <h2>Paint the cube</h2>
          </div>
        </div>
        <div class="palette" id="palette" aria-label="Color palette"></div>
        <div class="face-net" id="faceNet"></div>
        <div class="color-balance" id="colorBalance"></div>
      </section>

      <section class="panel control-panel" aria-label="Solver controls">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Solve flow</p>
            <h2>Controls</h2>
          </div>
        </div>

        <div class="button-grid">
          <button class="btn primary" id="solveBtn" type="button">${icon(Sparkles, "Solve")}</button>
          <button class="btn" id="scrambleBtn" type="button">${icon(Shuffle, "Scramble")}</button>
          <button class="btn" id="validateBtn" type="button">${icon(Check, "Validate")}</button>
          <button class="btn" id="resetBtn" type="button">${icon(RefreshCcw, "Reset")}</button>
        </div>

        <label class="field">
          <span>Move notation</span>
          <div class="inline-field">
            <input id="algorithmInput" autocomplete="off" spellcheck="false" placeholder="R U R' U'" />
            <button class="icon-btn solid" id="applyAlgorithmBtn" type="button" title="Apply moves" aria-label="Apply moves">
              ${createElement(Send, { width: 17, height: 17, "aria-hidden": "true" }).outerHTML}
            </button>
          </div>
        </label>

        <label class="field">
          <span>Facelet string</span>
          <textarea id="stateInput" spellcheck="false" rows="3"></textarea>
        </label>

        <div class="solution-box">
          <div class="solution-header">
            <div>
              <p class="eyebrow">Solution</p>
              <h3 id="solutionTitle">No solve yet</h3>
            </div>
            <button class="icon-btn" id="copyBtn" type="button" title="Copy solution" aria-label="Copy solution">
              ${createElement(SquarePen, { width: 17, height: 17, "aria-hidden": "true" }).outerHTML}
            </button>
          </div>
          <div class="solution-moves" id="solutionMoves">Create or enter a scramble, then solve.</div>
          <div class="playback">
            <button class="icon-btn" id="prevStepBtn" type="button" title="Previous move" aria-label="Previous move">
              ${createElement(ChevronLeft, { width: 18, height: 18, "aria-hidden": "true" }).outerHTML}
            </button>
            <button class="icon-btn solid" id="playBtn" type="button" title="Play solution" aria-label="Play solution">
              ${createElement(Play, { width: 18, height: 18, "aria-hidden": "true" }).outerHTML}
            </button>
            <button class="icon-btn" id="nextStepBtn" type="button" title="Next move" aria-label="Next move">
              ${createElement(ChevronRight, { width: 18, height: 18, "aria-hidden": "true" }).outerHTML}
            </button>
            <div class="progress-track" aria-hidden="true"><div id="progressFill"></div></div>
            <span id="stepLabel">0 / 0</span>
          </div>
        </div>
      </section>
    </main>
  </div>
`;

const elements = {
  statusPill: must<HTMLDivElement>("#statusPill"),
  preview: must<HTMLDivElement>("#preview"),
  stateLabel: must<HTMLSpanElement>("#stateLabel"),
  moveCountLabel: must<HTMLSpanElement>("#moveCountLabel"),
  palette: must<HTMLDivElement>("#palette"),
  faceNet: must<HTMLDivElement>("#faceNet"),
  colorBalance: must<HTMLDivElement>("#colorBalance"),
  solveBtn: must<HTMLButtonElement>("#solveBtn"),
  scrambleBtn: must<HTMLButtonElement>("#scrambleBtn"),
  validateBtn: must<HTMLButtonElement>("#validateBtn"),
  resetBtn: must<HTMLButtonElement>("#resetBtn"),
  resetViewBtn: must<HTMLButtonElement>("#resetViewBtn"),
  algorithmInput: must<HTMLInputElement>("#algorithmInput"),
  applyAlgorithmBtn: must<HTMLButtonElement>("#applyAlgorithmBtn"),
  stateInput: must<HTMLTextAreaElement>("#stateInput"),
  solutionTitle: must<HTMLHeadingElement>("#solutionTitle"),
  solutionMoves: must<HTMLDivElement>("#solutionMoves"),
  copyBtn: must<HTMLButtonElement>("#copyBtn"),
  prevStepBtn: must<HTMLButtonElement>("#prevStepBtn"),
  playBtn: must<HTMLButtonElement>("#playBtn"),
  nextStepBtn: must<HTMLButtonElement>("#nextStepBtn"),
  progressFill: must<HTMLDivElement>("#progressFill"),
  stepLabel: must<HTMLSpanElement>("#stepLabel"),
};

let selectedFace: Face = "F";
let facelets = faceletsFromCubeString(SOLVED_FACELETS);
let solverReady = false;
let solutionBase = "";
let solutionMoves: string[] = [];
let playbackStep = 0;
let playTimer = 0;
let lastScramble = "";
let preview: CubePreview;

function startApp() {
  preview = new CubePreview(elements.preview);
  renderPalette();
  renderAll("Ready", "neutral");
  bindEvents();
}

function must<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing element: ${selector}`);
  }
  return node;
}

function bindEvents() {
  elements.solveBtn.addEventListener("click", () => {
    void solveCurrentState();
  });
  elements.scrambleBtn.addEventListener("click", scrambleCube);
  elements.validateBtn.addEventListener("click", () => {
    const validation = validateFacelets(facelets);
    setStatus(
      validation.ok ? "Looks valid" : validation.messages[0],
      validation.ok ? "good" : "warn",
    );
  });
  elements.resetBtn.addEventListener("click", () => {
    stopPlayback();
    lastScramble = "";
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
  elements.prevStepBtn.addEventListener("click", () => stepPlayback(playbackStep - 1));
  elements.nextStepBtn.addEventListener("click", () => stepPlayback(playbackStep + 1));
  elements.playBtn.addEventListener("click", togglePlayback);
}

function renderAll(message?: string, tone: Tone = "neutral") {
  renderNet();
  renderColorBalance();
  renderStateInput();
  renderSolution();
  preview.update(facelets);
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
    button.ariaPressed = String(face === selectedFace);
    button.innerHTML = `<span class="swatch" style="--swatch:${FACE_COLORS[face]}"></span><span>${face}</span>`;
    button.title = `${FACE_NAMES[face]} color`;
    button.addEventListener("click", () => {
      selectedFace = face;
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
      const stickerFace = facelets[globalIndex];
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
  const counts = countFacelets(facelets);
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
  const state = serializeFacelets(facelets);
  if (elements.stateInput.value !== state) {
    elements.stateInput.value = state;
  }
}

function renderSolution() {
  const moveCount = solutionMoves.length;
  elements.solutionTitle.textContent = moveCount ? `${moveCount} move solution` : "No solve yet";
  elements.solutionMoves.innerHTML = moveCount
    ? solutionMoves
        .map(
          (move, index) =>
            `<span class="move-chip ${index < playbackStep ? "done" : ""}">${move}</span>`,
        )
        .join("")
    : "Create or enter a scramble, then solve.";

  elements.prevStepBtn.disabled = !moveCount || playbackStep <= 0;
  elements.nextStepBtn.disabled = !moveCount || playbackStep >= moveCount;
  elements.playBtn.disabled = !moveCount;
  elements.copyBtn.disabled = !moveCount;
  elements.stepLabel.textContent = `${playbackStep} / ${moveCount}`;
  elements.progressFill.style.width = moveCount ? `${(playbackStep / moveCount) * 100}%` : "0%";

  const playIcon = playTimer ? Pause : Play;
  elements.playBtn.innerHTML = createElement(playIcon, {
    width: 18,
    height: 18,
    "aria-hidden": "true",
  }).outerHTML;
  elements.playBtn.ariaLabel = playTimer ? "Pause solution" : "Play solution";
}

function updateStateLabels() {
  const validation = validateFacelets(facelets);
  const cubeSolved = validation.ok && makeCube(serializeFacelets(facelets))?.isSolved();
  elements.stateLabel.textContent = cubeSolved
    ? "Solved state"
    : validation.ok
      ? "Solvable input shape"
      : "Needs attention";
  elements.moveCountLabel.textContent = lastScramble
    ? `Scramble: ${lastScramble}`
    : `${solutionMoves.length || 0} moves`;
}

function paintSticker(index: number) {
  stopPlayback();
  facelets[index] = selectedFace;
  lastScramble = "";
  clearSolution();
  renderAll("Sticker updated", "neutral");
}

function setFacelets(nextFacelets: Face[], options: { clearSolution?: boolean } = {}) {
  facelets = nextFacelets;
  if (options.clearSolution) {
    clearSolution();
  }
}

function importFaceletString() {
  const parsed = parseFacelets(elements.stateInput.value);
  if (!parsed.ok) {
    setStatus(parsed.message, "warn");
    return;
  }
  stopPlayback();
  lastScramble = "";
  setFacelets(parsed.facelets, { clearSolution: true });
  renderAll("Facelet string imported", "neutral");
}

function applyAlgorithm() {
  const algorithm = normalizeAlgorithm(elements.algorithmInput.value);
  if (!algorithm.ok) {
    setStatus(algorithm.message, "warn");
    return;
  }

  const cube = makeCube(serializeFacelets(facelets));
  if (!cube) {
    setStatus("Fix the cube colors before applying moves", "warn");
    return;
  }

  try {
    cube.move(algorithm.value);
    stopPlayback();
    lastScramble = "";
    setFacelets(faceletsFromCubeString(cube.asString()), { clearSolution: true });
    elements.algorithmInput.value = "";
    renderAll("Moves applied", "good");
  } catch {
    setStatus("That move notation is not supported", "warn");
  }
}

function scrambleCube() {
  const scramble = createScramble(SCRAMBLE_LENGTH);
  const cube = new Cube();
  cube.move(scramble);
  stopPlayback();
  lastScramble = scramble;
  setFacelets(faceletsFromCubeString(cube.asString()), { clearSolution: true });
  renderAll("Scramble generated", "good");
}

async function solveCurrentState() {
  stopPlayback();
  const state = serializeFacelets(facelets);
  const validation = validateFacelets(facelets);
  if (!validation.ok) {
    setStatus(validation.messages[0], "warn");
    return;
  }

  const cube = makeCube(state);
  if (!cube) {
    setStatus("The cube state could not be read", "bad");
    return;
  }

  try {
    elements.solveBtn.disabled = true;
    if (!solverReady) {
      setStatus("Preparing solver tables", "neutral");
      await ensureSolverLoaded();
      Cube.initSolver();
      solverReady = true;
    }

    const start = performance.now();
    const solution = cube.solve();
    const elapsed = Math.max(1, Math.round(performance.now() - start));
    solutionBase = state;
    solutionMoves = splitMoves(solution);
    playbackStep = 0;

    if (solutionMoves.length === 0) {
      renderAll("Cube is already solved", "good");
    } else {
      renderAll(`Solved in ${solutionMoves.length} moves (${elapsed} ms)`, "good");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The solver rejected this cube";
    setStatus(message.includes("Error") ? "The cube appears impossible" : message, "bad");
  } finally {
    elements.solveBtn.disabled = false;
  }
}

function copySolution() {
  if (!solutionMoves.length) {
    return;
  }
  const text = solutionMoves.join(" ");
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
  if (!solutionMoves.length || !solutionBase) {
    return;
  }
  playbackStep = Math.max(0, Math.min(solutionMoves.length, nextStep));
  const cube = Cube.fromString(solutionBase);
  const prefix = solutionMoves.slice(0, playbackStep).join(" ");
  if (prefix) {
    cube.move(prefix);
  }
  facelets = faceletsFromCubeString(cube.asString());
  renderAll();
  if (playbackStep >= solutionMoves.length) {
    stopPlayback();
    setStatus("Playback complete", "good");
  }
}

function togglePlayback() {
  if (!solutionMoves.length) {
    return;
  }
  if (playTimer) {
    stopPlayback();
    return;
  }
  if (playbackStep >= solutionMoves.length) {
    stepPlayback(0);
  }
  playTimer = window.setInterval(() => stepPlayback(playbackStep + 1), 520);
  renderSolution();
}

function stopPlayback() {
  if (playTimer) {
    window.clearInterval(playTimer);
    playTimer = 0;
    renderSolution();
  }
}

function clearSolution() {
  stopPlayback();
  solutionBase = "";
  solutionMoves = [];
  playbackStep = 0;
}

function setStatus(message: string, tone: Tone) {
  elements.statusPill.textContent = message;
  elements.statusPill.dataset.tone = tone;
}

function validateFacelets(state: Face[]) {
  const messages: string[] = [];
  if (state.length !== TOTAL_FACELETS) {
    messages.push(`A 3x3 cube needs ${TOTAL_FACELETS} stickers`);
  }
  const counts = countFacelets(state);
  for (const face of FACES) {
    if (counts[face] !== STICKERS_PER_FACE) {
      messages.push(
        `${FACE_NAMES[face]} color has ${counts[face]} stickers, expected ${STICKERS_PER_FACE}`,
      );
    }
  }
  for (const face of FACES) {
    const centerIndex = FACES.indexOf(face) * STICKERS_PER_FACE + 4;
    if (state[centerIndex] !== face) {
      messages.push(`${FACE_NAMES[face]} center must stay ${face}`);
    }
  }
  return {
    ok: messages.length === 0,
    messages,
  };
}

function countFacelets(state: Face[]) {
  return state.reduce<Record<Face, number>>(
    (acc, face) => {
      acc[face] += 1;
      return acc;
    },
    { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 },
  );
}

function makeCube(state: string) {
  try {
    return Cube.fromString(state);
  } catch {
    return null;
  }
}

function normalizeAlgorithm(
  value: string,
): { ok: true; value: string } | { ok: false; message: string } {
  const tokens = splitMoves(value);
  if (!tokens.length) {
    return { ok: false, message: "Enter one or more moves first" };
  }
  const badMove = tokens.find((move) => !MOVE_PATTERN.test(move));
  if (badMove) {
    return { ok: false, message: `Unsupported move: ${badMove}` };
  }
  return { ok: true, value: tokens.join(" ") };
}

function splitMoves(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((move) => move.trim())
    .filter(Boolean);
}

function createScramble(length: number) {
  const suffixes = ["", "'", "2"];
  const moves: string[] = [];
  let previousFace = "";

  while (moves.length < length) {
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    if (face === previousFace) {
      continue;
    }
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    moves.push(`${face}${suffix}`);
    previousFace = face;
  }

  return moves.join(" ");
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
