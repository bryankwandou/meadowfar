"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  HEROES,
  SKILLS,
  TOOLS,
  ACHIEVEMENTS,
  levelFromXp,
  xpForLevel,
  defaultProgress,
  sanitizeProgress,
  applyUnlocks,
  type HeroId,
  type Progress,
} from "@/lib/progression";

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

const QUEST_NOUNS = [
  ["bintang emas", 0xffd447],
  ["buah beri merah", 0xe14b4b],
  ["kristal biru", 0x4bb7e1],
  ["jamur ungu", 0x9b59d0],
  ["kunang cahaya", 0xb6ff6b],
] as const;

const GUEST_KEY = "meadowfar-progress";

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<HeroId | null>(null);
  const [quest, setQuest] = useState("");
  const [progressText, setProgressText] = useState("");
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState("");
  const [arrow, setArrow] = useState(0);
  const [user, setUser] = useState<string | null>(null);
  const [prog, setProg] = useState<Progress | null>(null);
  const [hudLevel, setHudLevel] = useState(1);
  const [hudXp, setHudXp] = useState(0);
  const [showBook, setShowBook] = useState(false);
  const joyRef = useRef({ x: 0, y: 0, active: false });
  const jumpRef = useRef(false);
  const progRef = useRef<Progress>(defaultProgress());
  const userRef = useRef<string | null>(null);
  const toastQueue = useRef<string[]>([]);
  const toastBusy = useRef(false);

  // ---------- load account + saved progress ----------
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (me.user) {
          userRef.current = me.user.username;
          setUser(me.user.username);
          const p = await fetch("/api/progress").then((r) => r.json());
          const clean = sanitizeProgress(p.progress);
          progRef.current = clean;
          setProg(clean);
          setHudLevel(levelFromXp(clean.xp));
          setHudXp(clean.xp);
          return;
        }
      } catch {}
      // guest: local save only
      let clean = defaultProgress();
      try {
        clean = sanitizeProgress(JSON.parse(localStorage.getItem(GUEST_KEY) || "null"));
      } catch {}
      progRef.current = clean;
      setProg(clean);
      setHudLevel(levelFromXp(clean.xp));
      setHudXp(clean.xp);
    })();
  }, []);

  function pushToast(msg: string) {
    toastQueue.current.push(msg);
    if (toastBusy.current) return;
    toastBusy.current = true;
    const next = () => {
      const m = toastQueue.current.shift();
      if (!m) {
        toastBusy.current = false;
        setToast("");
        return;
      }
      setToast(m);
      setTimeout(next, 2300);
    };
    next();
  }

  async function save() {
    const p = progRef.current;
    if (userRef.current) {
      try {
        await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p),
        });
      } catch {}
    } else {
      try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(p));
      } catch {}
    }
  }

  useEffect(() => {
    if (!hero || !mountRef.current) return;
    const mount = mountRef.current;
    const rand = mulberry32(20260710);
    const heroDef = HEROES.find((h) => h.id === hero)!;
    progRef.current.lastHero = hero;

    const has = (skill: string) => progRef.current.skills.includes(skill);
    const toolBonus = () =>
      Math.max(
        0,
        ...TOOLS.filter((t) => progRef.current.tools.includes(t.id)).map((t) => t.bonus)
      );

    function award(id: string) {
      const p = progRef.current;
      if (p.achievements.includes(id)) return;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return;
      p.achievements = [...p.achievements, id];
      pushToast(`Prestasi terbuka: ${def.nama}`);
    }

    function gainXp(amount: number) {
      const p = progRef.current;
      const before = levelFromXp(p.xp);
      p.xp += amount;
      const after = levelFromXp(p.xp);
      setHudXp(p.xp);
      if (after > before) {
        const upgraded = applyUnlocks(p);
        const newHeroes = upgraded.heroes.filter((h) => !p.heroes.includes(h));
        const newSkills = upgraded.skills.filter((s) => !p.skills.includes(s));
        const newTools = upgraded.tools.filter((t) => !p.tools.includes(t));
        Object.assign(p, upgraded);
        setHudLevel(after);
        pushToast(`Naik ke level ${after}!`);
        newHeroes.forEach((h) =>
          pushToast(`Tokoh baru: ${HEROES.find((x) => x.id === h)?.nama}`)
        );
        newSkills.forEach((s) =>
          pushToast(`Keahlian baru: ${SKILLS.find((x) => x.id === s)?.nama}`)
        );
        newTools.forEach((t) =>
          pushToast(`Perlengkapan baru: ${TOOLS.find((x) => x.id === t)?.nama}`)
        );
        if (after >= 5) award("level-5");
        if (after >= 10) award("level-10");
        setProg({ ...p });
      }
    }

    // soft collect chime, generated in code (no audio files)
    let audioCtx: AudioContext | null = null;
    function chime(freq: number) {
      try {
        audioCtx = audioCtx || new AudioContext();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.15, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        o.connect(g).connect(audioCtx.destination);
        o.start();
        o.stop(audioCtx.currentTime + 0.5);
      } catch {}
    }

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

    // drifting clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.85,
    });
    const clouds: THREE.Group[] = [];
    for (let i = 0; i < 10; i++) {
      const c = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(2.5 + rand() * 2, 7, 7),
          cloudMat
        );
        puff.position.set((j - 1.5) * 3, rand() * 1.2, rand() * 2);
        c.add(puff);
      }
      c.position.set((rand() - 0.5) * 220, 32 + rand() * 12, (rand() - 0.5) * 220);
      scene.add(c);
      clouds.push(c);
    }

    // butterflies
    const butterflies: { g: THREE.Group; w1: THREE.Mesh; w2: THREE.Mesh; a: number }[] = [];
    const wingGeo = new THREE.PlaneGeometry(0.4, 0.3);
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const wm = new THREE.MeshBasicMaterial({
        color: [0xffa1c6, 0xa1d9ff, 0xfff3a1][i % 3], side: THREE.DoubleSide,
      });
      const w1 = new THREE.Mesh(wingGeo, wm);
      const w2 = new THREE.Mesh(wingGeo, wm);
      w1.position.x = -0.2;
      w2.position.x = 0.2;
      g.add(w1, w2);
      g.position.set((rand() - 0.5) * 60, 3 + rand() * 2, (rand() - 0.5) * 60);
      scene.add(g);
      butterflies.push({ g, w1, w2, a: rand() * Math.PI * 2 });
    }

    // wandering bunnies
    const bunnies: { g: THREE.Group; a: number; s: number }[] = [];
    const bunnyBody = new THREE.MeshStandardMaterial({ color: 0xf5f0e8 });
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), bunnyBody);
      body.position.y = 0.4;
      const headB = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bunnyBody);
      headB.position.set(0, 0.85, 0.3);
      const earGeo = new THREE.CapsuleGeometry(0.07, 0.35, 2, 6);
      const e1 = new THREE.Mesh(earGeo, bunnyBody);
      const e2 = new THREE.Mesh(earGeo, bunnyBody);
      e1.position.set(-0.12, 1.25, 0.25);
      e2.position.set(0.12, 1.25, 0.25);
      g.add(body, headB, e1, e2);
      g.position.set((rand() - 0.5) * 70, 0, (rand() - 0.5) * 70);
      scene.add(g);
      bunnies.push({ g, a: rand() * Math.PI * 2, s: 1.2 + rand() * 1.5 });
    }

    // ---------- character (built from boxes, zero external assets) ----------
    const player = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: heroDef.skin });
    const cloth = new THREE.MeshStandardMaterial({ color: heroDef.cloth });
    const hairMat = new THREE.MeshStandardMaterial({ color: heroDef.hair });
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
    mk(0.72, 0.72, 0.72, skin, 0, 2.5, 0); // head
    mk(0.8, 0.3, 0.8, hairMat, 0, 2.9, 0); // hair top
    if (hero === "girl") {
      mk(0.8, 0.9, 0.2, hairMat, 0, 2.45, -0.34); // long hair back
      mk(1.15, 0.5, 0.75, cloth, 0, 0.95, 0); // skirt
    }
    if (hero === "knight") {
      const helm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.46, 0.5, 8),
        new THREE.MeshStandardMaterial({ color: 0xd7dde6, metalness: 0.4 })
      );
      helm.position.set(0, 3.0, 0);
      player.add(helm);
    }
    if (hero === "wizard") {
      const hat = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.1, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a35a8 })
      );
      hat.position.set(0, 3.4, 0);
      player.add(hat);
    }
    if (hero === "explorer") {
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 0.08, 10),
        new THREE.MeshStandardMaterial({ color: 0x8a6a3b })
      );
      brim.position.set(0, 2.92, 0);
      player.add(brim);
    }
    if (hero === "robot") {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xff5a5a })
      );
      antenna.position.set(0, 3.3, 0);
      player.add(antenna);
    }
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    mk(0.09, 0.12, 0.05, eyeMat, -0.16, 2.55, 0.37);
    mk(0.09, 0.12, 0.05, eyeMat, 0.16, 2.55, 0.37);
    const armL = mk(0.26, 0.9, 0.26, skin, -0.6, 1.5, 0);
    const armR = mk(0.26, 0.9, 0.26, skin, 0.6, 1.5, 0);
    const legL = mk(0.3, 0.95, 0.3, skin, -0.24, 0.55, 0);
    const legR = mk(0.3, 0.95, 0.3, skin, 0.24, 0.55, 0);
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
      setProgressText(`0 / ${need}`);
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

    // periodic cloud save
    const saveTimer = setInterval(save, 15000);
    const onLeave = () => save();
    window.addEventListener("beforeunload", onLeave);

    // ---------- main loop ----------
    let yaw = 0;
    let walk = 0;
    let jumpY = 0;
    let vy = 0;
    let airborne = false;
    let usedDouble = false;
    let jumpHeld = false;
    let last = performance.now();
    let raf = 0;
    let localScore = 0;

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const p = progRef.current;

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
        const sprinting = has("sprint") && (keys["shift"] || len > 0.95);
        const speed = sprinting ? 16 : 10;
        const dx = (ix / len) * speed * dt;
        const dz = (iz / len) * speed * dt;
        player.position.x += dx;
        player.position.z += dz;
        p.distance += Math.hypot(dx, dz);
        if (p.distance >= 1000) award("walk-1000");
        if (p.distance >= 10000) award("walk-10000");
        yaw = Math.atan2(dx, dz);
        walk += dt * (sprinting ? 14 : 10);
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

      // jump: single, plus double jump and glide when unlocked
      const jumpPressed = keys[" "] || jumpRef.current;
      const jumpPower = has("rocket") ? 12 : 9;
      if (jumpPressed && !jumpHeld) {
        if (!airborne) {
          vy = jumpPower;
          airborne = true;
          usedDouble = false;
          p.jumps++;
          if (p.jumps >= 100) award("jump-100");
          chime(660);
        } else if (has("doublejump") && !usedDouble) {
          vy = jumpPower * 0.85;
          usedDouble = true;
          p.jumps++;
          chime(740);
        }
      }
      jumpHeld = jumpPressed;
      jumpRef.current = false;
      if (airborne) {
        vy -= 25 * dt;
        if (has("glide") && jumpPressed && vy < -3) vy = -3;
        jumpY = Math.max(0, jumpY + vy * dt);
        if (jumpY === 0 && vy < 0) {
          vy = 0;
          airborne = false;
        }
      }
      player.position.y =
        terrainHeight(player.position.x, player.position.z) + jumpY;

      // ambient life
      clouds.forEach((c, i) => {
        c.position.x += dt * (1.5 + (i % 3) * 0.5);
        if (c.position.x - player.position.x > 130) c.position.x -= 260;
        c.position.z +=
          (player.position.z - c.position.z > 130 ? 260 : 0) -
          (c.position.z - player.position.z > 130 ? 260 : 0);
      });
      butterflies.forEach((b, i) => {
        b.a += dt * 0.6;
        b.g.position.x += Math.cos(b.a) * dt * 3;
        b.g.position.z += Math.sin(b.a) * dt * 3;
        const gy = terrainHeight(b.g.position.x, b.g.position.z);
        b.g.position.y = gy + 2.5 + Math.sin(now / 250 + i) * 0.5;
        const flap = Math.sin(now / 60 + i) * 0.9;
        b.w1.rotation.y = flap;
        b.w2.rotation.y = -flap;
        if (b.g.position.distanceTo(player.position) > 90)
          b.g.position.set(
            player.position.x + (hash2(i, now | 0) - 0.5) * 50,
            0,
            player.position.z + (hash2(now | 0, i) - 0.5) * 50
          );
      });
      bunnies.forEach((b, i) => {
        b.a += (hash2(i, Math.floor(now / 2000)) - 0.5) * dt * 3;
        b.g.position.x += Math.sin(b.a) * b.s * dt;
        b.g.position.z += Math.cos(b.a) * b.s * dt;
        b.g.rotation.y = b.a;
        const gy = terrainHeight(b.g.position.x, b.g.position.z);
        b.g.position.y = gy + Math.abs(Math.sin(now / 220 + i)) * 0.35;
        if (b.g.position.distanceTo(player.position) > 90)
          b.g.position.set(
            player.position.x + (hash2(i * 3, i) - 0.5) * 40,
            0,
            player.position.z + (hash2(i, i * 7) - 0.5) * 40
          );
      });

      // arrow toward nearest quest item
      if (items.length) {
        let nearest = items[0];
        let nd = Infinity;
        for (const m of items) {
          const d = m.position.distanceTo(player.position);
          if (d < nd) {
            nd = d;
            nearest = m;
          }
        }
        setArrow(
          Math.atan2(
            nearest.position.x - player.position.x,
            -(nearest.position.z - player.position.z)
          )
        );
      }

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

      // collectibles (magnet skill pulls nearby items in)
      for (let i = items.length - 1; i >= 0; i--) {
        const m = items[i];
        m.rotation.y += dt * 2;
        const dist = m.position.distanceTo(player.position);
        if (has("magnet") && dist < 9 && dist > 2) {
          m.position.lerp(
            new THREE.Vector3(
              player.position.x,
              player.position.y + 1.2,
              player.position.z
            ),
            dt * 3
          );
        } else {
          m.position.y =
            terrainHeight(m.position.x, m.position.z) +
            1.4 + Math.sin(now / 300 + i) * 0.25;
        }
        if (dist < 2.2) {
          scene.remove(m);
          items.splice(i, 1);
          got++;
          localScore += 10 + toolBonus();
          p.itemsCollected++;
          gainXp(10);
          award("first-item");
          if (p.itemsCollected >= 25) award("items-25");
          if (p.itemsCollected >= 100) award("items-100");
          if (p.itemsCollected >= 500) award("items-500");
          chime(880 + got * 40);
          setScore(localScore);
          if (localScore > p.bestScore) {
            p.bestScore = localScore;
            setProg({ ...p });
          }
          setProgressText(`${got} / ${need}`);
          if (got >= need) {
            p.missionsDone++;
            gainXp(30);
            award("quest-1");
            if (p.missionsDone >= 10) award("quest-10");
            if (p.missionsDone >= 50) award("quest-50");
            pushToast("Misi selesai! Petualangan baru dimulai...");
            save();
            newQuest();
          }
        }
      }

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(saveTimer);
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", onResize);
      save();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!prog)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-300 to-emerald-200">
        <p className="text-lg font-semibold text-emerald-900">Memuat petualanganmu...</p>
      </div>
    );

  if (!hero) {
    const level = levelFromXp(prog.xp);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-300 to-emerald-200 px-6 py-12 text-center">
        <div>
          <h1 className="text-4xl font-bold text-emerald-900">Pilih penjelajahmu</h1>
          <p className="mx-auto mt-3 max-w-md text-emerald-800">
            {user
              ? `Halo, ${user}! Level ${level} — progresmu tersimpan di akun.`
              : "Bermain sebagai tamu. Progres tersimpan di perangkat ini saja — buat akun agar aman."}
          </p>
        </div>
        <div className="grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-3">
          {HEROES.map((h) => {
            const unlocked = prog.heroes.includes(h.id);
            return (
              <button
                key={h.id}
                disabled={!unlocked}
                onClick={() => setHero(h.id)}
                className={`relative rounded-2xl px-6 py-6 text-lg font-semibold shadow-lg transition ${
                  unlocked
                    ? "bg-white text-emerald-900 hover:scale-105 active:scale-95"
                    : "cursor-not-allowed bg-white/40 text-emerald-900/40"
                }`}
              >
                <span
                  className="mx-auto mb-3 block h-10 w-10 rounded-full"
                  style={{ background: `#${h.cloth.toString(16).padStart(6, "0")}` }}
                />
                {h.nama}
                {!unlocked && (
                  <span className="mt-1 block text-xs font-normal">
                    Terbuka di level {h.level}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 text-sm">
          {!user && (
            <>
              <a href="/daftar" className="rounded-xl bg-emerald-700 px-5 py-2 font-semibold text-white">
                Daftar
              </a>
              <a href="/masuk" className="rounded-xl border border-emerald-700 px-5 py-2 font-semibold text-emerald-800">
                Masuk
              </a>
            </>
          )}
        </div>
      </div>
    );
  }

  const level = hudLevel;
  const xpNow = hudXp - xpForLevel(level);
  const xpNext = xpForLevel(level + 1) - xpForLevel(level);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/45 px-4 py-3 text-white backdrop-blur">
        <p className="text-sm font-semibold">{quest}</p>
        <p className="text-xs opacity-80">Terkumpul: {progressText}</p>
        <p className="mt-1 text-xs opacity-80">Skor: {score}</p>
        <p className="text-xs opacity-80">Rekor: {prog.bestScore}</p>
        <div className="mt-2">
          <p className="text-xs font-semibold text-amber-300">Level {level}</p>
          <div className="mt-1 h-1.5 w-36 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${Math.min(100, (xpNow / xpNext) * 100)}%` }}
            />
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-black/45 p-3 text-2xl text-amber-300 backdrop-blur"
        style={{ transform: `translateX(-50%) rotate(${arrow}rad)` }}
      >
        &uarr;
      </div>
      <div className="pointer-events-none absolute right-4 top-4 rounded-xl bg-black/45 px-4 py-2 text-xs text-white backdrop-blur">
        WASD / panah jalan · Spasi lompat{" "}
        {prog.skills.includes("sprint") && "· Shift lari"}
      </div>
      <button
        onClick={() => setShowBook(true)}
        className="absolute right-4 top-16 rounded-xl bg-black/45 px-4 py-2 text-xs font-semibold text-amber-300 backdrop-blur"
      >
        Buku petualang
      </button>
      {toast && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-amber-950 shadow-2xl">
          {toast}
        </div>
      )}
      {showBook && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-emerald-950 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Buku petualang</h2>
              <button
                onClick={() => setShowBook(false)}
                className="rounded-full bg-emerald-100 px-4 py-1 font-semibold"
              >
                Tutup
              </button>
            </div>
            <p className="mt-2 text-sm text-emerald-700">
              Level {level} · {prog.itemsCollected} item · {prog.missionsDone} misi ·{" "}
              {Math.round(prog.distance)} m berjalan
            </p>
            <h3 className="mt-5 font-semibold">Keahlian</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {SKILLS.map((s) => (
                <li key={s.id} className={prog.skills.includes(s.id) ? "" : "opacity-40"}>
                  {prog.skills.includes(s.id) ? "✓" : `Lv ${s.level}`} — {s.nama}:{" "}
                  {s.keterangan}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 font-semibold">Perlengkapan</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {TOOLS.map((t) => (
                <li key={t.id} className={prog.tools.includes(t.id) ? "" : "opacity-40"}>
                  {prog.tools.includes(t.id) ? "✓" : `Lv ${t.level}`} — {t.nama}
                  {t.bonus > 0 && ` (+${t.bonus} skor per item)`}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 font-semibold">
              Prestasi ({prog.achievements.length}/{ACHIEVEMENTS.length})
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {ACHIEVEMENTS.map((a) => (
                <li
                  key={a.id}
                  className={prog.achievements.includes(a.id) ? "" : "opacity-40"}
                >
                  {prog.achievements.includes(a.id) ? "★" : "☆"} {a.nama} — {a.keterangan}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div
        onTouchStart={joyStart}
        onTouchMove={joyMove}
        onTouchEnd={joyEnd}
        className="absolute bottom-8 left-8 h-28 w-28 rounded-full border-4 border-white/50 bg-white/20 backdrop-blur md:hidden"
      />
      <button
        onTouchStart={() => (jumpRef.current = true)}
        className="absolute bottom-10 right-8 h-20 w-20 rounded-full border-4 border-white/50 bg-amber-400/70 text-sm font-bold text-amber-950 backdrop-blur md:hidden"
      >
        Lompat
      </button>
    </div>
  );
}
