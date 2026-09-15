// Real rendered icons for the wardrobe and inventory. One small shared WebGL
// renderer draws each item once, as the actual 3D model, and caches the PNG.

import * as THREE from "three";
import { buildAvatar, type Equip } from "./avatar";
import { COSMETICS, DEFAULT_EQUIP, type Slot } from "@/lib/catalog";
import { HEROES, type HeroId } from "@/lib/progression";

const SIZE = 192;
const cache = new Map<string, string>();
const waiting = new Map<string, ((url: string) => void)[]>();
const queue: { key: string; make: () => { scene: THREE.Scene; cam: THREE.Camera; dispose: () => void } }[] = [];
let renderer: THREE.WebGLRenderer | null = null;
let busy = false;

function getRenderer() {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  return renderer;
}

function studio(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xf4fbff, 0x9a8f7a, 1.5));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.6);
  key.position.set(3, 5, 5);
  const rim = new THREE.DirectionalLight(0xbfe0ff, 1.6);
  rim.position.set(-4, 3, -4);
  scene.add(key, rim);
}

function pump() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  requestAnimationFrame(() => {
    try {
      const r = getRenderer();
      const { scene, cam, dispose } = job.make();
      r.render(scene, cam);
      const url = r.domElement.toDataURL("image/png");
      dispose();
      cache.set(job.key, url);
      (waiting.get(job.key) ?? []).forEach((cb) => cb(url));
    } catch {
      cache.set(job.key, "");
    }
    waiting.delete(job.key);
    busy = false;
    pump();
  });
}

function request(key: string, make: (typeof queue)[number]["make"], cb: (url: string) => void) {
  const hit = cache.get(key);
  if (hit !== undefined) return cb(hit);
  const list = waiting.get(key);
  if (list) return list.push(cb);
  waiting.set(key, [cb]);
  queue.push({ key, make });
  pump();
}

const FRAMES: Record<Slot, { pos: [number, number, number]; look: [number, number, number]; fov: number; turn: number }> = {
  hat: { pos: [1.5, 3.3, 2.6], look: [0, 2.72, 0], fov: 30, turn: 0 },
  outfit: { pos: [1.6, 2.2, 6.2], look: [0, 1.55, 0], fov: 30, turn: 0 },
  cape: { pos: [-1.8, 2.2, -5.2], look: [0, 1.6, 0], fov: 32, turn: 0 },
  back: { pos: [-1.8, 2.3, -4.2], look: [0, 1.8, 0], fov: 32, turn: 0 },
  shoes: { pos: [1.8, 0.6, 2.2], look: [0, 0.15, 0], fov: 30, turn: 0 },
};

export function cosmeticThumb(hero: HeroId, id: string, cb: (url: string) => void) {
  const def = COSMETICS.find((c) => c.id === id);
  if (!def) return cb("");
  request(`c:${hero}:${id}`, () => {
    const scene = new THREE.Scene();
    studio(scene);
    const equip: Equip = { ...DEFAULT_EQUIP, [def.slot]: id };
    const av = buildAvatar(HEROES.find((h) => h.id === hero) ?? HEROES[0], equip);
    av.tick(1200, 0.2);
    scene.add(av.root);
    const f = FRAMES[def.slot];
    const cam = new THREE.PerspectiveCamera(f.fov, 1, 0.05, 50);
    cam.position.set(...f.pos);
    cam.lookAt(...f.look);
    return { scene, cam, dispose: () => av.dispose() };
  }, cb);
}

// ---------- consumables and ingredients ----------
function M(color: number, rough = 0.5, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
}

function itemModel(id: string): THREE.Object3D {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(x, y, z);
    g.add(o);
    return o;
  };
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.22, 0.2, 0, 0.5);
  leafShape.quadraticCurveTo(-0.22, 0.2, 0, 0);
  const leafM = M(0x4e9a3c, 0.6, { side: THREE.DoubleSide });
  switch (id) {
    case "apple": {
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const t = (i / 20) * Math.PI;
        const r = Math.sin(t) * (0.62 + 0.08 * Math.sin(t * 2));
        pts.push(new THREE.Vector2(r, -Math.cos(t) * 0.58 - (t < 0.4 ? 0.08 * (1 - t / 0.4) : 0)));
      }
      const body = add(new THREE.LatheGeometry(pts, 32), M(0xd8323a, 0.35));
      body.scale.set(1, 0.95, 1);
      add(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 8), M(0x5b3a1f, 0.8), 0.03, 0.62, 0).rotation.z = -0.25;
      const leaf = add(new THREE.ShapeGeometry(leafShape, 8), leafM, 0.12, 0.62, 0);
      leaf.rotation.set(0.4, 0.3, -1.1);
      add(new THREE.SphereGeometry(0.16, 12, 8), M(0xf5d06a, 0.4, { transparent: true, opacity: 0.35 }), -0.25, 0.2, 0.5);
      break;
    }
    case "pie": {
      add(new THREE.CylinderGeometry(0.85, 0.7, 0.32, 36), M(0xd9a35a, 0.75));
      add(new THREE.TorusGeometry(0.8, 0.09, 10, 36), M(0xe8b870, 0.7), 0, 0.16, 0).rotation.x = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.74, 0.74, 0.04, 36), M(0x6b1f4a, 0.35), 0, 0.15, 0);
      for (let i = -2; i <= 2; i++) {
        add(new THREE.BoxGeometry(1.45 - Math.abs(i) * 0.28, 0.05, 0.1), M(0xe8b870, 0.7), 0, 0.2, i * 0.28);
        add(new THREE.BoxGeometry(0.1, 0.05, 1.45 - Math.abs(i) * 0.28), M(0xe0ad68, 0.7), i * 0.28, 0.22, 0);
      }
      g.rotation.x = 0.5;
      break;
    }
    case "candy": {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.28 : 0.62;
        const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const star = add(new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3 }), M(0xffc83a, 0.25, { emissive: 0x6a4a00, emissiveIntensity: 0.3 }));
      star.position.z = -0.11;
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), M(0xf4efe6, 0.6), 0, -0.9, 0);
      break;
    }
    case "gem": {
      const top = add(new THREE.ConeGeometry(0.62, 0.35, 8), M(0x7fe7ff, 0.08, { metalness: 0.2, flatShading: true, emissive: 0x0a4a5a, emissiveIntensity: 0.4 }), 0, 0.17, 0);
      top.rotation.y = Math.PI / 8;
      const bottom = add(new THREE.ConeGeometry(0.62, 0.8, 8), M(0x4fc9ea, 0.08, { metalness: 0.2, flatShading: true }), 0, -0.4, 0);
      bottom.rotation.x = Math.PI;
      g.rotation.set(0.35, 0.3, 0);
      break;
    }
    case "shell": {
      for (let i = 0; i < 9; i++) {
        const a = -0.9 + i * 0.225;
        const rib = add(new THREE.CapsuleGeometry(0.085, 0.75, 4, 8), M(i % 2 ? 0xffd9c2 : 0xf2b99a, 0.45), Math.sin(a) * 0.38, Math.cos(a) * 0.38 - 0.1, 0);
        rib.rotation.z = -a;
      }
      add(new THREE.BoxGeometry(0.34, 0.16, 0.16), M(0xe8a98a, 0.5), 0, -0.52, 0);
      g.rotation.x = -0.3;
      break;
    }
    case "berry": {
      const bm = M(0xb32342, 0.25);
      [[0, 0, 0], [0.34, 0.08, 0.05], [-0.3, 0.1, 0.1], [0.05, 0.36, 0.05], [0.18, -0.3, 0.1], [-0.2, -0.26, 0]].forEach(([x, y, z]) => {
        add(new THREE.SphereGeometry(0.24, 16, 12), bm, x, y, z);
        add(new THREE.SphereGeometry(0.05, 6, 4), M(0xffffff, 0.2, { transparent: true, opacity: 0.6 }), x - 0.08, y + 0.1, z + 0.2);
      });
      for (let i = 0; i < 2; i++) {
        const l = add(new THREE.ShapeGeometry(leafShape, 8), leafM, -0.1 + i * 0.3, 0.45, -0.1);
        l.rotation.z = -0.8 + i * 1.4;
      }
      break;
    }
    case "flower": {
      add(new THREE.CylinderGeometry(0.03, 0.035, 1.0, 8), M(0x4e9a3c, 0.6), 0, -0.55, 0);
      const petalM = M(0xf2a8c8, 0.45);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const p = add(new THREE.SphereGeometry(0.2, 12, 8), petalM, Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0);
        p.scale.set(1.3, 0.7, 0.3);
        p.rotation.z = a;
      }
      add(new THREE.SphereGeometry(0.14, 12, 10), M(0xf2b01e, 0.5), 0, 0, 0.06);
      const l = add(new THREE.ShapeGeometry(leafShape, 8), leafM, 0.02, -0.7, 0);
      l.rotation.z = -0.9;
      break;
    }
    case "mushroom": {
      add(new THREE.CylinderGeometry(0.16, 0.22, 0.6, 16), M(0xf2e8d5, 0.7), 0, -0.3, 0);
      add(new THREE.SphereGeometry(0.58, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xc9543a, 0.5), 0, -0.02, 0).scale.y = 0.75;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        add(new THREE.SphereGeometry(0.06, 8, 6), M(0xfff6e6, 0.6), Math.cos(a) * 0.32, 0.3, Math.sin(a) * 0.32);
      }
      g.rotation.x = 0.35;
      break;
    }
    case "tea": {
      const cup = add(new THREE.CylinderGeometry(0.5, 0.36, 0.62, 28, 1, true), M(0xf7f3ec, 0.25, { side: THREE.DoubleSide }));
      cup.position.y = -0.05;
      add(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 28), M(0xf7f3ec, 0.25), 0, -0.36, 0);
      add(new THREE.CylinderGeometry(0.47, 0.47, 0.02, 28), M(0xc98a3a, 0.15), 0, 0.18, 0);
      add(new THREE.TorusGeometry(0.17, 0.05, 8, 16), M(0xf7f3ec, 0.25), 0.55, -0.05, 0);
      add(new THREE.CylinderGeometry(0.75, 0.75, 0.05, 32), M(0xf0e9dd, 0.3), 0, -0.4, 0);
      g.rotation.x = 0.45;
      break;
    }
    case "soup": {
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector2(0.2 + Math.sin((i / 12) * Math.PI / 2) * 0.55, -0.4 + (i / 12) * 0.5));
      add(new THREE.LatheGeometry(pts, 32), M(0x5f7fa8, 0.35, { side: THREE.DoubleSide }));
      add(new THREE.CylinderGeometry(0.7, 0.7, 0.02, 32), M(0xb98a5a, 0.3), 0, 0.02, 0);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        add(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0xc9543a, 0.5), Math.cos(a) * 0.35, 0.03, Math.sin(a) * 0.35);
      }
      g.rotation.x = 0.6;
      break;
    }
    case "charm": {
      add(new THREE.TorusGeometry(0.55, 0.06, 12, 40), M(0xd6b25e, 0.25, { metalness: 0.8 }));
      const gem = add(new THREE.OctahedronGeometry(0.32), M(0x9fe8ff, 0.05, { flatShading: true, emissive: 0x2a8aa8, emissiveIntensity: 0.5 }));
      gem.scale.y = 1.35;
      add(new THREE.TorusGeometry(0.1, 0.03, 8, 16), M(0xd6b25e, 0.25, { metalness: 0.8 }), 0, 0.62, 0);
      break;
    }
    default:
      add(new THREE.IcosahedronGeometry(0.5, 1), M(0xcccccc));
  }
  return g;
}

export function itemThumb(id: string, cb: (url: string) => void) {
  request(`i:${id}`, () => {
    const scene = new THREE.Scene();
    studio(scene);
    const model = itemModel(id);
    model.rotation.y += 0.5;
    scene.add(model);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    cam.position.set(0, 0.5, 4.6);
    cam.lookAt(0, 0, 0);
    return {
      scene,
      cam,
      dispose: () =>
        model.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            (o.material as THREE.Material).dispose();
          }
        }),
    };
  }, cb);
}
