/* eslint-disable no-console */
import {
  applyToken,
  cubieToFacelet,
  faceletToCubie,
  solvedCubie,
  SOLVED_STRING,
} from "./twophase/cube";
import { buildTables } from "./twophase/tables";
import { solveFacelets } from "./twophase/search";

/**
 * Standalone benchmark for the two-phase solver.
 * Run with: `npm run benchmark [count] [maxTimeMs]`
 */
const FACES = ["U", "R", "F", "D", "L", "B"];
const SUFFIX = ["", "2", "'"];

function randomScramble(length: number): string {
  const moves: string[] = [];
  let prev = -1;
  for (let i = 0; i < length; i += 1) {
    let face = Math.floor(Math.random() * 6);
    while (face === prev) face = Math.floor(Math.random() * 6);
    prev = face;
    moves.push(FACES[face] + SUFFIX[Math.floor(Math.random() * 3)]);
  }
  return moves.join(" ");
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function main(): void {
  const count = Number(process.argv[2] ?? 2000);
  const maxTimeMs = Number(process.argv[3] ?? 200);

  console.log(`Building solver tables...`);
  const t0 = performance.now();
  const tables = buildTables();
  console.log(`Tables built in ${(performance.now() - t0).toFixed(0)}ms\n`);

  console.log(`Solving ${count} random cubes (budget ${maxTimeMs}ms each)...`);
  const lengths: number[] = [];
  const times: number[] = [];
  const histogram: Record<number, number> = {};
  let solved = 0;
  let failed = 0;

  for (let i = 0; i < count; i += 1) {
    let cube = solvedCubie();
    for (const move of randomScramble(25).split(" ")) cube = applyToken(cube, move);
    const facelet = cubieToFacelet(cube);

    const start = performance.now();
    const result = solveFacelets(facelet, tables, { maxTimeMs });
    times.push(performance.now() - start);

    if (!result) {
      failed += 1;
      continue;
    }
    let check = faceletToCubie(facelet);
    for (const move of result.moves) check = applyToken(check, move);
    if (cubieToFacelet(check) === SOLVED_STRING) {
      solved += 1;
      lengths.push(result.moves.length);
      histogram[result.moves.length] = (histogram[result.moves.length] ?? 0) + 1;
    } else {
      failed += 1;
    }
  }

  lengths.sort((a, b) => a - b);
  times.sort((a, b) => a - b);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  console.log(`\n─────────────  Results  ─────────────`);
  console.log(`Correct solutions : ${solved}/${count}  (failures: ${failed})`);
  console.log(
    `Move count        : avg ${avg(lengths).toFixed(2)}  median ${percentile(lengths, 50)}  max ${lengths[lengths.length - 1]}`,
  );
  console.log(
    `Solve time        : avg ${avg(times).toFixed(1)}ms  p95 ${percentile(times, 95).toFixed(1)}ms  max ${times[times.length - 1].toFixed(1)}ms`,
  );
  console.log(`Throughput        : ${(1000 / avg(times)).toFixed(0)} solves/sec`);
  console.log(
    `God's number check: ${lengths[lengths.length - 1] <= 26 ? "all <= 26 HTM" : "exceeded 26"}`,
  );
  const hist = Object.keys(histogram)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => `${k}:${histogram[k]}`)
    .join("  ");
  console.log(`Move distribution : ${hist}`);
}

main();
