export type SolveResult = {
  algorithm: string;
  durationMs: number;
};

export interface SolverService {
  readonly ready: boolean;
  initialize(): Promise<void>;
  solve(facelets: string): SolveResult;
}

export interface AsyncSolverService {
  readonly ready: boolean;
  initialize(): Promise<void>;
  solve(facelets: string): Promise<SolveResult>;
}
