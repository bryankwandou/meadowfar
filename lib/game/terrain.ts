// Deterministic world shape. Everything here is pure so the same seed gives
// every player in a room the exact same hills, lakes and villages.

export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Flattened pads where hand-placed landmarks sit, so doors never end up
// buried in a hillside or floating over a dip.
const PADS: { x: number; z: number; r: number; y: number }[] = [];
export function addPad(x: number, z: number, r: number) {
  const known = PADS.find((p) => p.x === x && p.z === z);
  if (known) return known.y;
  const y = rawHeight(x, z);
  PADS.push({ x, z, r, y });
  return y;
}

// Integer-lattice hash -> [0,1). Unlike stacked sine waves this never tiles,
// so the world keeps changing no matter how far you walk.
export function removePad(x: number, z: number) {
  const i = PADS.findIndex((p) => p.x === x && p.z === z);
  if (i >= 0) PADS.splice(i, 1);
}

function ihash(ix: number, iz: number, seed: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Smooth value noise in [-1, 1].
export function noise2(x: number, z: number, seed = 1) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);
  const a = ihash(ix, iz, seed);
  const b = ihash(ix + 1, iz, seed);
  const c = ihash(ix, iz + 1, seed);
  const d = ihash(ix + 1, iz + 1, seed);
  return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

export function fbm(x: number, z: number, octaves: number, seed = 1) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x, z, seed + i * 17) * amp;
    norm += amp;
    x = x * 2.03 + 11.7;
    z = z * 2.03 - 5.3;
    amp *= 0.5;
  }
  return sum / norm;
}

function rawHeight(x: number, z: number) {
  // domain warp bends valleys and ridges so no two hills look alike
  const wx = x + fbm(x * 0.004, z * 0.004, 2, 91) * 60;
  const wz = z + fbm(x * 0.004 + 40, z * 0.004 - 40, 2, 92) * 60;
  const rolling = fbm(wx * 0.0085, wz * 0.0085, 4, 3) * 9;
  // mountain ranges only where a slow mask allows them
  const mask = Math.max(0, Math.min(1, (noise2(x * 0.0011, z * 0.0011, 7) - 0.15) * 2.4));
  const ridge = 1 - Math.abs(fbm(wx * 0.0045, wz * 0.0045, 4, 13));
  const mountains = ridge * ridge * ridge * 34 * mask * mask;
  const detail = noise2(x * 0.08, z * 0.08, 29) * 0.45;
  // the starting valley (tree house, first village, cave, hall, arena) stays
  // gentle; mountains and deep relief rise beyond ~180 m from the centre
  const d = Math.hypot(x - 10, z - 5);
  const calm = Math.min(1, Math.max(0, (d - 110) / 180));
  const k = calm * calm * (3 - 2 * calm);
  return rolling * (0.35 + 0.65 * k) + mountains * k + detail - 0.5;
}

export function terrainHeight(x: number, z: number) {
  let h = rawHeight(x, z);
  for (const p of PADS) {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < p.r * 1.8) {
      const k = d <= p.r ? 1 : 1 - (d - p.r) / (p.r * 0.8);
      const s = k * k * (3 - 2 * k);
      h = h + (p.y - h) * s;
    }
  }
  return h;
}

export type Biome = "grass" | "desert" | "snow";
// Temperature-style field: warm patches become desert, cold ones snow.
export function biomeAt(x: number, z: number): Biome {
  const n = fbm(x * 0.0016, z * 0.0016, 3, 51);
  if (n > 0.42) return "desert";
  if (n < -0.42) return "snow";
  return "grass";
}

// 0..1, how thickly trees grow here (open meadows vs deep forest).
export function forestAt(x: number, z: number) {
  return Math.max(0, Math.min(1, fbm(x * 0.006, z * 0.006, 3, 61) * 1.6 + 0.45));
}

export const WATER_Y = -3.1;
