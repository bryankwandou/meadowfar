// Wild animals. Built from shaped primitives (tapered bodies, jointed legs
// with hooves or paws, real necks, ears, manes, tails, antlers) rather than
// balls. Every species can be ridden: walk up, press E / Y / the Ride button.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { hash2, terrainHeight, biomeAt, forestAt, WATER_Y } from "./terrain";
import { nearLandmark } from "./world";

export type Species = "horse" | "pony" | "deer" | "sheep" | "goat" | "camel" | "llama" | "reindeer" | "yak" | "capybara";

interface SpeciesDef {
  id: Species;
  nama: string;
  namaEn: string;
  body: number; // coat colour
  belly: number;
  dark: number; // hooves, nose, mane
  len: number; // body length
  girth: number;
  leg: number; // leg length
  neck: number;
  head: number;
  speed: number; // riding speed multiplier
  saddle: number; // seat height above ground
  extras: ("mane" | "antlers" | "horns" | "wool" | "hump" | "longEars" | "shortTail" | "spots")[];
}

export const SPECIES: Record<Species, SpeciesDef> = {
  horse: { id: "horse", nama: "Kuda", namaEn: "Horse", body: 0x8a5a33, belly: 0x9f6d45, dark: 0x2b1d14, len: 1.9, girth: 0.52, leg: 1.15, neck: 0.8, head: 0.62, speed: 2.1, saddle: 1.72, extras: ["mane"] },
  pony: { id: "pony", nama: "Kuda poni", namaEn: "Pony", body: 0xe9dcc7, belly: 0xf4ecdf, dark: 0x6a5a4a, len: 1.4, girth: 0.46, leg: 0.8, neck: 0.6, head: 0.5, speed: 1.8, saddle: 1.28, extras: ["mane", "spots"] },
  deer: { id: "deer", nama: "Rusa", namaEn: "Deer", body: 0xa4703f, belly: 0xe8d6bc, dark: 0x3a2a1c, len: 1.5, girth: 0.4, leg: 1.05, neck: 0.72, head: 0.46, speed: 2.0, saddle: 1.5, extras: ["antlers", "shortTail", "spots"] },
  sheep: { id: "sheep", nama: "Domba", namaEn: "Sheep", body: 0xf2eee4, belly: 0xe6e0d2, dark: 0x3b3430, len: 1.2, girth: 0.55, leg: 0.6, neck: 0.3, head: 0.4, speed: 1.3, saddle: 1.2, extras: ["wool", "shortTail"] },
  goat: { id: "goat", nama: "Kambing", namaEn: "Goat", body: 0xcfc3ad, belly: 0xe7ddca, dark: 0x4a3f35, len: 1.2, girth: 0.4, leg: 0.75, neck: 0.45, head: 0.42, speed: 1.5, saddle: 1.12, extras: ["horns", "shortTail"] },
  camel: { id: "camel", nama: "Unta", namaEn: "Camel", body: 0xc79a5d, belly: 0xd9b27a, dark: 0x5e4428, len: 2.0, girth: 0.55, leg: 1.4, neck: 1.1, head: 0.55, speed: 1.9, saddle: 2.35, extras: ["hump"] },
  llama: { id: "llama", nama: "Llama", namaEn: "Llama", body: 0xf1e6d2, belly: 0xfaf3e6, dark: 0x5a4a3a, len: 1.3, girth: 0.42, leg: 0.95, neck: 1.0, head: 0.44, speed: 1.6, saddle: 1.35, extras: ["wool", "longEars", "shortTail"] },
  reindeer: { id: "reindeer", nama: "Rusa kutub", namaEn: "Reindeer", body: 0x7d6a58, belly: 0xefe8dd, dark: 0x2e2620, len: 1.6, girth: 0.46, leg: 1.0, neck: 0.7, head: 0.5, speed: 2.0, saddle: 1.52, extras: ["antlers", "shortTail"] },
  yak: { id: "yak", nama: "Yak", namaEn: "Yak", body: 0x3f3129, belly: 0x5a4a3f, dark: 0x1a1512, len: 1.8, girth: 0.7, leg: 0.8, neck: 0.35, head: 0.6, speed: 1.4, saddle: 1.7, extras: ["horns", "wool", "hump"] },
  capybara: { id: "capybara", nama: "Kapibara", namaEn: "Capybara", body: 0x9a6b44, belly: 0xa77a52, dark: 0x3b2718, len: 1.1, girth: 0.42, leg: 0.35, neck: 0.1, head: 0.46, speed: 1.2, saddle: 0.95, extras: [] },
};

const matCache = new Map<number, THREE.MeshStandardMaterial>();
function m(color: number, rough = 0.85) {
  let x = matCache.get(color);
  if (!x) {
    x = new THREE.MeshStandardMaterial({ color, roughness: rough });
    matCache.set(color, x);
  }
  return x;
}

export interface Animal {
  species: Species;
  def: SpeciesDef;
  group: THREE.Group;
  legs: THREE.Group[]; // FL, FR, BL, BR (hip pivots)
  neck: THREE.Group;
  tail: THREE.Object3D | null;
  heading: number;
  turn: number;
  speed: number;
  graze: number;
  walk: number;
  vy: number;
  ridden: boolean;
  owner: string;
  // set once the rigged model replaces the primitive body
  mixer?: THREE.AnimationMixer;
  actions?: Record<string, THREE.AnimationAction>;
  clip?: string;
}

// Rigged, animated animals from Quaternius "Ultimate Animated Animals"
// (CC0, quaternius.com), served from public/models/animals. Species without a
// model keep the primitive body built below.
const MODEL_FILE: Partial<Record<Species, string>> = {
  horse: "Horse", pony: "Horse_White", deer: "Deer", reindeer: "Stag", llama: "Alpaca", yak: "Bull",
};
interface LoadedModel { scene: THREE.Object3D; clips: THREE.AnimationClip[]; height: number }
const models = new Map<string, LoadedModel>();
let modelsRequested = false;

export function preloadAnimalModels() {
  if (modelsRequested || typeof window === "undefined") return;
  modelsRequested = true;
  const loader = new GLTFLoader();
  for (const file of new Set(Object.values(MODEL_FILE))) {
    loader.load(
      `/models/animals/${file}.gltf`,
      (gltf) => {
        gltf.scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(gltf.scene);
        gltf.scene.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.castShadow = true;
            o.userData.shared = true;
          }
        });
        models.set(file, { scene: gltf.scene, clips: gltf.animations, height: box.max.y - box.min.y });
      },
      undefined,
      () => {} // missing model: the primitive body stays
    );
  }
}

// Swap the primitive body for the rigged model (if it has loaded). The leg and
// neck groups stay in place, hidden, so riding and gait code keep working.
function upgradeToModel(a: Animal) {
  const file = MODEL_FILE[a.species];
  const src = file && models.get(file);
  if (!src) return;
  const body = cloneSkinned(src.scene);
  // the model's back sits at about 62% of its full height (head raised)
  const s = a.def.saddle / 0.62 / src.height;
  body.scale.setScalar(s);
  body.traverse((o) => {
    if (o instanceof THREE.Mesh) o.frustumCulled = false; // skinned bounds lag behind the pose
  });
  for (const c of a.group.children) if (!c.userData.saddle) c.visible = false;
  a.group.add(body);
  a.mixer = new THREE.AnimationMixer(body);
  a.actions = {};
  for (const clip of src.clips) a.actions[clip.name] = a.mixer.clipAction(clip);
  a.clip = "";
}

function playClip(a: Animal, name: string, timeScale: number) {
  const next = a.actions?.[name];
  if (!next) return;
  next.timeScale = timeScale;
  if (a.clip === name) return;
  const prev = a.clip ? a.actions![a.clip] : null;
  next.reset().play();
  if (prev) prev.crossFadeTo(next, 0.3, false);
  a.clip = name;
}

export function buildAnimal(species: Species, seed: number): Animal {
  const d = SPECIES[species];
  const g = new THREE.Group();
  const coat = m(d.body);
  const belly = m(d.belly);
  const dark = m(d.dark, 0.6);
  const L = d.len;
  const R = d.girth;
  const hipY = d.leg + R * 0.35;

  // tapered barrel: a capsule scaled wider at the chest than the hips
  const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(R, L - R * 1.2, 6, 14), coat);
  barrel.rotation.x = Math.PI / 2;
  barrel.scale.set(1, 1, 0.92);
  barrel.position.set(0, hipY, 0);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 16, 12), coat);
  chest.position.set(0, hipY + R * 0.05, L * 0.34);
  const rump = new THREE.Mesh(new THREE.SphereGeometry(R * 0.98, 16, 12), coat);
  rump.position.set(0, hipY + R * 0.08, -L * 0.34);
  const under = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.72, L * 0.45, 4, 10), belly);
  under.rotation.x = Math.PI / 2;
  under.position.set(0, hipY - R * 0.32, 0);
  g.add(barrel, chest, rump, under);

  if (d.extras.includes("wool")) {
    const wool = m(0xfbf8f0, 1);
    const tuftGeo = new THREE.IcosahedronGeometry(R * 0.42, 1);
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const t = new THREE.Mesh(tuftGeo, species === "yak" ? m(d.body, 1) : wool);
      const zz = ((i * 7) % 11) / 10 - 0.5;
      t.position.set(Math.cos(a) * R * 0.95, hipY + Math.sin(a) * R * 0.85, zz * L * 0.9);
      g.add(t);
    }
  }
  if (d.extras.includes("hump")) {
    const hump = new THREE.Mesh(new THREE.SphereGeometry(R * 0.75, 14, 10), coat);
    hump.scale.set(0.9, 0.8, 1.2);
    hump.position.set(0, hipY + R * 0.85, species === "yak" ? L * 0.25 : 0);
    g.add(hump);
  }
  if (d.extras.includes("spots")) {
    const spot = m(0xf6efe2);
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.CircleGeometry(R * 0.14, 10), spot);
      const side = i % 2 ? 1 : -1;
      s.position.set(side * (R * 0.99), hipY + R * 0.3 - (i % 3) * 0.08, -L * 0.3 + i * 0.09);
      s.rotation.y = (side * Math.PI) / 2;
      g.add(s);
    }
  }

  // saddle blanket so it reads as a ride
  const blanket = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, L * 0.34, 16, 1, true, -Math.PI * 0.55, Math.PI * 1.1), m(0xb8433a, 0.9));
  blanket.rotation.z = Math.PI / 2;
  blanket.rotation.y = Math.PI / 2;
  blanket.position.set(0, hipY + 0.02, 0.02);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(R * 1.1, 0.1, L * 0.26), m(0x5a3a22, 0.7));
  seat.position.set(0, hipY + R + 0.04 + (d.extras.includes("hump") && species === "camel" ? R * 0.6 : 0), 0);
  g.add(blanket, seat);
  // a saddle that stays when a rigged model replaces this body
  if (MODEL_FILE[species]) {
    const saddle = new THREE.Group();
    saddle.userData.saddle = true;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.72), m(0xb8433a, 0.9));
    const leather = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.5), m(0x5a3a22, 0.7));
    leather.position.y = 0.07;
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 8), m(0x5a3a22, 0.7));
    horn.position.set(0, 0.14, 0.22);
    saddle.add(pad, leather, horn);
    saddle.position.set(0, d.saddle - 0.12, 0.05);
    saddle.visible = false; // shown once the model is on
    g.add(saddle);
  }

  // legs: upper + lower segment with a knee, and a hoof
  const legs: THREE.Group[] = [];
  const legR = Math.max(0.07, R * 0.2);
  for (const [lx, lz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]] as const) {
    const hip = new THREE.Group();
    hip.position.set(lx * R * 0.55, hipY, lz * L * 0.36);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(legR * 1.25, d.leg * 0.42, 4, 8), coat);
    upper.position.y = -d.leg * 0.25;
    const knee = new THREE.Group();
    knee.position.y = -d.leg * 0.52;
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(legR * 0.8, d.leg * 0.36, 4, 8), species === "sheep" || species === "goat" ? dark : coat);
    lower.position.y = -d.leg * 0.22;
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(legR * 0.95, legR * 1.1, 0.12, 10), dark);
    hoof.position.y = -d.leg * 0.44;
    knee.add(lower, hoof);
    hip.add(upper, knee);
    hip.userData.knee = knee;
    g.add(hip);
    legs.push(hip);
  }

  // neck + head
  const neck = new THREE.Group();
  neck.position.set(0, hipY + R * 0.35, L * 0.42);
  const neckMesh = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.36, Math.max(0.05, d.neck), 4, 10), coat);
  neckMesh.position.y = d.neck * 0.5;
  neck.add(neckMesh);
  neck.rotation.x = species === "capybara" ? 1.2 : 0.55;
  const head = new THREE.Group();
  head.position.y = d.neck + 0.05;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(d.head * 0.42, 14, 12), coat);
  skull.scale.set(0.85, 0.9, 1);
  const snout = new THREE.Mesh(new THREE.CapsuleGeometry(d.head * 0.24, d.head * 0.55, 4, 10), species === "capybara" ? coat : belly);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -d.head * 0.12, d.head * 0.45);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(d.head * 0.13, 10, 8), dark);
  nose.scale.set(1.3, 0.8, 0.7);
  nose.position.set(0, -d.head * 0.1, d.head * 0.86);
  const eyeM = m(0x14100c, 0.25);
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(d.head * 0.07, 8, 6), eyeM);
  e1.position.set(-d.head * 0.3, d.head * 0.1, d.head * 0.22);
  const e2 = e1.clone();
  e2.position.x *= -1;
  head.add(skull, snout, nose, e1, e2);
  const longEars = d.extras.includes("longEars");
  const earGeo = new THREE.ConeGeometry(d.head * 0.1, d.head * (longEars ? 0.55 : 0.32), 6);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, coat);
    ear.position.set(s * d.head * 0.24, d.head * 0.4, -d.head * 0.05);
    ear.rotation.z = -s * 0.35;
    head.add(ear);
  }
  head.rotation.x = -neck.rotation.x - 0.05;
  neck.add(head);
  g.add(neck);

  if (d.extras.includes("mane")) {
    const maneM = m(d.dark, 1);
    for (let i = 0; i < 7; i++) {
      const strand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.24, 0.16), maneM);
      strand.position.set(0, d.neck * (i / 7) + 0.1, -R * 0.3);
      neck.add(strand);
    }
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.2), maneM);
    fore.position.set(0, d.head * 0.45, d.head * 0.15);
    head.add(fore);
  }
  if (d.extras.includes("antlers")) {
    const antlerM = m(0xd8c7a6, 0.7);
    const beam = new THREE.CylinderGeometry(0.025, 0.04, 0.55, 6);
    const tine = new THREE.CylinderGeometry(0.018, 0.028, 0.26, 5);
    for (const s of [-1, 1]) {
      const a = new THREE.Group();
      a.position.set(s * d.head * 0.18, d.head * 0.38, -d.head * 0.05);
      const b = new THREE.Mesh(beam, antlerM);
      b.position.y = 0.26;
      b.rotation.z = -s * 0.45;
      a.add(b);
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(tine, antlerM);
        t.position.set(s * (0.08 + i * 0.07), 0.2 + i * 0.13, 0.05);
        t.rotation.set(0.6, 0, -s * 0.2);
        a.add(t);
      }
      head.add(a);
    }
  }
  if (d.extras.includes("horns")) {
    const hornM = m(0xe6dccb, 0.5);
    for (const s of [-1, 1]) {
      const h = new THREE.Mesh(new THREE.TorusGeometry(d.head * 0.18, 0.035, 6, 12, Math.PI * 1.1), hornM);
      h.position.set(s * d.head * 0.22, d.head * 0.38, -d.head * 0.1);
      h.rotation.set(0, Math.PI / 2, s * 0.6);
      head.add(h);
    }
  }

  let tail: THREE.Object3D | null = null;
  if (d.extras.includes("mane") && !d.extras.includes("shortTail")) {
    const tg = new THREE.Group();
    tg.position.set(0, hipY + R * 0.4, -L * 0.52);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 8), m(d.dark, 1));
    t.position.y = -0.4;
    t.rotation.x = Math.PI;
    tg.add(t);
    tg.rotation.x = 0.35;
    g.add(tg);
    tail = tg;
  } else if (species !== "capybara") {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), d.extras.includes("wool") ? m(0xfbf8f0, 1) : coat);
    t.position.set(0, hipY + R * 0.5, -L * 0.52);
    g.add(t);
    tail = t;
  }

  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  const sc = 0.92 + hash2(seed, 3.3) * 0.16;
  g.scale.setScalar(sc);
  return {
    species, def: d, group: g, legs, neck, tail,
    heading: hash2(seed, 1.7) * Math.PI * 2, turn: 0, speed: 0, graze: 1 + hash2(seed, 9) * 3,
    walk: 0, vy: 0, ridden: false, owner: "",
  };
}

// Which species live here, weighted by biome and forest cover.
function pickSpecies(x: number, z: number, r: number): Species {
  const b = biomeAt(x, z);
  if (b === "desert") return r < 0.55 ? "camel" : r < 0.85 ? "llama" : "goat";
  if (b === "snow") return r < 0.5 ? "reindeer" : r < 0.8 ? "yak" : "goat";
  if (terrainHeight(x, z) > 12) return r < 0.6 ? "goat" : "llama";
  const f = forestAt(x, z);
  if (f > 0.6) return r < 0.6 ? "deer" : r < 0.8 ? "pony" : "capybara";
  return r < 0.3 ? "horse" : r < 0.55 ? "sheep" : r < 0.72 ? "pony" : r < 0.87 ? "deer" : "capybara";
}

// Deterministic herd for a chunk, so every player sees the same animals start
// in the same places.
export function herdFor(cx: number, cz: number, size: number) {
  const out: { species: Species; x: number; z: number; seed: number }[] = [];
  const count = Math.floor(hash2(cx * 3.1 + 0.5, cz * 7.3 + 0.25) * 3.2);
  const hx = cx * size + (hash2(cx, cz * 1.9) - 0.5) * size * 0.6;
  const hz = cz * size + (hash2(cx * 2.3, cz) - 0.5) * size * 0.6;
  if (terrainHeight(hx, hz) < WATER_Y + 0.6 || nearLandmark(hx, hz, 10)) return out;
  const species = pickSpecies(hx, hz, hash2(cx * 11, cz * 13));
  for (let i = 0; i < count; i++) {
    const seed = cx * 928371 + cz * 1237 + i;
    const x = hx + (hash2(seed, 1) - 0.5) * 12;
    const z = hz + (hash2(seed, 2) - 0.5) * 12;
    if (terrainHeight(x, z) > WATER_Y + 0.4) out.push({ species: i === 2 ? pickSpecies(x, z, hash2(seed, 5)) : species, x, z, seed });
  }
  return out;
}

export function animateAnimal(a: Animal, dt: number, now: number, moving: number) {
  if (!a.mixer) upgradeToModel(a);
  if (a.mixer) {
    for (const c of a.group.children) if (c.userData.saddle) c.visible = true;
    const grazing = moving < 0.02 && !a.ridden && Math.sin(now / 1600 + a.graze * 7) > 0.35;
    if (moving > 1.05) playClip(a, "Gallop", Math.min(1.6, moving * 0.8));
    else if (moving > 0.02) playClip(a, "Walk", 0.6 + moving * 0.9);
    else playClip(a, grazing ? "Eating" : "Idle", 1);
    a.mixer.update(dt);
    return;
  }
  const k = Math.min(1, moving);
  a.walk += dt * (4 + 7 * k) * (k > 0.02 ? 1 : 0);
  const sw = 0.55 * k;
  // diagonal gait: FL+BR together, FR+BL together
  const phase = [0, Math.PI, Math.PI, 0];
  a.legs.forEach((leg, i) => {
    const s = Math.sin(a.walk + phase[i]);
    leg.rotation.x = s * sw;
    (leg.userData.knee as THREE.Group).rotation.x = Math.max(0, -Math.cos(a.walk + phase[i])) * sw * 1.2;
  });
  const grazing = k < 0.02 && !a.ridden && Math.sin(now / 1600 + a.graze * 7) > 0.35;
  const want = grazing ? 1.35 : a.species === "capybara" ? 1.2 : 0.55;
  a.neck.rotation.x += (want - a.neck.rotation.x) * Math.min(1, dt * 3);
  if (a.tail) a.tail.rotation.z = Math.sin(now / 260 + a.graze) * 0.25;
  a.group.children[0].position.y = a.legs[0].position.y + Math.abs(Math.sin(a.walk)) * 0.05 * k;
}

// Free-roaming behaviour when nobody rides it.
export function wander(a: Animal, dt: number, now: number, flee: THREE.Vector3 | null) {
  a.graze -= dt;
  if (a.graze <= 0) {
    a.graze = 2 + Math.random() * 5;
    a.turn = (Math.random() - 0.5) * 1.6;
    a.speed = Math.random() < 0.45 ? 0 : 1 + Math.random() * 1.4;
  }
  if (flee) {
    const d = Math.hypot(flee.x - a.group.position.x, flee.z - a.group.position.z);
    if (d < 2.2) a.speed = 0; // let the player walk up and hop on
  }
  a.heading += a.turn * dt * (a.speed > 0 ? 1 : 0);
  const nx = a.group.position.x + Math.sin(a.heading) * a.speed * dt;
  const nz = a.group.position.z + Math.cos(a.heading) * a.speed * dt;
  if (terrainHeight(nx, nz) < WATER_Y + 0.3 || nearLandmark(nx, nz, 3)) {
    a.heading += Math.PI * 0.7;
  } else {
    a.group.position.x = nx;
    a.group.position.z = nz;
  }
  a.group.position.y = terrainHeight(a.group.position.x, a.group.position.z);
  a.group.rotation.y += Math.atan2(Math.sin(a.heading - a.group.rotation.y), Math.cos(a.heading - a.group.rotation.y)) * Math.min(1, dt * 4);
  animateAnimal(a, dt, now, a.speed / 2);
}
