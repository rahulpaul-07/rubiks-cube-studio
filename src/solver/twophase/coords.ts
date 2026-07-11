import type { Cubie } from "./cube";

/**
 * Coordinate encodings for the two-phase algorithm. Phase 1 reduces the cube to
 * the G1 subgroup using orientation and UD-slice-location coordinates; phase 2
 * finishes within G1 using permutation coordinates.
 */

export function nCk(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let kk = k;
  if (kk > n - kk) kk = n - kk;
  let num = 1;
  let den = 1;
  for (let i = 0; i < kk; i += 1) {
    num *= n - i;
    den *= i + 1;
  }
  return Math.round(num / den);
}

export function permToIndex(arr: readonly number[]): number {
  const n = arr.length;
  let idx = 0;
  for (let i = 0; i < n; i += 1) {
    idx *= n - i;
    for (let j = i + 1; j < n; j += 1) {
      if (arr[j] < arr[i]) idx += 1;
    }
  }
  return idx;
}

export function indexToPerm(index: number, n: number): number[] {
  const perm = new Array<number>(n);
  const elems: number[] = [];
  for (let i = 0; i < n; i += 1) elems.push(i);
  const fact = [1];
  for (let i = 1; i <= n; i += 1) fact[i] = fact[i - 1] * i;
  let idx = index;
  for (let i = 0; i < n; i += 1) {
    const f = fact[n - 1 - i];
    const d = Math.floor(idx / f);
    idx %= f;
    perm[i] = elems.splice(d, 1)[0];
  }
  return perm;
}

// Phase 1 orientation coordinates
export function getTwist(c: Cubie): number {
  let t = 0;
  for (let i = 0; i < 7; i += 1) t = t * 3 + c.co[i];
  return t;
}
export function setTwist(c: Cubie, twist: number): void {
  let t = twist;
  let sum = 0;
  for (let i = 6; i >= 0; i -= 1) {
    const o = t % 3;
    t = (t - o) / 3;
    c.co[i] = o;
    sum += o;
  }
  c.co[7] = (3 - (sum % 3)) % 3;
}
export function getFlip(c: Cubie): number {
  let f = 0;
  for (let i = 0; i < 11; i += 1) f = f * 2 + c.eo[i];
  return f;
}
export function setFlip(c: Cubie, flip: number): void {
  let f = flip;
  let sum = 0;
  for (let i = 10; i >= 0; i -= 1) {
    const o = f & 1;
    f = Math.floor(f / 2);
    c.eo[i] = o;
    sum += o;
  }
  c.eo[11] = sum & 1;
}

// UD-slice location (which 4 positions hold slice edges 8..11), 0..494
export function getSliceLocation(c: Cubie): number {
  const pos: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    if (c.ep[i] >= 8) pos.push(i);
  }
  let s = 0;
  for (let t = 0; t < 4; t += 1) s += nCk(pos[t], t + 1);
  return s;
}
export function setSliceLocation(c: Cubie, index: number): void {
  const pos = new Array<number>(4);
  let rem = index;
  for (let t = 3; t >= 0; t -= 1) {
    let p = t;
    while (nCk(p + 1, t + 1) <= rem) p += 1;
    pos[t] = p;
    rem -= nCk(p, t + 1);
  }
  const ep = new Array<number>(12).fill(-1);
  for (let t = 0; t < 4; t += 1) ep[pos[t]] = 8 + t;
  let fill = 0;
  for (let i = 0; i < 12; i += 1) {
    if (ep[i] === -1) {
      ep[i] = fill;
      fill += 1;
    }
  }
  c.ep = ep;
}

// Phase 2 permutation coordinates
export function getCornerPerm(c: Cubie): number {
  return permToIndex(c.cp);
}
export function setCornerPerm(c: Cubie, index: number): void {
  c.cp = indexToPerm(index, 8);
}
export function getEdge8Perm(c: Cubie): number {
  return permToIndex(c.ep.slice(0, 8));
}
export function setEdge8Perm(c: Cubie, index: number): void {
  const p = indexToPerm(index, 8);
  for (let i = 0; i < 8; i += 1) c.ep[i] = p[i];
}
export function getSliceSort(c: Cubie): number {
  return permToIndex(c.ep.slice(8, 12).map((v) => v - 8));
}
export function setSliceSort(c: Cubie, index: number): void {
  const p = indexToPerm(index, 4);
  for (let i = 0; i < 4; i += 1) c.ep[8 + i] = 8 + p[i];
}
