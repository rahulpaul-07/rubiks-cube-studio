import {
  Check,
  ChevronLeft,
  ChevronRight,
  createElement,
  Play,
  RefreshCcw,
  Rotate3D,
  Send,
  Shuffle,
  Sparkles,
  SquarePen,
} from "lucide";

export function renderAppTemplate(root: HTMLElement): void {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">3x3 cube solver</p>
          <h1>Rubik's Cube Studio</h1>
        </div>
        <div class="status-pill" id="statusPill" role="status" aria-live="polite">Ready</div>
      </header>

      <main class="workspace">
        <section class="panel preview-panel" aria-label="Cube preview">
          <div class="panel-heading">
            <div>
              <p class="eyebrow">Live preview</p>
              <h2>Interactive cube</h2>
            </div>
            <button class="icon-btn" id="resetViewBtn" type="button" title="Reset 3D view" aria-label="Reset 3D view">
              ${createIcon(Rotate3D, 18)}
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
            <button class="btn primary" id="solveBtn" type="button">${createLabeledIcon(Sparkles, "Solve")}</button>
            <button class="btn" id="scrambleBtn" type="button">${createLabeledIcon(Shuffle, "Scramble")}</button>
            <button class="btn" id="validateBtn" type="button">${createLabeledIcon(Check, "Validate")}</button>
            <button class="btn" id="resetBtn" type="button">${createLabeledIcon(RefreshCcw, "Reset")}</button>
          </div>

          <label class="field">
            <span>Move notation</span>
            <div class="inline-field">
              <input id="algorithmInput" autocomplete="off" spellcheck="false" placeholder="R U R' U'" />
              <button class="icon-btn solid" id="applyAlgorithmBtn" type="button" title="Apply moves" aria-label="Apply moves">
                ${createIcon(Send, 17)}
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
                ${createIcon(SquarePen, 17)}
              </button>
            </div>
            <div class="solution-moves" id="solutionMoves">Create or enter a scramble, then solve.</div>
            <div class="playback">
              <button class="icon-btn" id="prevStepBtn" type="button" title="Previous move" aria-label="Previous move">
                ${createIcon(ChevronLeft, 18)}
              </button>
              <button class="icon-btn solid" id="playBtn" type="button" title="Play solution" aria-label="Play solution">
                ${createIcon(Play, 18)}
              </button>
              <button class="icon-btn" id="nextStepBtn" type="button" title="Next move" aria-label="Next move">
                ${createIcon(ChevronRight, 18)}
              </button>
              <div class="progress-track" aria-hidden="true"><div id="progressFill"></div></div>
              <span id="stepLabel">0 / 0</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `;
}

function createIcon(node: Parameters<typeof createElement>[0], size: number): string {
  return createElement(node, {
    width: size,
    height: size,
    "aria-hidden": "true",
  }).outerHTML;
}

function createLabeledIcon(node: Parameters<typeof createElement>[0], label: string): string {
  return `${createIcon(node, 18)}<span>${label}</span>`;
}
