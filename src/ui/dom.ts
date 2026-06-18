export type AppElements = ReturnType<typeof getAppElements>;

export function getAppRoot(): HTMLDivElement {
  return must<HTMLDivElement>("#app");
}

export function getAppElements() {
  return {
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
}

function must<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) {
    throw new Error(`Missing element: ${selector}`);
  }
  return node;
}
