import type { AppState } from "../app/state";
import { FACES, FACE_NAMES, STICKERS_PER_FACE } from "../domain/cube";
import { FACE_COLORS, FACE_TEXT_COLORS } from "../domain/colors";
import { countFacelets, validateFacelets } from "../domain/validation";
import { serializeFacelets } from "../domain/facelets";
import type { AppElements } from "./dom";
import { createElement, Pause, Play } from "lucide";
import Cube from "cubejs";
import type { CubePreview } from "../rendering/CubePreview";

export type Tone = "neutral" | "good" | "warn" | "bad";

export function renderPalette(elements: AppElements, selectedFace: string, onSelect: (face: any) => void) {
  elements.palette.innerHTML = "";
  for (const face of FACES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch-btn";
    button.dataset.face = face;
    button.ariaPressed = String(face === selectedFace);
    button.innerHTML = `<span class="swatch" style="--swatch:${FACE_COLORS[face as keyof typeof FACE_COLORS]}"></span><span>${face}</span>`;
    button.title = `${FACE_NAMES[face as keyof typeof FACE_NAMES]} color`;
    button.addEventListener("click", () => onSelect(face));
    elements.palette.appendChild(button);
  }
}

export function renderNet(elements: AppElements, appState: AppState, onPaint: (index: number) => void) {
  elements.faceNet.innerHTML = "";
  for (const face of FACES) {
    const faceIndex = FACES.indexOf(face);
    const facePanel = document.createElement("div");
    facePanel.className = `face face-${face}`;
    facePanel.setAttribute("aria-label", `${FACE_NAMES[face as keyof typeof FACE_NAMES]} face`);
    facePanel.innerHTML = `<div class="face-title">${face}</div>`;

    const grid = document.createElement("div");
    grid.className = "stickers";

    for (let localIndex = 0; localIndex < STICKERS_PER_FACE; localIndex += 1) {
      const globalIndex = faceIndex * STICKERS_PER_FACE + localIndex;
      const stickerFace = appState.facelets[globalIndex];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sticker";
      button.style.setProperty("--sticker", FACE_COLORS[stickerFace as keyof typeof FACE_COLORS]);
      button.style.setProperty("--sticker-text", FACE_TEXT_COLORS[stickerFace as keyof typeof FACE_TEXT_COLORS]);
      button.textContent = stickerFace;
      button.ariaLabel = `${FACE_NAMES[face as keyof typeof FACE_NAMES]} sticker ${localIndex + 1}, ${FACE_NAMES[stickerFace as keyof typeof FACE_NAMES]} color`;
      if (localIndex === 4) {
        button.disabled = true;
        button.title = "Centers are fixed on a 3x3 cube";
      } else {
        button.addEventListener("click", () => onPaint(globalIndex));
      }
      grid.appendChild(button);
    }

    facePanel.appendChild(grid);
    elements.faceNet.appendChild(facePanel);
  }
}

export function renderColorBalance(elements: AppElements, appState: AppState) {
  const counts = countFacelets(appState.facelets);
  elements.colorBalance.innerHTML = FACES.map((face) => {
    const ok = counts[face] === STICKERS_PER_FACE;
    return `
      <div class="count ${ok ? "ok" : "warn"}">
        <span class="mini-swatch" style="--swatch:${FACE_COLORS[face as keyof typeof FACE_COLORS]}"></span>
        <span>${face}</span>
        <strong>${counts[face]}</strong>
      </div>
    `;
  }).join("");
}

export function renderStateInput(elements: AppElements, appState: AppState) {
  const state = serializeFacelets(appState.facelets);
  if (elements.stateInput.value !== state) {
    elements.stateInput.value = state;
  }
}

export function renderSolution(elements: AppElements, appState: AppState, isPlaying: boolean) {
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

  const playIcon = isPlaying ? Pause : Play;
  elements.playBtn.innerHTML = createElement(playIcon, {
    width: 18,
    height: 18,
    "aria-hidden": "true",
  }).outerHTML;
  elements.playBtn.ariaLabel = isPlaying ? "Pause solution" : "Play solution";
}

export function updateStateLabels(elements: AppElements, appState: AppState) {
  const validation = validateFacelets(appState.facelets);
  const stateStr = serializeFacelets(appState.facelets);
  let cubeSolved = false;
  
  if (validation.ok) {
    try {
      cubeSolved = Cube.fromString(stateStr).isSolved();
    } catch {
      cubeSolved = false;
    }
  }

  elements.stateLabel.textContent = cubeSolved
    ? "Solved state"
    : validation.ok
      ? "Solvable input shape"
      : "Needs attention";
  elements.moveCountLabel.textContent = appState.lastScramble
    ? `Scramble: ${appState.lastScramble}`
    : `${appState.solutionMoves.length || 0} moves`;
}

export function setStatus(elements: AppElements, message: string, tone: Tone) {
  elements.statusPill.textContent = message;
  elements.statusPill.dataset.tone = tone;
}

export function renderAll(
  elements: AppElements, 
  appState: AppState, 
  preview: CubePreview,
  isPlaying: boolean,
  handlers: { onSelectFace: (face: any) => void; onPaint: (index: number) => void },
  message?: string, 
  tone: Tone = "neutral"
) {
  renderPalette(elements, appState.selectedFace, handlers.onSelectFace);
  renderNet(elements, appState, handlers.onPaint);
  renderColorBalance(elements, appState);
  renderStateInput(elements, appState);
  renderSolution(elements, appState, isPlaying);
  preview.update(appState.facelets);
  updateStateLabels(elements, appState);
  if (message) {
    setStatus(elements, message, tone);
  }
}

export function renderFaceletState(
  elements: AppElements, 
  appState: AppState, 
  preview: CubePreview,
  isPlaying: boolean,
  handlers: { onPaint: (index: number) => void },
  options: { colorBalance?: boolean } = {}
) {
  renderNet(elements, appState, handlers.onPaint);
  if (options.colorBalance) {
    renderColorBalance(elements, appState);
  }
  renderStateInput(elements, appState);
  renderSolution(elements, appState, isPlaying);
  preview.update(appState.facelets);
  updateStateLabels(elements, appState);
}
