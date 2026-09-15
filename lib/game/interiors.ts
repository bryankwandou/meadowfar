// Interior spaces reached through a doorway in the world: a crystal cave, a
// hall carved into a mountain, and a friendly training arena. Each one is its
// own scene with its own lights and physics, so walls are real walls and the
// open world never bleeds through.

import * as THREE from "three";
import { Physics } from "./physics";
import { label, smat } from "./structures";

export type InteriorId = "cave" | "hall" | "arena";

export interface Pickup {
  mesh: THREE.Object3D;
  kind: "gem" | "chest";
  taken: boolean;
}

export interface Interior {
  id: InteriorId;
  scene: THREE.Scene;
  physics: Physics;
  spawn: THREE.Vector3;
  spawnYaw: number;
  exit: THREE.Vector3;
  pickups: Pickup[];
  slimeArea: { x: number; z: number; r: number } | null;
  update(dt: number, now: number): void;
  dispose(): void;
}

function floorSlab(physics: Physics, size: number) {
  physics.addBox("floor", 0, -1, 0, size, 2, size);
}

function exitArch(scene: THREE.Scene, x: number, z: number, text: string, color = 0x8fffc8) {
  const g = new THREE.Group();
  const stone = smat(0xcfc8ba, { flat: true });
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.6, 0.6), stone);
  p1.position.set(-1.6, 1.8, 0);
  const p2 = p1.clone();
  p2.position.x = 1.6;
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.6, 0.7), stone);
  top.position.y = 3.8;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 3.4),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  glow.position.y = 1.75;
  const sign = label(text, { scale: 0.9, bg: "rgba(10,40,30,0.8)" });
  sign.position.y = 4.8;
  g.add(p1, p2, top, glow, sign);
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function baseScene(bg: number, fogNear: number, fogFar: number) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, fogNear, fogFar);
  return scene;
}

export function buildInterior(id: InteriorId, lang: "id" | "en", low: boolean): Interior {
  const physics = new Physics();
  const pickups: Pickup[] = [];
  const animated: ((dt: number, now: number) => void)[] = [];
  const t = (idText: string, en: string) => (lang === "id" ? idText : en);
  let scene: THREE.Scene;
  let spawn = new THREE.Vector3(0, 0, 0);
  let exit = new THREE.Vector3(0, 0, 0);
  let slimeArea: Interior["slimeArea"] = null;

  if (id === "cave") {
    scene = baseScene(0x0a0f1f, 10, 60);
    scene.add(new THREE.HemisphereLight(0x6a7cff, 0x1a1030, 0.9));
    scene.add(new THREE.AmbientLight(0x404a70, 0.6));
    floorSlab(physics, 80);
    const floorGeo = new THREE.CircleGeometry(27, 48);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, smat(0x3a3548, { rough: 1 }));
    floor.receiveShadow = true;
    scene.add(floor);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(30, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x241f33, side: THREE.BackSide, roughness: 1, flatShading: true }));
    scene.add(dome);
    const rock = smat(0x4a4558, { flat: true, rough: 1 });
    // ring of boulders = the cave wall
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      const r = 24 + Math.sin(i * 2.3) * 1.5;
      const s = 3.6 + Math.abs(Math.sin(i * 1.7)) * 2.4;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rock);
      m.position.set(Math.cos(a) * r, s * 0.6, Math.sin(a) * r);
      m.rotation.set(i, i * 0.7, 0);
      scene.add(m);
      physics.addBox("wall", m.position.x, s * 0.6, m.position.z, s * 1.6, s * 2.2, s * 1.6);
    }
    // pillars
    [[-9, -6], [9, -4], [-6, 8], [7, 9]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.8, 14, 8), rock);
      p.position.set(x, 7, z);
      scene.add(p);
      physics.addBox("pillar", x, 7, z, 2.6, 14, 2.6);
    });
    // crystal throne on a stepped ledge
    for (let i = 0; i < 5; i++) {
      const top = 0.45 * (i + 1);
      const step = new THREE.Mesh(new THREE.BoxGeometry(6 - i * 0.6, top, 1.2), smat(0x5a5470, { flat: true }));
      step.position.set(0, top / 2, -8 - i * 1.2);
      step.receiveShadow = true;
      scene.add(step);
      physics.addBox("steps", 0, top / 2, -8 - i * 1.2, 6 - i * 0.6, top, 1.2);
    }
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(8, 2.25, 6), smat(0x5a5470, { flat: true }));
    ledge.position.set(0, 1.125, -16.4);
    scene.add(ledge);
    physics.addBox("ledge", 0, 1.125, -16.4, 8, 2.25, 6);
    const big = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), smat(0x7fe7ff, { glow: 1.1, rough: 0.1 }));
    big.position.set(0, 4.4, -17);
    big.scale.y = 1.6;
    scene.add(big);
    animated.push((dt, now) => {
      big.rotation.y += dt * 0.5;
      big.position.y = 4.4 + Math.sin(now / 600) * 0.2;
    });
    // crystal clusters + coloured light
    const colors = [0x7fe7ff, 0xc38bff, 0xff8fd8, 0x8fffc8];
    for (let i = 0; i < 22; i++) {
      const a = i * 2.39;
      const r = 8 + (i % 7) * 2.2;
      const c = colors[i % 4];
      const cl = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25 + j * 0.05, 1.2 + j * 0.4, 6), smat(c, { glow: 0.9, rough: 0.15 }));
        cone.position.set((j - 1.5) * 0.3, 0.6 + j * 0.2, (j % 2) * 0.3);
        cone.rotation.z = (j - 1.5) * 0.25;
        cl.add(cone);
      }
      cl.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      scene.add(cl);
    }
    const lights = low ? 2 : 4;
    for (let i = 0; i < lights; i++) {
      const L = new THREE.PointLight(colors[i], 26, 34, 1.6);
      const a = (i / lights) * Math.PI * 2 + 0.4;
      L.position.set(Math.cos(a) * 11, 4, Math.sin(a) * 11);
      scene.add(L);
      animated.push((_dt, now) => {
        L.intensity = 22 + Math.sin(now / 700 + i * 2) * 6;
      });
    }
    // underground pool
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 32), new THREE.MeshStandardMaterial({ color: 0x1f8fb0, emissive: 0x0f5a70, emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.85 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(12, 0.03, 2);
    scene.add(pool);
    // gems to find
    for (let i = 0; i < 10; i++) {
      const a = i * 0.9 + 0.3;
      const r = 6 + (i % 5) * 3.2;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), smat(colors[i % 4], { glow: 1.2, rough: 0.1 }));
      gem.position.set(Math.cos(a) * r, 1.2, Math.sin(a) * r);
      scene.add(gem);
      pickups.push({ mesh: gem, kind: "gem", taken: false });
    }
    // floating sparkles
    const pts = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) {
      pts[i * 3] = Math.sin(i * 12.9) * 22;
      pts[i * 3 + 1] = 1 + ((i * 7) % 14);
      pts[i * 3 + 2] = Math.cos(i * 4.1) * 22;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const sparkle = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xbff4ff, size: 0.12, transparent: true, opacity: 0.8, depthWrite: false }));
    scene.add(sparkle);
    animated.push((dt) => (sparkle.rotation.y += dt * 0.03));
    spawn = new THREE.Vector3(0, 0, 16);
    exit = new THREE.Vector3(0, 0, 20.5);
    exitArch(scene, 0, 21.5, t("Keluar", "Exit"));
  } else if (id === "hall") {
    scene = baseScene(0x2b2331, 25, 90);
    scene.add(new THREE.HemisphereLight(0xffe0b8, 0x2a2030, 0.9));
    scene.add(new THREE.AmbientLight(0x6a5a60, 0.5));
    const L = 44, Wd = 30, H = 12;
    floorSlab(physics, 120);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, Wd), smat(0x8e8676, { rough: 0.85 }));
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);
    // checker inlay
    for (let i = -10; i <= 10; i += 2)
      for (let j = -6; j <= 6; j += 2) {
        if ((i + j) % 4) continue;
        const tile = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.02, 1.9), smat(0xa39a88, { rough: 0.7 }));
        tile.position.set(i * 2, 0.01, j * 2);
        scene.add(tile);
      }
    const wallM = smat(0x9d9484, { rough: 0.95 });
    const walls: [number, number, number, number, number][] = [
      [0, H / 2, -Wd / 2, L, 1], [0, H / 2, Wd / 2, L, 1], [-L / 2, H / 2, 0, 1, Wd], [L / 2, H / 2, 0, 1, Wd],
    ];
    walls.forEach(([x, y, z, sx, sz]) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(sx, H, sz), wallM);
      w.position.set(x, y, z);
      w.receiveShadow = true;
      scene.add(w);
      physics.addBox("wall", x, y, z, sx, H, sz);
    });
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(L, 0.6, Wd), smat(0x6d6456));
    ceil.position.y = H;
    scene.add(ceil);
    // pillars
    for (let i = -2; i <= 2; i++)
      for (const z of [-5, 5]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, H, 14), smat(0xd8d0c0, { rough: 0.6 }));
        p.position.set(i * 7.5, H / 2, z);
        p.castShadow = true;
        scene.add(p);
        physics.addBox("pillar", i * 7.5, H / 2, z, 1.8, H, 1.8);
      }
    // balcony along the back wall, reached by stairs
    const BY = 4.2;
    const balc = new THREE.Mesh(new THREE.BoxGeometry(L - 1, 0.4, 4.5), smat(0x7a6a58, { rough: 0.8 }));
    balc.position.set(0, BY - 0.2, -Wd / 2 + 2.75);
    scene.add(balc);
    physics.addBox("balcony", 0, BY - 0.2, -Wd / 2 + 2.75, L - 1, 0.4, 4.5);
    const railZ = -Wd / 2 + 5;
    physics.addBox("rail", -3.5, BY + 0.5, railZ, L - 12, 1, 0.2);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(L - 12, 1, 0.2), smat(0x5a4636));
    rail.position.set(-3.5, BY + 0.5, railZ);
    scene.add(rail);
    for (let i = 0; i < 12; i++) {
      const top = 0.35 * (i + 1);
      const sz = railZ + 0.5 + (11 - i) * 0.95;
      const st = new THREE.Mesh(new THREE.BoxGeometry(3.2, top, 0.95), smat(i % 2 ? 0xb9b2a4 : 0xa8a092, { flat: true }));
      st.position.set(16, top / 2, sz);
      st.castShadow = true;
      st.receiveShadow = true;
      scene.add(st);
      physics.addBox("stair", 16, top / 2, sz, 3.2, top, 0.95);
    }
    // banners + tall windows of light
    const bannerColors = [0xd63a3a, 0x3f7ede, 0xffd447, 0x6fc25f, 0x9b59d0];
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), new THREE.MeshStandardMaterial({ color: bannerColors[i], side: THREE.DoubleSide, roughness: 0.9 }));
      b.position.set(-16 + i * 8, 8.2, -Wd / 2 + 0.55);
      scene.add(b);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 5), smat(0xfff2c8, { glow: 1.0 }));
      w.position.set(-L / 2 + 0.55, 6.5, -10 + i * 5);
      w.rotation.y = Math.PI / 2;
      scene.add(w);
    }
    const torches = low ? 2 : 4;
    for (let i = 0; i < torches; i++) {
      const x = -15 + (30 * i) / Math.max(1, torches - 1);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 8), smat(0xffa030, { glow: 1.5 }));
      flame.position.set(x, 3.4, Wd / 2 - 0.8);
      scene.add(flame);
      const Lt = new THREE.PointLight(0xffb060, 30, 26, 1.6);
      Lt.position.set(x, 3.6, Wd / 2 - 1.5);
      scene.add(Lt);
      animated.push((_dt, now) => {
        const k = 1 + Math.sin(now / 90 + i * 3) * 0.08 + Math.sin(now / 37 + i) * 0.05;
        Lt.intensity = 30 * k;
        flame.scale.set(1, k, 1);
      });
    }
    const chand = new THREE.PointLight(0xfff0d0, 40, 50, 1.4);
    chand.position.set(0, 9, 0);
    scene.add(chand);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.12, 8, 32), smat(0xd4b060, { metal: 0.7, rough: 0.3 }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 9, 0);
    scene.add(ring);
    // balcony treasure chest
    const chest = new THREE.Group();
    const cb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.1), smat(0x8a5a2b));
    cb.position.y = 0.5;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 1.2), smat(0xffd447, { glow: 0.5, metal: 0.4 }));
    lid.position.y = 1.15;
    chest.add(cb, lid);
    chest.position.set(-12, BY, -Wd / 2 + 2.5);
    scene.add(chest);
    pickups.push({ mesh: chest, kind: "chest", taken: false });
    spawn = new THREE.Vector3(0, 0, 11);
    exit = new THREE.Vector3(0, 0, 13.8);
    exitArch(scene, 0, 14.3, t("Keluar", "Exit"));
  } else {
    scene = baseScene(0x9fd8ef, 50, 160);
    scene.add(new THREE.HemisphereLight(0xcfeaff, 0xd9c48f, 1.1));
    const sun = new THREE.DirectionalLight(0xfff2d8, 2.2);
    sun.position.set(20, 40, 15);
    sun.castShadow = !low;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);
    floorSlab(physics, 120);
    const sand = new THREE.Mesh(new THREE.CircleGeometry(23, 48), smat(0xe6d09a, { rough: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.receiveShadow = true;
    scene.add(sand);
    const outer = new THREE.Mesh(new THREE.CircleGeometry(80, 32), smat(0x6fc25f));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.02;
    scene.add(outer);
    const emblem = new THREE.Mesh(new THREE.RingGeometry(3, 3.6, 5), smat(0xffd447, { glow: 0.4 }));
    emblem.rotation.x = -Math.PI / 2;
    emblem.position.y = 0.03;
    scene.add(emblem);
    const R = 23, SEG = 40;
    for (let i = 0; i < SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      if (Math.abs(a - Math.PI / 2) < 0.12) continue; // exit gate at +z
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      const w = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.4, 0.8), smat(i % 2 ? 0xe8d7a8 : 0xd9c48f));
      w.position.set(x, 1.7, z);
      w.rotation.y = -a + Math.PI / 2;
      w.castShadow = true;
      scene.add(w);
      physics.addBox("wall", x, 1.7, z, 2.4, 3.4, 2.4);
      // stands with a cheering crowd of little blobs
      const stand = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 2), smat(0xbfae86));
      stand.position.set(Math.cos(a) * (R + 2.2), 3.2, Math.sin(a) * (R + 2.2));
      stand.rotation.y = w.rotation.y;
      scene.add(stand);
      if (i % 2 === 0) {
        const fan = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), smat([0xff8fb3, 0x6bd0ff, 0xffd447, 0x8fffc8][i % 4]));
        fan.position.set(Math.cos(a) * (R + 2.2), 4.2, Math.sin(a) * (R + 2.2));
        scene.add(fan);
        animated.push((_dt, now) => (fan.position.y = 4.2 + Math.abs(Math.sin(now / 240 + i)) * 0.5));
      }
    }
    const board = label(t("Letuskan slime dengan gelembung!", "Pop the slimes with bubbles!"), { scale: 2.2, bg: "rgba(90,40,120,0.85)" });
    board.position.set(0, 8, -R);
    scene.add(board);
    slimeArea = { x: 0, z: 0, r: 16 };
    spawn = new THREE.Vector3(0, 0, 17);
    exit = new THREE.Vector3(0, 0, 21.6);
    exitArch(scene, 0, 22.4, t("Keluar", "Exit"));
  }

  function update(dt: number, now: number) {
    animated.forEach((f) => f(dt, now));
    pickups.forEach((p, i) => {
      if (p.taken || p.kind !== "gem") return;
      p.mesh.rotation.y += dt * 1.8;
      p.mesh.position.y = 1.2 + Math.sin(now / 350 + i) * 0.25;
    });
  }

  function dispose() {
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose();
    });
  }

  return { id, scene, physics, spawn, spawnYaw: 0, exit, pickups, slimeArea, update, dispose };
}
