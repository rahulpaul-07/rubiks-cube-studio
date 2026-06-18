export type SolveResult = {
  algorithm: string;
  durationMs: number;
};

export interface SolverService {
  readonly ready: boolean;
  initialize(): Promise<void>;
  solve(facelets: string): SolveResult;
}
