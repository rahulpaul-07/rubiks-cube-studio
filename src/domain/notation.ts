const MOVE_PATTERN = /^[URFDLBMESxyzurfdlb](2|'|)?$/;

export type AlgorithmParseResult =
  | { ok: true; value: string; moves: string[] }
  | { ok: false; message: string };

export function splitMoves(value: string): string[] {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/) : [];
}

export function parseAlgorithm(value: string): AlgorithmParseResult {
  const moves = splitMoves(value);

  if (moves.length === 0) {
    return { ok: false, message: "Enter one or more moves first" };
  }

  const unsupportedMove = moves.find((move) => !MOVE_PATTERN.test(move));
  if (unsupportedMove) {
    return { ok: false, message: `Unsupported move: ${unsupportedMove}` };
  }

  return {
    ok: true,
    value: moves.join(" "),
    moves,
  };
}
