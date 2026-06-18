declare module "cubejs" {
  type CubeState = {
    center: number[];
    cp: number[];
    co: number[];
    ep: number[];
    eo: number[];
  };

  export default class Cube {
    constructor(state?: Cube | CubeState);
    init(state: Cube | CubeState): void;
    identity(): void;
    toJSON(): CubeState;
    asString(): string;
    clone(): Cube;
    randomize(): Cube;
    isSolved(): boolean;
    move(algorithm: string | number | number[]): Cube;
    solve(maxDepth?: number): string;
    static fromString(facelets: string): Cube;
    static random(): Cube;
    static inverse(algorithm: string | number | number[]): string | number[];
    static initSolver(): void;
  }
}

declare module "cubejs/lib/solve.js";
