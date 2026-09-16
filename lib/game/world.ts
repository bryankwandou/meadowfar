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

function nearFixed(x: number, z: number, r: number) {
  if (Math.hypot(x - HOME.x, z - HOME.z) < r + 6) return true;
  if (Math.hypot(x - VILLAGE0.x, z - VILLAGE0.z) < r + 16) return true;
  return SITES.some((s) => Math.hypot(x - s.x, z - s.z) < r + s.pad + (s.kind === "hall" ? 12 : 0));
}

// Dungeon entrances scattered over the whole world: about one region in
// four holds an old mine, a mountain hall or a ruined arena.
export interface DungeonSite {
  kind: PortalKind;
  x: number;
  z: number;
  pad: number;
  rx: number;
  rz: number;
}
const dungeonCache = new Map<string, DungeonSite | null>();
export function dungeonPos(rx: number, rz: number): DungeonSite | null {
  const key = `${rx},${rz}`;
  if (dungeonCache.has(key)) return dungeonCache.get(key)!;
  let out: DungeonSite | null = null;
  if (hash2(rx * 5.3 + 1.1, rz * 8.7 + 2.3) > 0.72) {
    const kinds: PortalKind[] = ["cave", "cave", "hall", "arena"];
    const kind = kinds[Math.floor(hash2(rx * 3.3, rz * 4.4) * kinds.length)];
    const x = rx * REGION + REGION * (0.2 + hash2(rx * 1.7, rz * 2.9) * 0.6);
    const z = rz * REGION + REGION * (0.2 + hash2(rx * 2.1, rz * 1.3) * 0.6);
    const h = terrainHeight(x, z);
    const v = villagePos(rx, rz);
    const clear = !v || Math.hypot(v.x - x, v.z - z) > 60;
    if (h > WATER_Y + 1 && h < 16 && clear && !nearFixed(x, z, 70))
      out = { kind, x, z, pad: kind === "hall" ? 20 : kind === "arena" ? 16 : 10, rx, rz };
  }
  dungeonCache.set(key, out);
  return out;
}

export function dungeonsIn(minX: number, minZ: number, maxX: number, maxZ: number) {
  const out: DungeonSite[] = [];
  for (let rx = Math.floor(minX / REGION); rx <= Math.floor(maxX / REGION); rx++)
    for (let rz = Math.floor(minZ / REGION); rz <= Math.floor(maxZ / REGION); rz++) {
      const d = dungeonPos(rx, rz);
      if (d) out.push(d);
    }
  return out;
}

const DUNGEON_NAMES: Record<PortalKind, [string, string][]> = {
  cave: [["Tambang Tua", "Old Mine"], ["Gua Gema", "Echo Cavern"], ["Liang Kristal", "Crystal Hollow"], ["Gua Kunang", "Glowworm Grotto"]],
  hall: [["Benteng Batu", "Stone Keep"], ["Aula Raja Gunung", "Mountain King's Hall"], ["Perpustakaan Tebing", "Cliffside Library"]],
  arena: [["Arena Reruntuhan", "Ruined Arena"], ["Lingkar Juara", "Champion's Ring"], ["Gelanggang Angin", "Windward Ring"]],
};
export function dungeonName(d: DungeonSite, lang: "id" | "en") {
  const list = DUNGEON_NAMES[d.kind];
  const n = list[Math.floor(hash2(d.x, d.z) * list.length)];
  return lang === "id" ? n[0] : n[1];
}

export function nearLandmark(x: number, z: number, r: number) {
  if (nearFixed(x, z, r)) return true;
  const d = dungeonPos(Math.floor(x / REGION), Math.floor(z / REGION));
  return !!d && Math.hypot(x - d.x, z - d.z) < r + d.pad + (d.kind === "hall" ? 12 : 0);
}

export function villagePos(rx: number, rz: number) {
  // roughly one region in four has a village, so they feel like destinations
  if (hash2(rx * 13.7 + 5, rz * 9.1 + 3) > 0.26) return null;
  const ox = (hash2(rx, rz * 3) - 0.5) * REGION * 0.4;
  const oz = (hash2(rx * 7, rz) - 0.5) * REGION * 0.4;
  const x = rx * REGION + REGION / 2 + ox;
  const z = rz * REGION + REGION / 2 + oz;
  if (terrainHeight(x, z) < WATER_Y + 0.5 || terrainHeight(x, z) > 14 || nearFixed(x, z, 60)) return null;
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
