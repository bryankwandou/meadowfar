"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ---------- deterministic pseudo-random (seeded, no Math.random at module init) ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function terrainHeight(x: number, z: number) {
  return (
    Math.sin(x * 0.035) * Math.cos(z * 0.03) * 2.2 +
    Math.sin(x * 0.011 + 3) * Math.cos(z * 0.013 + 1) * 4.5 +
    Math.sin(x * 0.09) * Math.cos(z * 0.08) * 0.6
  );
}

type Hero = "girl" | "boy";

const QUEST_NOUNS = [
  ["bintang emas", 0xffd447],
  ["buah beri merah", 0xe14b4b],
  ["kristal biru", 0x4bb7e1],
  ["jamur ungu", 0x9b59d0],
  ["kunang cahaya", 0xb6ff6b],
] as const;

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<Hero | null>(null);
  const [quest, setQuest] = useState("");
  const [progress, setProgress] = useState("");
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState("");
  const joyRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!hero || !mountRef.current) return;
    const mount = mountRef.current;
    const rand = mulberry32(20260710);

    // ---------- renderer / scene ----------
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fd8ef);
    scene.fog = new THREE.Fog(0x9fd8ef, 60, 190);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500
    );

    const sun = new THREE.DirectionalLight(0xfff2d8, 2.4);
    sun.position.set(40, 70, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xcfeaff, 0x7cc26a, 1.1));

    // ---------- character (built from boxes, zero external assets) ----------
    const player = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xf1c6a0 });
    const cloth = new THREE.MeshStandardMaterial({
      color: hero === "girl" ? 0xe0559b : 0x3f7ede,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: hero === "girl" ? 0x6b3f22 : 0x2b2b2b,
    });
    const mk = (
      w: number, h: number, d: number,
      m: THREE.Material, x: number, y: number, z: number
    ) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      b.position.set(x, y, z);
      b.castShadow = true;
      player.add(b);
      return b;
    };
    mk(0.9, 1.1, 0.55, cloth, 0, 1.5, 0); // torso
    const head = mk(0.72, 0.72, 0.72, skin, 0, 2.5, 0);
    mk(0.8, 0.3, 0.8, hairMat, 0, 2.9, 0); // hair top
    if (hero === "girl") {
      mk(0.8, 0.9, 0.2, hairMat, 0, 2.45, -0.34); // long hair back
      mk(1.15, 0.5, 0.75, cloth, 0, 0.95, 0); // skirt
    }
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    mk(0.09, 0.12, 0.05, eyeMat, -0.16, 2.55, 0.37);
    mk(0.09, 0.12, 0.05, eyeMat, 0.16, 2.55, 0.37);
    const armL = mk(0.26, 0.9, 0.26, skin, -0.6, 1.5, 0);
    const armR = mk(0.26, 0.9, 0.26, skin, 0.6, 1.5, 0);
    const legL = mk(0.3, 0.95, 0.3, skin, -0.24, 0.55, 0);
    const legR = mk(0.3, 0.95, 0.3, skin, 0.24, 0.55, 0);
    void head;
    scene.add(player);
    player.position.set(0, terrainHeight(0, 0), 0);

    // ---------- chunked infinite world ----------
    const CHUNK = 48;
    const VIEW = 2; // chunks in each direction
    const chunks = new Map<string, THREE.Group>();
    const treeGeo = new THREE.ConeGeometry(2.2, 5, 7);
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.4, 6);
    const treeMats = [0x2e8b46, 0x3aa055, 0x27793c].map(
      (c) => new THREE.MeshStandardMaterial({ color: c })
    );
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a4d2b });
    const flowerMats = [0xffffff, 0xffd447, 0xff8fb3, 0xb28fff].map(
      (c) => new THREE.MeshStandardMaterial({ color: c })
    );
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, flatShading: true });

    function buildChunk(cx: number, cz: number) {
      const g = new THREE.Group();
      const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, 24, 24);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i) + cx * CHUNK;
        const wz = pos.getZ(i) + cz * CHUNK;
        pos.setY(i, terrainHeight(wx, wz));
      }
      geo.computeVertexNormals();
      const ground = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({ color: 0x6fc25f })
      );
      ground.receiveShadow = true;
      g.add(ground);

      // scatter props deterministically per chunk
      const n = 14;
      for (let i = 0; i < n; i++) {
        const r1 = hash2(cx * 91 + i * 7, cz * 57 + i * 13);
        const r2 = hash2(cx * 31 + i * 17, cz * 77 + i * 3);
        const x = cx * CHUNK + (r1 - 0.5) * CHUNK;
        const z = cz * CHUNK + (r2 - 0.5) * CHUNK;
        const y = terrainHeight(x, z);
        const kind = hash2(x, z);
        if (kind < 0.45) {
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.set(x, y + 1.2, z);
          trunk.castShadow = true;
          const top = new THREE.Mesh(treeGeo, treeMats[i % 3]);
          top.position.set(x, y + 4.5, z);
          top.castShadow = true;
          g.add(trunk, top);
        } else if (kind < 0.8) {
          const f = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 6, 6),
            flowerMats[i % 4]
          );
          f.position.set(x, y + 0.3, z);
          g.add(f);
        } else {
          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.8 + kind, 0),
            rockMat
          );
          rock.position.set(x, y + 0.4, z);
          rock.castShadow = true;
          g.add(rock);
        }
      }
      return g;
    }

    // ---------- quests + collectibles ----------
    let questIdx = 0;
    let need = 0;
    let got = 0;
    let items: THREE.Mesh[] = [];

    function clearItems() {
      items.forEach((m) => scene.remove(m));
      items = [];
    }
    function newQuest() {
      clearItems();
      const [noun, color] = QUEST_NOUNS[questIdx % QUEST_NOUNS.length];
      questIdx++;
      need = 4 + Math.floor(rand() * 4);
      got = 0;
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.55,
      });
      for (let i = 0; i < need; i++) {
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), mat);
        const ang = rand() * Math.PI * 2;
        const dist = 14 + rand() * 45;
        const x = player.position.x + Math.cos(ang) * dist;
        const z = player.position.z + Math.sin(ang) * dist;
        m.position.set(x, terrainHeight(x, z) + 1.4, z);
        scene.add(m);
        items.push(m);
      }
      setQuest(`Misi ${questIdx}: kumpulkan ${need} ${noun}`);
      setProgress(`0 / ${need}`);
    }
    newQuest();

    // ---------- input ----------
    const keys: Record<string, boolean> = {};
    const kd = (e: KeyboardEvent) => (keys[e.key.toLowerCase()] = true);
    const ku = (e: KeyboardEvent) => (keys[e.key.toLowerCase()] = false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ---------- main loop ----------
    let yaw = 0;
    let walk = 0;
    let last = performance.now();
    let raf = 0;
    let localScore = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let ix = 0, iz = 0;
      if (keys["w"] || keys["arrowup"]) iz -= 1;
      if (keys["s"] || keys["arrowdown"]) iz += 1;
      if (keys["a"] || keys["arrowleft"]) ix -= 1;
      if (keys["d"] || keys["arrowright"]) ix += 1;
      if (joyRef.current.active) {
        ix = joyRef.current.x;
        iz = joyRef.current.y;
      }
      const len = Math.hypot(ix, iz);
      if (len > 0.15) {
        const speed = 10;
        const dx = (ix / len) * speed * dt;
        const dz = (iz / len) * speed * dt;
        player.position.x += dx;
        player.position.z += dz;
        yaw = Math.atan2(dx, dz);
        walk += dt * 10;
        armL.rotation.x = Math.sin(walk) * 0.8;
        armR.rotation.x = -Math.sin(walk) * 0.8;
        legL.rotation.x = -Math.sin(walk) * 0.8;
        legR.rotation.x = Math.sin(walk) * 0.8;
      } else {
        armL.rotation.x *= 0.85;
        armR.rotation.x *= 0.85;
        legL.rotation.x *= 0.85;
        legR.rotation.x *= 0.85;
      }
      player.rotation.y += (yaw - player.rotation.y) * 0.2;
      player.position.y = terrainHeight(player.position.x, player.position.z);

      // camera follow
      const camTarget = new THREE.Vector3(
        player.position.x,
        player.position.y + 6.5,
        player.position.z + 11
      );
      camera.position.lerp(camTarget, 0.08);
      camera.lookAt(player.position.x, player.position.y + 2, player.position.z);
      sun.position.set(player.position.x + 40, 70, player.position.z + 20);
      sun.target.position.copy(player.position);
      sun.target.updateMatrixWorld();

      // stream chunks
      const pcx = Math.round(player.position.x / CHUNK);
      const pcz = Math.round(player.position.z / CHUNK);
      for (let dx2 = -VIEW; dx2 <= VIEW; dx2++)
        for (let dz2 = -VIEW; dz2 <= VIEW; dz2++) {
          const key = `${pcx + dx2},${pcz + dz2}`;
          if (!chunks.has(key)) {
            const c = buildChunk(pcx + dx2, pcz + dz2);
            chunks.set(key, c);
            scene.add(c);
          }
        }
      chunks.forEach((c, key) => {
        const [cx, cz] = key.split(",").map(Number);
        if (Math.abs(cx - pcx) > VIEW + 1 || Math.abs(cz - pcz) > VIEW + 1) {
          scene.remove(c);
          chunks.delete(key);
        }
      });

      // collectibles
      for (let i = items.length - 1; i >= 0; i--) {
        const m = items[i];
        m.rotation.y += dt * 2;
        m.position.y =
          terrainHeight(m.position.x, m.position.z) +
          1.4 + Math.sin(now / 300 + i) * 0.25;
        if (m.position.distanceTo(player.position) < 2.2) {
          scene.remove(m);
          items.splice(i, 1);
          got++;
          localScore += 10;
          setScore(localScore);
          setProgress(`${got} / ${need}`);
          if (got >= need) {
            setToast("Misi selesai. Petualangan baru dimulai...");
            setTimeout(() => setToast(""), 2500);
            newQuest();
          }
        }
      }

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [hero]);

  // ---------- virtual joystick (touch) ----------
  const joyStart = (e: React.TouchEvent<HTMLDivElement>) => {
    joyRef.current.active = true;
    joyMove(e);
  };
  const joyMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    const el = e.currentTarget.getBoundingClientRect();
    const cx = el.left + el.width / 2;
    const cy = el.top + el.height / 2;
    joyRef.current.x = Math.max(-1, Math.min(1, (t.clientX - cx) / 45));
    joyRef.current.y = Math.max(-1, Math.min(1, (t.clientY - cy) / 45));
  };
  const joyEnd = () => {
    joyRef.current = { x: 0, y: 0, active: false };
  };

  if (!hero)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-300 to-emerald-200 px-6 text-center">
        <h1 className="text-4xl font-bold text-emerald-900">
          Pilih penjelajahmu
        </h1>
        <p className="max-w-md text-emerald-800">
          Padang Meadowfar membentang tanpa ujung. Pilih satu tokoh, lalu
          berjalanlah ke arah mana pun yang kamu suka.
        </p>
        <div className="flex gap-6">
          <button
            onClick={() => setHero("girl")}
            className="rounded-2xl bg-pink-500 px-10 py-6 text-xl font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95"
          >
            Anak perempuan
          </button>
          <button
            onClick={() => setHero("boy")}
            className="rounded-2xl bg-blue-500 px-10 py-6 text-xl font-semibold text-white shadow-lg transition hover:scale-105 active:scale-95"
          >
            Anak laki-laki
          </button>
        </div>
      </div>
    );

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/45 px-4 py-3 text-white backdrop-blur">
        <p className="text-sm font-semibold">{quest}</p>
        <p className="text-xs opacity-80">Terkumpul: {progress}</p>
        <p className="mt-1 text-xs opacity-80">Skor: {score}</p>
      </div>
      <div className="pointer-events-none absolute right-4 top-4 rounded-xl bg-black/45 px-4 py-2 text-xs text-white backdrop-blur">
        WASD / panah untuk berjalan. Di layar sentuh, pakai tombol bulat kiri
        bawah.
      </div>
      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-amber-950 shadow-2xl">
          {toast}
        </div>
      )}
      <div
        onTouchStart={joyStart}
        onTouchMove={joyMove}
        onTouchEnd={joyEnd}
        className="absolute bottom-8 left-8 h-28 w-28 rounded-full border-4 border-white/50 bg-white/20 backdrop-blur md:hidden"
      />
    </div>
  );
}
