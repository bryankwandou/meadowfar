// Buildings you can actually walk into. Every wall, floor, step and piece of
// furniture that looks solid is registered with the physics as solid, and every
// doorway is a real gap — no painted-on doors, no hollow-looking solid boxes.

import * as THREE from "three";
import { Physics } from "./physics";
import { terrainHeight } from "./terrain";

const cache = new Map<string, THREE.MeshStandardMaterial>();
export function smat(
  color: number,
  o: { rough?: number; metal?: number; glow?: number; flat?: boolean; opacity?: number } = {}
) {
  const key = `${color}|${o.rough ?? 0.8}|${o.metal ?? 0}|${o.glow ?? 0}|${o.flat ?? false}|${o.opacity ?? 1}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.8,
      metalness: o.metal ?? 0,
      emissive: o.glow ? color : 0x000000,
      emissiveIntensity: o.glow ?? 0,
      flatShading: !!o.flat,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
    });
    cache.set(key, m);
  }
  return m;
}

// Canvas text sprite for signs and name tags (text only, no image assets).
export function label(text: string, opts: { fg?: string; bg?: string; scale?: number } = {}) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "700 54px system-ui, -apple-system, Segoe UI, sans-serif";
  const w = Math.min(500, g.measureText(text).width + 60);
  g.fillStyle = opts.bg ?? "rgba(18,28,38,0.78)";
  const x = (512 - w) / 2;
  g.beginPath();
  g.roundRect(x, 18, w, 92, 30);
  g.fill();
  g.fillStyle = opts.fg ?? "#ffffff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 256, 66, 480);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false }));
  const s = opts.scale ?? 1;
  sp.scale.set(4 * s, 1 * s, 1);
  sp.renderOrder = 5;
  return sp;
}

// Places meshes in a quarter-turn-rotated local frame and mirrors solid ones
// into the physics as exact world-space boxes.
function placer(g: THREE.Group, physics: Physics, owner: string, ox: number, oy: number, oz: number, quarter: number) {
  const q = ((quarter % 4) + 4) % 4;
  const c = [1, 0, -1, 0][q];
  const s = [0, 1, 0, -1][q];
  g.position.set(ox, oy, oz);
  g.rotation.y = (q * Math.PI) / 2;
  const toWorld = (lx: number, lz: number) => ({ x: ox + lx * c + lz * s, z: oz - lx * s + lz * c });
  const solid = (lx: number, ly: number, lz: number, sx: number, sy: number, sz: number) => {
    const w = toWorld(lx, lz);
    physics.addBox(owner, w.x, oy + ly, w.z, q % 2 ? sz : sx, sy, q % 2 ? sx : sz);
  };
  const box = (
    lx: number, ly: number, lz: number, sx: number, sy: number, sz: number,
    m: THREE.Material, collide = false
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m);
    mesh.position.set(lx, ly, lz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    if (collide) solid(lx, ly, lz, sx, sy, sz);
    return mesh;
  };
  const add = (o: THREE.Object3D, lx: number, ly: number, lz: number) => {
    o.position.set(lx, ly, lz);
    o.traverse((m) => {
      if (m instanceof THREE.Mesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    g.add(o);
    return o;
  };
  return { box, solid, add, toWorld };
}

export interface Room {
  minX: number; maxX: number; minZ: number; maxZ: number; floorY: number; top: number;
}

const PALETTES = [
  { wall: 0xf3e6cc, roof: 0xc0563a, trim: 0x8a5a2b, accent: 0x4b8fe1 },
  { wall: 0xe8f0e0, roof: 0x3f7a52, trim: 0x6d4a2b, accent: 0xe14b7a },
  { wall: 0xf6dfd0, roof: 0x7b4fd0, trim: 0x7a4d2b, accent: 0xffb02e },
  { wall: 0xe4ecf4, roof: 0x2f6fb5, trim: 0x5a4636, accent: 0x6fc25f },
];

// A village cottage, 7 x 7 m inside, door on local +z.
export function buildHouse(physics: Physics, owner: string, x: number, z: number, quarter: number, seed: number) {
  const P = PALETTES[Math.abs(Math.floor(seed * 1000)) % PALETTES.length];
  const W = 7, D = 7, H = 3.4, T = 0.3, DW = 1.8, DH = 2.5;
  let maxT = -Infinity, minT = Infinity;
  for (const [ax, az] of [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 0], [0, 4.6]]) {
    const h = terrainHeight(x + ax, z + az);
    maxT = Math.max(maxT, h);
    minT = Math.min(minT, h);
  }
  const floorY = maxT + 0.35;
  const g = new THREE.Group();
  const { box, solid, add, toWorld } = placer(g, physics, owner, x, floorY, z, quarter);
  const wall = smat(P.wall, { rough: 0.9 });
  const trim = smat(P.trim, { rough: 0.75 });
  const stone = smat(0xa79f93, { rough: 0.95, flat: true });
  const wood = smat(0xb07a45, { rough: 0.7 });
  const glass = smat(0xffe3a0, { glow: 0.45, rough: 0.2 });

  // stone plinth that meets the hillside, top = floor
  const plinthH = floorY - minT + 0.8;
  box(0, -plinthH / 2, 0, W + 0.5, plinthH, D + 0.5, stone, true);
  box(0, 0.015, 0, W - 2 * T, 0.03, D - 2 * T, wood);
  // walls with a real doorway
  box(0, H / 2, -D / 2 + T / 2, W, H, T, wall, true);
  box(-W / 2 + T / 2, H / 2, 0, T, H, D, wall, true);
  box(W / 2 - T / 2, H / 2, 0, T, H, D, wall, true);
  const seg = (W - DW) / 2;
  box(-(DW / 2 + seg / 2), H / 2, D / 2 - T / 2, seg, H, T, wall, true);
  box(DW / 2 + seg / 2, H / 2, D / 2 - T / 2, seg, H, T, wall, true);
  box(0, DH + (H - DH) / 2, D / 2 - T / 2, DW, H - DH, T, wall, true);
  // timber corners + door frame
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
    box(cx * (W / 2), H / 2, cz * (D / 2), 0.36, H + 0.05, 0.36, trim);
  box(-DW / 2 - 0.08, DH / 2, D / 2 - T / 2, 0.16, DH, T + 0.12, trim);
  box(DW / 2 + 0.08, DH / 2, D / 2 - T / 2, 0.16, DH, T + 0.12, trim);
  box(0, DH + 0.08, D / 2 - T / 2, DW + 0.32, 0.16, T + 0.12, trim);
  // open door, swung inward against the wall
  box(DW / 2 + 0.08, DH / 2, D / 2 - T - DW / 2, 0.08, DH - 0.06, DW * 0.92, smat(0x8a5a2b, { rough: 0.6 }));
  // windows that glow warmly from inside
  box(-W / 2, 1.75, -1.2, 0.08, 1.1, 1.3, glass);
  box(W / 2, 1.75, -1.2, 0.08, 1.1, 1.3, glass);
  box(1.6, 1.75, -D / 2, 1.3, 1.1, 0.08, glass);
  for (const wx of [-W / 2, W / 2]) {
    box(wx, 1.75, -1.2, 0.14, 0.1, 1.45, trim);
    box(wx, 1.2, -1.2, 0.2, 0.1, 1.5, trim);
  }
  // ceiling + pitched roof + chimney
  box(0, H + 0.08, 0, W, 0.16, D, smat(0xd9b98c, { rough: 0.9 }), true);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(W * 0.8, 2.6, 4, 1), smat(P.roof, { rough: 0.7, flat: true }));
  roof.rotation.y = Math.PI / 4;
  add(roof, 0, H + 0.16 + 1.3, 0);
  box(2, H + 1.6, -1.6, 0.7, 1.8, 0.7, stone);
  // steps down to the ground in front of the door
  const front = toWorld(0, D / 2 + 1);
  const gap = Math.max(0, floorY - terrainHeight(front.x, front.z));
  const n = Math.max(1, Math.ceil(gap / 0.3));
  for (let i = 0; i < n; i++) {
    const top = -(gap * (i + 1)) / (n + 1);
    const bottom = -gap - 0.6;
    box(0, (top + bottom) / 2, D / 2 + 0.25 + 0.35 + i * 0.7, DW + 0.9, top - bottom, 0.7, stone, true);
  }
  // ----- furniture (all solid) -----
  box(-2.35, 0.25, -1.9, 1.7, 0.5, 2.8, trim, true); // bed frame
  box(-2.35, 0.58, -1.9, 1.55, 0.16, 2.6, smat(0xfbf7ef));
  box(-2.35, 0.68, -1.35, 1.6, 0.06, 1.7, smat(P.accent, { rough: 0.9 }));
  box(-2.35, 0.73, -2.85, 1.1, 0.18, 0.5, smat(0xffffff));
  box(-2.35, 0.85, -3.18, 1.7, 1.2, 0.12, trim);
  box(1.6, 0.85, -1.2, 1.3, 0.1, 1.3, wood); // table
  for (const [lx, lz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]])
    box(1.6 + lx, 0.4, -1.2 + lz, 0.1, 0.8, 0.1, trim);
  solid(1.6, 0.45, -1.2, 1.3, 0.9, 1.3);
  for (const sx of [-1, 1]) {
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.5, 12), wood);
    add(stool, 1.6 + sx * 1.05, 0.25, -1.2);
    solid(1.6 + sx * 1.05, 0.25, -1.2, 0.56, 0.5, 0.56);
  }
  const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), smat(0xffe2a0, { glow: 1.2 }));
  add(lampGlow, 1.6, 1.12, -1.2);
  box(1.6, 0.96, -1.2, 0.06, 0.2, 0.06, trim);
  box(2.6, 1.1, -3.1, 1.4, 2.2, 0.5, trim, true); // bookshelf
  const bookColors = [0xe14b4b, 0x4b8fe1, 0xffd447, 0x6fc25f, 0x9b59d0];
  for (let r = 0; r < 3; r++)
    for (let b = 0; b < 5; b++)
      box(2.08 + b * 0.26, 0.45 + r * 0.66, -2.9, 0.18, 0.44, 0.3, smat(bookColors[(b + r) % 5], { rough: 0.6 }));
  box(-W / 2 + T + 0.03, 1.9, 1.3, 0.04, 0.9, 1.3, trim); // painting
  box(-W / 2 + T + 0.06, 1.9, 1.3, 0.03, 0.72, 1.1, smat([0x8fd0ff, 0xffc2d8, 0xc9f0a8][Math.floor(seed * 7) % 3], { rough: 0.5 }));
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.03, 28), smat(P.accent, { rough: 1 }));
  add(rug, 0, 0.03, 0.9);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.5, 12), smat(0xc06a4a));
  add(pot, 2.75, 0.25, 2.7);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), smat(0x3aa055, { flat: true }));
  add(leaves, 2.75, 0.85, 2.7);
  solid(2.75, 0.55, 2.7, 0.8, 1.1, 0.8);

  const a = toWorld(-W / 2 + T, -D / 2 + T);
  const b = toWorld(W / 2 - T, D / 2 - T);
  const room: Room = {
    minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x),
    minZ: Math.min(a.z, b.z), maxZ: Math.max(a.z, b.z),
    floorY, top: floorY + H,
  };
  return { group: g, room, center: new THREE.Vector3(x, floorY + 2.4, z) };
}

// The player's home: spiral stairs, a railed deck and a cabin with a real door.
export function buildTreeHouse(physics: Physics, owner: string, x: number, z: number, baseY: number) {
  const g = new THREE.Group();
  const { box, solid, add } = placer(g, physics, owner, x, baseY, z, 0);
  const bark = smat(0x7a4d2b, { rough: 0.95 });
  const plank = smat(0xc98a4b, { rough: 0.75 });
  const dark = smat(0x8a5a2b, { rough: 0.7 });
  const DECK = 5.35;

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.5, DECK, 12), bark);
  add(trunk, 0, DECK / 2, 0);
  solid(0, DECK / 2 - 0.2, 0, 2.3, DECK - 0.4, 2.3);
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 8, 10), bark);
  add(upper, 0, DECK + 4, -2.55);
  solid(0, DECK + 4, -2.55, 1.3, 8, 1.3);
  const leaf = [0x2e8b46, 0x3aa055, 0x27793c];
  [[0, 12.4, -2, 3.8], [2.4, 11.2, -0.6, 2.8], [-2.5, 11.4, -1, 2.9], [0.4, 13.8, -2.4, 2.6]].forEach(([lx, ly, lz, r], i) => {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), smat(leaf[i % 3], { flat: true, rough: 0.9 }));
    add(c, lx, ly, lz);
  });

  box(0, DECK - 0.15, 0, 6.4, 0.3, 6.4, plank, true); // deck, top = DECK
  // railing, with a gap where the stairs arrive (front, +z)
  const RH = 1.0;
  box(0, DECK + RH / 2, -3.15, 6.4, RH, 0.12, dark, true);
  box(-3.15, DECK + RH / 2, 0, 0.12, RH, 6.4, dark, true);
  box(3.15, DECK + RH / 2, 0, 0.12, RH, 6.4, dark, true);
  box(-2.15, DECK + RH / 2, 3.15, 2.1, RH, 0.12, dark, true);
  box(2.15, DECK + RH / 2, 3.15, 2.1, RH, 0.12, dark, true);

  // cabin 3.6 x 3.6, door on +z
  const W = 3.6, H = 2.6, T = 0.2, DW = 1.3, DH = 2.1;
  const cy = DECK;
  box(0, cy + H / 2, -W / 2 + T / 2, W, H, T, plank, true);
  box(-W / 2 + T / 2, cy + H / 2, 0, T, H, W, plank, true);
  box(W / 2 - T / 2, cy + H / 2, 0, T, H, W, plank, true);
  const seg = (W - DW) / 2;
  box(-(DW / 2 + seg / 2), cy + H / 2, W / 2 - T / 2, seg, H, T, plank, true);
  box(DW / 2 + seg / 2, cy + H / 2, W / 2 - T / 2, seg, H, T, plank, true);
  box(0, cy + DH + (H - DH) / 2, W / 2 - T / 2, DW, H - DH, T, plank, true);
  box(0, cy + H + 0.06, 0, W, 0.12, W, dark, true);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.7, 4), smat(0xd05a3a, { flat: true, rough: 0.7 }));
  roof.rotation.y = Math.PI / 4;
  add(roof, 0, cy + H + 0.95, 0);
  box(-W / 2, cy + 1.5, 0.4, 0.06, 0.8, 0.9, smat(0xffe3a0, { glow: 0.5, rough: 0.2 }));
  // inside: bunk, lantern, star map
  box(-0.9, cy + 0.2, -1.0, 1.4, 0.4, 1.3, dark, true);
  box(-0.9, cy + 0.45, -1.0, 1.3, 0.12, 1.2, smat(0x6bd0ff, { rough: 0.9 }));
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), smat(0xffe2a0, { glow: 1.3 }));
  add(lamp, 1.1, cy + 1.9, -1.2);
  box(0.6, cy + 1.5, -W / 2 + T + 0.02, 1.2, 0.8, 0.03, smat(0x24306e, { glow: 0.2 }));

  // spiral stairs around the trunk, each rise < step height
  const N = 17, R = 4.1, END = Math.PI / 2, SPAN = Math.PI * 1.55;
  for (let i = 0; i < N; i++) {
    const a = END - SPAN + (SPAN * i) / (N - 1);
    const top = (DECK * (i + 1)) / (N + 1);
    const sx = Math.cos(a) * R;
    const sz = Math.sin(a) * R;
    box(sx, (top - 0.4) / 2, sz, 1.25, top + 0.4, 1.25, i % 2 ? plank : dark, true);
  }
  box(0, DECK - 0.15, 3.75, 2.2, 0.3, 1.3, plank, true); // landing joining stairs to the deck

  const room: Room = {
    minX: x - W / 2 + T, maxX: x + W / 2 - T, minZ: z - W / 2 + T, maxZ: z + W / 2 - T,
    floorY: baseY + DECK, top: baseY + DECK + H,
  };
  return { group: g, room, deckY: baseY + DECK };
}

export type PortalKind = "cave" | "hall" | "arena";

// Outdoor landmark whose doorway leads into an interior scene.
export function buildPortalSite(physics: Physics, owner: string, kind: PortalKind, x: number, z: number, baseY: number, title: string) {
  const g = new THREE.Group();
  const { box, solid, add } = placer(g, physics, owner, x, baseY, z, 0);
  const rock = smat(0x8c8a93, { flat: true, rough: 0.95 });
  let trigger = new THREE.Vector3(x, baseY, z);
  let signY = 6;
  const glowDisc = (color: number, w: number, h: number) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.1, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );

  if (kind === "cave") {
    const rocks: [number, number, number, number][] = [
      [0, 2.4, -1.8, 3.8], [-4.2, 1.8, -0.6, 2.8], [4.2, 1.8, -0.6, 2.8], [-2.6, 4.6, -2.6, 2.4], [2.6, 4.6, -2.6, 2.4], [0, 5.8, -3.4, 2.6],
    ];
    rocks.forEach(([lx, ly, lz, r]) => {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rock);
      add(m, lx, ly, lz);
      solid(lx, ly, lz, r * 1.5, r * 1.8, r * 1.5);
    });
    box(0, 1.6, 1.25, 2.6, 3.2, 0.3, smat(0x0e0b16, { rough: 1 }));
    const disc = glowDisc(0x59e0ff, 2.3, 2.9);
    add(disc, 0, 1.55, 1.45);
    [[-1.9, 0.6, 1.6, 0x7fe7ff], [1.9, 0.6, 1.6, 0xc38bff], [-1.4, 0.4, 2.3, 0xff8fd8], [1.5, 0.4, 2.4, 0x7fe7ff]].forEach(([lx, ly, lz, c]) => {
      const cr = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.4, 6), smat(c, { glow: 0.9, rough: 0.2 }));
      add(cr, lx, ly + 0.5, lz);
    });
    trigger = new THREE.Vector3(x, baseY, z + 2.6);
    signY = 8.4;
  } else if (kind === "hall") {
    const mtn = new THREE.Mesh(new THREE.ConeGeometry(12, 18, 9), smat(0x7d7a86, { flat: true, rough: 0.95 }));
    add(mtn, 0, 9, -16);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.6, 6.4, 9), smat(0xf2f7fb, { flat: true }));
    add(cap, 0, 15, -16);
    solid(0, 6, -15, 16, 12, 18);
    box(0, 3.5, -3.5, 8, 7, 3, smat(0xb9b2a4, { rough: 0.9, flat: true }), true);
    box(0, 7.3, -3.2, 8.8, 0.6, 3.6, smat(0x9d968a, { flat: true }));
    for (const px of [-3.4, 3.4]) box(px, 3.2, -1.8, 0.9, 6.4, 0.9, smat(0xcfc8ba, { flat: true }), true);
    box(-0.95, 2.1, -1.98, 1.8, 4.2, 0.12, smat(0x7a4d2b, { rough: 0.6 }));
    box(0.95, 2.1, -1.98, 1.8, 4.2, 0.12, smat(0x7a4d2b, { rough: 0.6 }));
    const doorGlow = glowDisc(0xffcf7a, 3.4, 4.1);
    add(doorGlow, 0, 2.1, -1.9);
    for (const px of [-2.6, 2.6]) {
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), smat(0xffa030, { glow: 1.4 }));
      add(fl, px, 4.3, -1.6);
      box(px, 3.8, -1.7, 0.12, 0.6, 0.12, smat(0x3a2a1a));
    }
    trigger = new THREE.Vector3(x, baseY, z - 0.8);
    signY = 8.6;
  } else {
    const SEG = 22, R = 11;
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      if (Math.abs(((a - Math.PI / 2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.35) continue; // gate at +z
      const lx = Math.cos(a) * R, lz = Math.sin(a) * R;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(3.3, 3.4, 0.7), smat(i % 2 ? 0xe8d7a8 : 0xd9c48f, { rough: 0.9 }));
      seg.rotation.y = -a + Math.PI / 2;
      add(seg, lx, 1.7, lz);
      solid(lx, 1.7, lz, 2.2, 3.4, 2.2);
      if (i % 3 === 0) {
        box(lx, 4.3, lz, 0.1, 2, 0.1, smat(0x6d4a2b));
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.6), new THREE.MeshStandardMaterial({ color: [0xe14b4b, 0x4b8fe1, 0xffd447, 0x6fc25f][i % 4], side: THREE.DoubleSide }));
        add(flag, lx + 0.5, 5, lz);
      }
    }
    for (const px of [-1.9, 1.9]) box(px, 2.4, R, 0.8, 4.8, 0.8, smat(0xcfc8ba, { flat: true }), true);
    box(0, 4.9, R, 4.6, 0.5, 0.9, smat(0xcfc8ba, { flat: true }));
    const gate = glowDisc(0xffd447, 3, 4);
    add(gate, 0, 2, R);
    trigger = new THREE.Vector3(x, baseY, z + R + 0.8);
    signY = 7;
  }
  const sign = label(title, { scale: 1.3 });
  sign.position.set(0, signY, kind === "hall" ? -1 : kind === "arena" ? 11 : 1);
  g.add(sign);
  return { group: g, trigger, kind };
}
