// World layout shared by the 3D engine and the map screens. Pure functions of
// position, so the map can show villages hundreds of metres away before the
// engine has built them, and every player in a room sees the same places.

import { hash2, terrainHeight, WATER_Y } from "./terrain";
import type { PortalKind } from "./structures";

export const CHUNK = 48;
export const REGION = CHUNK * 4;
export const HOME = { x: 14, z: -10 };
export const VILLAGE0 = { x: 38, z: 30 };
export const SITES: { kind: PortalKind; x: number; z: number; pad: number }[] = [
  { kind: "cave", x: -26, z: -40, pad: 10 },
  { kind: "hall", x: 66, z: -46, pad: 20 },
  { kind: "arena", x: -56, z: 30, pad: 16 },
];

export function nearLandmark(x: number, z: number, r: number) {
  if (Math.hypot(x - HOME.x, z - HOME.z) < r + 6) return true;
  if (Math.hypot(x - VILLAGE0.x, z - VILLAGE0.z) < r + 16) return true;
  return SITES.some((s) => Math.hypot(x - s.x, z - s.z) < r + s.pad + (s.kind === "hall" ? 12 : 0));
}

export function villagePos(rx: number, rz: number) {
  // roughly one region in four has a village, so they feel like destinations
  if (hash2(rx * 13.7 + 5, rz * 9.1 + 3) > 0.26) return null;
  const ox = (hash2(rx, rz * 3) - 0.5) * REGION * 0.4;
  const oz = (hash2(rx * 7, rz) - 0.5) * REGION * 0.4;
  const x = rx * REGION + REGION / 2 + ox;
  const z = rz * REGION + REGION / 2 + oz;
  if (terrainHeight(x, z) < WATER_Y + 0.5 || terrainHeight(x, z) > 14 || nearLandmark(x, z, 60)) return null;
  return { x, z };
}

// Every village inside a square, for the world map.
export function villagesIn(minX: number, minZ: number, maxX: number, maxZ: number) {
  const out: { x: number; z: number }[] = [];
  for (let rx = Math.floor(minX / REGION); rx <= Math.floor(maxX / REGION); rx++)
    for (let rz = Math.floor(minZ / REGION); rz <= Math.floor(maxZ / REGION); rz++) {
      const v = villagePos(rx, rz);
      if (v) out.push(v);
    }
  return out;
}

const VILLAGE_NAMES = [
  "Brookhollow", "Fernwick", "Amberleigh", "Mossford", "Willowmere", "Thistledown",
  "Larkspur", "Oakenshaw", "Pebblecombe", "Heatherfield", "Rushmoor", "Clovercross",
  "Juniper Rise", "Marigold Bend", "Starling Green", "Foxglove End",
];
export function villageName(x: number, z: number) {
  if (Math.hypot(x - VILLAGE0.x, z - VILLAGE0.z) < 1) return "Meadow Village";
  return VILLAGE_NAMES[Math.floor(hash2(Math.round(x), Math.round(z)) * VILLAGE_NAMES.length)];
}
