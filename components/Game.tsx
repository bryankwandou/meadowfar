"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  HEROES,
  SKILLS,
  TOOLS,
  PETS,
  DECORS,
  ACHIEVEMENTS,
  levelFromXp,
  xpForLevel,
  defaultProgress,
  sanitizeProgress,
  applyUnlocks,
  earnedDecors,
  type HeroId,
  type Progress,
} from "@/lib/progression";
import { STORY } from "@/lib/story";
import { UI, QUEST_NOUN_NAMES, detectLang, saveLang, pick, type Lang } from "@/lib/i18n";

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

type Biome = "grass" | "desert" | "snow";
function biomeAt(x: number, z: number): Biome {
  const n =
    Math.sin(x * 0.004 + 7) * Math.cos(z * 0.0035 + 2) +
    Math.sin((x + z) * 0.002);
  if (n > 0.9) return "desert";
  if (n < -0.9) return "snow";
  return "grass";
}

const WATER_Y = -3.1;

const QUEST_NOUNS = [
  ["bintang emas", 0xffd447],
  ["buah beri merah", 0xe14b4b],
  ["kristal biru", 0x4bb7e1],
  ["jamur ungu", 0x9b59d0],
  ["kunang cahaya", 0xb6ff6b],
] as const;

const GUEST_KEY = "meadowfar-progress";
const DAY_SECONDS = 240; // full day-night cycle length

// Quest variety: the rotation keeps play from turning into one long fetch loop.
type QuestKind = "collect" | "race" | "treasure" | "delivery" | "shard";
const QUEST_ROTATION: QuestKind[] = [
  "collect", "race", "collect", "treasure",
  "collect", "delivery", "race", "shard",
];

// Photo-mode stickers. Emoji keeps this asset-free and renders everywhere.
const STICKERS = ["⭐", "🌟", "🐰", "🦊", "🐦", "🌸", "🍄", "🌈", "🎈", "👑", "😄", "❤️"];

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<HeroId | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const langRef = useRef<Lang>("en");
  const [questData, setQuestData] = useState<{ num: number; need: number; noun: string } | null>(null);
  const [questKind, setQuestKind] = useState<QuestKind>("collect");
  const [raceTime, setRaceTime] = useState<number | null>(null);
  const [raceGates, setRaceGates] = useState<{ done: number; total: number } | null>(null);
  const [showHome, setShowHome] = useState(false);
  const [gfx, setGfx] = useState<"auto" | "low" | "high">("auto");
  const [photoMode, setPhotoMode] = useState(false);
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [placedStickers, setPlacedStickers] = useState<
    { e: string; x: number; y: number }[]
  >([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const limitRef = useRef(0); // daily minutes allowed; 0 = no limit
  const captureRef = useRef(false);
  const onCaptureRef = useRef<((url: string) => void) | null>(null);
  const [progressText, setProgressText] = useState("");
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState("");
  const [arrow, setArrow] = useState(0);
  const [user, setUser] = useState<string | null>(null);
  const [prog, setProg] = useState<Progress | null>(null);
  const [hudLevel, setHudLevel] = useState(1);
  const [hudXp, setHudXp] = useState(0);
  const [showBook, setShowBook] = useState(false);
  const [npcNear, setNpcNear] = useState(false);
  const [storyOpen, setStoryOpen] = useState<number | null>(null); // chapter being read
  const [musicOn, setMusicOn] = useState(true);
  const joyRef = useRef({ x: 0, y: 0, active: false });
  const jumpRef = useRef(false);
  const talkRef = useRef(false);
  const progRef = useRef<Progress>(defaultProgress());
  const userRef = useRef<string | null>(null);
  const musicRef = useRef(true);
  const syncDecorRef = useRef<(() => void) | null>(null);
  const goHomeRef = useRef<(() => void) | null>(null);
  const toastQueue = useRef<string[]>([]);
  const toastBusy = useRef(false);

  // ---------- load account + saved progress ----------
  useEffect(() => {
    const l = detectLang();
    setLang(l);
    langRef.current = l;
    try {
      const m = localStorage.getItem("meadowfar-music");
      if (m === "off") {
        setMusicOn(false);
        musicRef.current = false;
      }
      const q = localStorage.getItem("meadowfar-gfx");
      if (q === "low" || q === "high" || q === "auto") setGfx(q);
    } catch {}
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (me.user) {
          userRef.current = me.user.username;
          setUser(me.user.username);
          setIsParent(!!me.user.isParent);
          limitRef.current = me.user.dailyLimitMin || 0;
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

  // Daily play-time: counted per calendar day on the device. When a parent has
  // set a limit we show a gentle reminder — never a lock-out, never a scold.
  useEffect(() => {
    if (!hero) return;
    const key = () => `meadowfar-played-${new Date().toISOString().slice(0, 10)}`;
    const tick = setInterval(() => {
      let mins = 0;
      try {
        mins = Number(localStorage.getItem(key()) || "0") + 1;
        localStorage.setItem(key(), String(mins));
      } catch {
        return;
      }
      const lim = limitRef.current;
      if (lim > 0 && mins >= lim && mins % 10 === lim % 10) setRestOpen(true);
    }, 60000);
    return () => clearInterval(tick);
  }, [hero]);

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
    const nm = (d: { nama: string; namaEn: string }) =>
      langRef.current === "id" ? d.nama : d.namaEn;
    const t = <A extends unknown[]>(entry: { id: ((...a: A) => string) | string; en: ((...a: A) => string) | string }, ...args: A) => {
      const v = langRef.current === "id" ? entry.id : entry.en;
      return typeof v === "function" ? v(...args) : v;
    };
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
      pushToast(t(UI.achievementUnlocked, nm(def)));
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
        pushToast(t(UI.levelUp, after));
        newHeroes.forEach((h) =>
          pushToast(t(UI.newHero, nm(HEROES.find((x) => x.id === h)!)))
        );
        newSkills.forEach((s) =>
          pushToast(t(UI.newSkill, nm(SKILLS.find((x) => x.id === s)!)))
        );
        newTools.forEach((tl) =>
          pushToast(t(UI.newGear, nm(TOOLS.find((x) => x.id === tl)!)))
        );
        PETS.forEach((pt) => {
          if (after >= pt.level && before < pt.level)
            pushToast(t(UI.newPet, nm(pt)));
        });
        if (after >= 5) award("level-5");
        if (after >= 10) award("level-10");
        setProg({ ...p });
      }
    }

    // ---------- audio: chimes + gentle procedural lullaby (no audio files) ----------
    let audioCtx: AudioContext | null = null;
    function ctx() {
      audioCtx = audioCtx || new AudioContext();
      return audioCtx;
    }
    function chime(freq: number) {
      try {
        const c = ctx();
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.15, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.5);
      } catch {}
    }
    const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const melodyRand = mulberry32(777);
    let step = 0;
    const musicTimer = setInterval(() => {
      if (!musicRef.current) return;
      try {
        const c = ctx();
        step++;
        if (melodyRand() < 0.35) return; // rests keep it airy
        const note = SCALE[Math.floor(melodyRand() * SCALE.length)];
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "triangle";
        o.frequency.value = step % 8 === 0 ? note / 2 : note;
        g.gain.setValueAtTime(0.035, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0005, c.currentTime + 1.4);
        o.connect(g).connect(c.destination);
        o.start();
        o.stop(c.currentTime + 1.4);
      } catch {}
    }, 480);

    // ---------- graphics tier ----------
    // School laptops and cheap Android phones have to stay playable, so every
    // expensive feature is gated behind the tier rather than shipped to all.
    const cores = navigator.hardwareConcurrency || 4;
    const autoLow = cores <= 4 || window.innerWidth < 820;
    const tier: "low" | "high" = gfx === "auto" ? (autoLow ? "low" : "high") : gfx;
    const LOW = tier === "low";

    // ---------- renderer / scene ----------
    const renderer = new THREE.WebGLRenderer({ antialias: !LOW });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW ? 1.25 : 2));
    renderer.shadowMap.enabled = !LOW;
    renderer.shadowMap.type = LOW ? THREE.BasicShadowMap : THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const DAY_SKY = new THREE.Color(0x9fd8ef);
    const NIGHT_SKY = new THREE.Color(0x1c2a4a);
    const skyColor = DAY_SKY.clone();
    scene.background = skyColor;
    scene.fog = new THREE.Fog(skyColor, 60, 190);

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500
    );
    // Start already in the follow pose so the very first frame shows the
    // character from behind — never a frame from inside it at the origin.
    {
      const y0 = terrainHeight(0, 0);
      camera.position.set(0, y0 + 6.5, 11);
      camera.lookAt(0, y0 + 2, 0);
    }

    const sun = new THREE.DirectionalLight(0xfff2d8, 2.4);
    sun.position.set(40, 70, 20);
    sun.castShadow = !LOW;
    sun.shadow.mapSize.set(LOW ? 512 : 2048, LOW ? 512 : 2048);
    sun.shadow.camera.left = -80;
    sun.shadow.camera.right = 80;
    sun.shadow.camera.top = 80;
    sun.shadow.camera.bottom = -80;
    scene.add(sun);
    const hemi = new THREE.HemisphereLight(0xcfeaff, 0x7cc26a, 1.1);
    scene.add(hemi);

    // moon + stars for the night half of the cycle
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(3, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf3f0dc })
    );
    scene.add(moon);
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      const a = rand() * Math.PI * 2;
      const r = 150 + rand() * 80;
      starPos[i * 3] = Math.cos(a) * r;
      starPos[i * 3 + 1] = 40 + rand() * 120;
      starPos[i * 3 + 2] = Math.sin(a) * r;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.9, transparent: true, opacity: 0,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

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

    // butterflies (day) + fireflies (night)
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
    // sunlit dust motes drifting through the air — pure atmosphere, near-zero cost
    const dustGeo = new THREE.BufferGeometry();
    const DUST = LOW ? 0 : 140;
    const dustPos = new Float32Array(Math.max(1, DUST) * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (rand() - 0.5) * 70;
      dustPos[i * 3 + 1] = 1 + rand() * 14;
      dustPos[i * 3 + 2] = (rand() - 0.5) * 70;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfff6d8, size: 0.14, transparent: true,
      opacity: 0.55, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.visible = DUST > 0;
    scene.add(dust);

    const fireflies: THREE.Mesh[] = [];
    const fireflyMat = new THREE.MeshBasicMaterial({
      color: 0xd8ff7a, transparent: true, opacity: 0,
    });
    for (let i = 0; i < 16; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), fireflyMat);
      f.position.set((rand() - 0.5) * 50, 2, (rand() - 0.5) * 50);
      scene.add(f);
      fireflies.push(f);
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

    // lantern glow at night (only when the lantern gear is owned)
    const lantern = new THREE.PointLight(0xffd9a0, 0, 14);
    lantern.position.set(0.7, 1.8, 0.4);
    player.add(lantern);

    // ---------- pets: companions that follow the player ----------
    function buildPet(id: string) {
      const g = new THREE.Group();
      if (id === "puppy") {
        const fur = new THREE.MeshStandardMaterial({ color: 0xa9743e });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.9), fur);
        body.position.y = 0.4;
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.42), fur);
        head.position.set(0, 0.72, 0.55);
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), fur);
        tail.position.set(0, 0.62, -0.55);
        const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.06), fur);
        e1.position.set(-0.16, 0.98, 0.5);
        const e2 = e1.clone();
        e2.position.x = 0.16;
        g.add(body, head, tail, e1, e2);
      } else if (id === "fox") {
        const fur = new THREE.MeshStandardMaterial({ color: 0xe07a2f });
        const white = new THREE.MeshStandardMaterial({ color: 0xfff4e6 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.95), fur);
        body.position.y = 0.42;
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 4), fur);
        head.rotation.x = Math.PI / 2;
        head.position.set(0, 0.72, 0.65);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 6), white);
        tail.rotation.x = -Math.PI / 2.5;
        tail.position.set(0, 0.68, -0.62);
        const e1 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.25, 4), fur);
        e1.position.set(-0.14, 1.0, 0.5);
        const e2 = e1.clone();
        e2.position.x = 0.14;
        g.add(body, head, tail, e1, e2);
      } else {
        const feathers = new THREE.MeshStandardMaterial({ color: 0x4b9fe1 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), feathers);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), feathers);
        head.position.set(0, 0.28, 0.18);
        const beak = new THREE.Mesh(
          new THREE.ConeGeometry(0.06, 0.18, 4),
          new THREE.MeshStandardMaterial({ color: 0xffb02e })
        );
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.28, 0.38);
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), feathers);
        w1.position.set(-0.3, 0.05, 0);
        const w2 = w1.clone();
        w2.position.x = 0.3;
        g.add(body, head, beak, w1, w2);
        g.userData.wings = [w1, w2];
      }
      g.visible = false;
      scene.add(g);
      return g;
    }
    const petMeshes = new Map(PETS.map((p) => [p.id, buildPet(p.id)]));
    function activePetId(): string | null {
      const lv = levelFromXp(progRef.current.xp);
      const unlocked = PETS.filter((p) => lv >= p.level);
      if (!unlocked.length) return null;
      if (progRef.current.pet && unlocked.some((p) => p.id === progRef.current.pet))
        return progRef.current.pet;
      return unlocked[unlocked.length - 1].id;
    }

    // ---------- chunked infinite world with biomes + lakes ----------
    const CHUNK = 48;
    const VIEW = 2; // chunks in each direction
    const chunks = new Map<string, THREE.Group>();
    const treeGeo = new THREE.ConeGeometry(2.2, 5, 7);
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 2.4, 6);
    const treeMats = [0x2e8b46, 0x3aa055, 0x27793c].map(
      (c) => new THREE.MeshStandardMaterial({ color: c })
    );
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2a6e4f });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf2f7fb });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x3f9e58 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a4d2b });
    const flowerMats = [0xffffff, 0xffd447, 0xff8fb3, 0xb28fff].map(
      (c) => new THREE.MeshStandardMaterial({ color: c })
    );
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, flatShading: true });
    const groundMats: Record<Biome, THREE.MeshStandardMaterial> = {
      grass: new THREE.MeshStandardMaterial({ color: 0x6fc25f }),
      desert: new THREE.MeshStandardMaterial({ color: 0xe6c67a }),
      snow: new THREE.MeshStandardMaterial({ color: 0xeef4f8 }),
    };
    // one clock shared by every animated material
    const uTime = { value: 0 };

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3f8fd0, transparent: true, opacity: 0.75,
    });
    // gentle rolling swell so lakes never look like flat blue paper
    waterMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader =
        "uniform float uTime;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec4 wpW = modelMatrix * vec4(transformed, 1.0);
           transformed.z += sin(uTime * 1.1 + wpW.x * 0.25) * 0.18
                          + cos(uTime * 0.8 + wpW.z * 0.2) * 0.12;`
        );
    };

    // instanced waving grass — the single biggest "alive" upgrade per frame cost
    const bladeGeo = new THREE.PlaneGeometry(0.17, 0.85);
    bladeGeo.translate(0, 0.42, 0);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x5aad4a, side: THREE.DoubleSide,
    });
    grassMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader =
        "uniform float uTime;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           float sway = transformed.y * 0.42;
           vec4 wpG = instanceMatrix * vec4(transformed, 1.0);
           transformed.x += sin(uTime * 1.7 + wpG.x * 0.4 + wpG.z * 0.3) * sway;
           transformed.z += cos(uTime * 1.3 + wpG.x * 0.25) * sway * 0.55;`
        );
    };
    const BLADES = LOW ? 0 : 620; // low tier skips grass entirely

    function buildChunk(cx: number, cz: number) {
      const g = new THREE.Group();
      const biome = biomeAt(cx * CHUNK, cz * CHUNK);
      const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, 24, 24);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i) + cx * CHUNK;
        const wz = pos.getZ(i) + cz * CHUNK;
        const y = terrainHeight(wx, wz);
        if (y < minY) minY = y;
        pos.setY(i, y);
      }
      geo.computeVertexNormals();
      const ground = new THREE.Mesh(geo, groundMats[biome]);
      ground.receiveShadow = true;
      g.add(ground);

      // lakes: fill the valleys with a gently swelling water sheet
      if (minY < WATER_Y - 0.1) {
        const water = new THREE.Mesh(
          new THREE.PlaneGeometry(CHUNK, CHUNK, LOW ? 1 : 14, LOW ? 1 : 14),
          waterMat
        );
        water.rotation.x = -Math.PI / 2;
        water.position.set(cx * CHUNK, WATER_Y, cz * CHUNK);
        g.add(water);
      }

      // waving grass tufts, meadow only
      if (BLADES && biome === "grass") {
        const blades = new THREE.InstancedMesh(bladeGeo, grassMat, BLADES);
        const mtx = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const sc = new THREE.Vector3();
        const pv = new THREE.Vector3();
        let placed = 0;
        for (let i = 0; i < BLADES; i++) {
          const bx = cx * CHUNK + (hash2(cx * 13 + i, cz * 29 + i * 3) - 0.5) * CHUNK;
          const bz = cz * CHUNK + (hash2(cx * 37 + i * 5, cz * 11 + i) - 0.5) * CHUNK;
          const by = terrainHeight(bx, bz);
          if (by < WATER_Y + 0.35) continue;
          const s = 0.7 + hash2(bx, bz) * 0.7;
          pv.set(bx, by, bz);
          q.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            hash2(bz, bx) * Math.PI
          );
          sc.set(1, s, 1);
          mtx.compose(pv, q, sc);
          blades.setMatrixAt(placed++, mtx);
        }
        blades.count = placed;
        blades.instanceMatrix.needsUpdate = true;
        blades.frustumCulled = true;
        g.add(blades);
      }

      // scatter props deterministically per chunk, themed per biome
      const n = 14;
      for (let i = 0; i < n; i++) {
        const r1 = hash2(cx * 91 + i * 7, cz * 57 + i * 13);
        const r2 = hash2(cx * 31 + i * 17, cz * 77 + i * 3);
        const x = cx * CHUNK + (r1 - 0.5) * CHUNK;
        const z = cz * CHUNK + (r2 - 0.5) * CHUNK;
        const y = terrainHeight(x, z);
        if (y < WATER_Y + 0.3) continue; // nothing grows under water
        const kind = hash2(x, z);
        if (biome === "desert") {
          if (kind < 0.4) {
            const trunk = new THREE.Mesh(
              new THREE.CylinderGeometry(0.35, 0.4, 2.6, 7),
              cactusMat
            );
            trunk.position.set(x, y + 1.3, z);
            trunk.castShadow = true;
            const arm = new THREE.Mesh(
              new THREE.CylinderGeometry(0.2, 0.2, 1.1, 6),
              cactusMat
            );
            arm.position.set(x + 0.5, y + 1.7, z);
            g.add(trunk, arm);
          } else if (kind < 0.75) {
            const rock = new THREE.Mesh(
              new THREE.DodecahedronGeometry(0.6 + kind, 0),
              new THREE.MeshStandardMaterial({ color: 0xc9a15f, flatShading: true })
            );
            rock.position.set(x, y + 0.35, z);
            rock.castShadow = true;
            g.add(rock);
          }
        } else if (biome === "snow") {
          if (kind < 0.5) {
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(x, y + 1.2, z);
            trunk.castShadow = true;
            const top = new THREE.Mesh(treeGeo, pineMat);
            top.position.set(x, y + 4.3, z);
            top.castShadow = true;
            const cap = new THREE.Mesh(new THREE.ConeGeometry(1.4, 1.4, 7), snowCapMat);
            cap.position.set(x, y + 6.2, z);
            g.add(trunk, top, cap);
          } else if (kind < 0.8) {
            const drift = new THREE.Mesh(
              new THREE.SphereGeometry(0.5 + kind * 0.4, 7, 7),
              snowCapMat
            );
            drift.position.set(x, y + 0.2, z);
            g.add(drift);
          }
        } else {
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
      }
      return g;
    }

    // ---------- villages with story-telling elders ----------
    const REGION = CHUNK * 4; // one possible village per 192x192 region
    const villages = new Map<string, { g: THREE.Group; elder: THREE.Group }>();
    function villagePos(rx: number, rz: number) {
      if (hash2(rx * 13.7 + 5, rz * 9.1 + 3) > 0.55) return null;
      const ox = (hash2(rx, rz * 3) - 0.5) * REGION * 0.4;
      const oz = (hash2(rx * 7, rz) - 0.5) * REGION * 0.4;
      const x = rx * REGION + REGION / 2 + ox;
      const z = rz * REGION + REGION / 2 + oz;
      if (terrainHeight(x, z) < WATER_Y + 0.5) return null;
      return { x, z };
    }
    function buildVillage(x: number, z: number) {
      const g = new THREE.Group();
      const wall = new THREE.MeshStandardMaterial({ color: 0xf0e3c8 });
      const roof = new THREE.MeshStandardMaterial({ color: 0xc0563a });
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.6;
        const hx = x + Math.cos(a) * 7;
        const hz = z + Math.sin(a) * 7;
        const hy = terrainHeight(hx, hz);
        const house = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), wall);
        house.position.set(hx, hy + 1.5, hz);
        house.castShadow = true;
        const top = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.2, 4), roof);
        top.rotation.y = Math.PI / 4;
        top.position.set(hx, hy + 4.1, hz);
        g.add(house, top);
      }
      // the elder: a small robed figure who tells the star story
      const elder = new THREE.Group();
      const robe = new THREE.MeshStandardMaterial({ color: 0x6d5bd0 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 8), robe);
      body.position.y = 0.8;
      const headE = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf1c6a0 })
      );
      headE.position.y = 1.85;
      const beard = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xe8e8e8 })
      );
      beard.position.set(0, 1.6, 0.22);
      elder.add(body, headE, beard);
      const ey = terrainHeight(x, z);
      elder.position.set(x, ey, z);
      g.add(elder);
      scene.add(g);
      return { g, elder };
    }

    // ---------- the player's tree house: a fixed home that grows with them ----------
    const HOME_X = 14;
    const HOME_Z = -10;
    const homeY = terrainHeight(HOME_X, HOME_Z);
    const treeHouse = new THREE.Group();
    {
      const bark = new THREE.MeshStandardMaterial({ color: 0x7a4d2b });
      const leaf = new THREE.MeshStandardMaterial({ color: 0x2e8b46 });
      const plank = new THREE.MeshStandardMaterial({ color: 0xc98a4b });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xd05a3a });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 7, 8), bark);
      trunk.position.y = 3.5;
      trunk.castShadow = true;
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(4.6, 10, 9), leaf);
      canopy.position.y = 9.5;
      canopy.castShadow = true;
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.3, 10), plank);
      deck.position.y = 5.2;
      deck.receiveShadow = true;
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 3), plank);
      cabin.position.set(0, 6.5, 0);
      cabin.castShadow = true;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.6, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 8.5;
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.4, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x8a5a2b })
      );
      door.position.set(0, 6.0, 1.52);
      // ladder up the trunk
      for (let i = 0; i < 6; i++) {
        const rung = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), plank);
        rung.position.set(0, 0.9 + i * 0.75, 1.5);
        treeHouse.add(rung);
      }
      treeHouse.add(trunk, canopy, deck, cabin, roof, door);
      treeHouse.position.set(HOME_X, homeY, HOME_Z);
      scene.add(treeHouse);
    }

    // each decoration is built once and simply shown/hidden as the child places it
    const decorMeshes = new Map<string, THREE.Object3D>();
    function buildDecor(id: string): THREE.Object3D {
      const g = new THREE.Group();
      if (id === "flag") {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6),
          new THREE.MeshStandardMaterial({ color: 0xdcd0b8 })
        );
        pole.position.set(2.4, 6.3, 0);
        g.add(pole);
        [0xff6b6b, 0xffd447, 0x6bd0ff].forEach((c, i) => {
          const cloth2 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.5),
            new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide })
          );
          cloth2.position.set(2.9, 7.0 - i * 0.55, 0);
          g.add(cloth2);
        });
      } else if (id === "pot") {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.24, 0.45, 8),
            new THREE.MeshStandardMaterial({ color: 0xc06a4a })
          );
          pot.position.set(Math.cos(a) * 2.5, 5.55, Math.sin(a) * 2.5);
          const bloom = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 7, 7),
            new THREE.MeshStandardMaterial({ color: [0xff8fb3, 0xffd447, 0xb28fff][i] })
          );
          bloom.position.set(Math.cos(a) * 2.5, 5.95, Math.sin(a) * 2.5);
          g.add(pot, bloom);
        }
      } else if (id === "lights") {
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2;
          const bulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 6, 6),
            new THREE.MeshStandardMaterial({
              color: 0xfff0b0, emissive: 0xffc94a, emissiveIntensity: 1.2,
            })
          );
          bulb.position.set(
            Math.cos(a) * 3.1,
            5.6 + Math.sin(a * 3) * 0.22,
            Math.sin(a) * 3.1
          );
          g.add(bulb);
        }
        const warm = new THREE.PointLight(0xffc94a, 1.4, 14);
        warm.position.set(0, 6, 0);
        g.add(warm);
      } else if (id === "swing") {
        const rope = new THREE.MeshStandardMaterial({ color: 0xd8c9a8 });
        const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 5), rope);
        r1.position.set(-0.5, 3.4, 3.4);
        const r2 = r1.clone();
        r2.position.x = 0.5;
        const seat = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, 0.16, 0.5),
          new THREE.MeshStandardMaterial({ color: 0x8a5a2b })
        );
        seat.position.set(0, 1.85, 3.4);
        g.add(r1, r2, seat);
      } else if (id === "chime") {
        const bar = new THREE.MeshStandardMaterial({ color: 0xd7dde6, metalness: 0.6 });
        for (let i = 0; i < 5; i++) {
          const tube = new THREE.Mesh(
            new THREE.CylinderGeometry(0.07, 0.07, 0.7 + i * 0.12, 6),
            bar
          );
          tube.position.set(-1.6 + i * 0.22, 5.7 - i * 0.05, 1.7);
          g.add(tube);
        }
      } else if (id === "telescope") {
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22, 0.3, 1.8, 10),
          new THREE.MeshStandardMaterial({ color: 0x3a4a6a, metalness: 0.5 })
        );
        body.rotation.z = Math.PI / 5;
        body.rotation.x = -Math.PI / 7;
        body.position.set(-2.2, 6.3, 1.0);
        const tri = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 1.2, 3),
          new THREE.MeshStandardMaterial({ color: 0x6a5a4a })
        );
        tri.position.set(-2.2, 5.7, 1.0);
        g.add(body, tri);
      } else if (id === "gnome") {
        const gh = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0xe14b4b })
        );
        gh.position.set(2.0, 1.1, 2.6);
        const gb = new THREE.Mesh(
          new THREE.CylinderGeometry(0.26, 0.32, 0.55, 8),
          new THREE.MeshStandardMaterial({ color: 0x4b8fe1 })
        );
        gb.position.set(2.0, 0.55, 2.6);
        const gbeard = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.4, 6),
          new THREE.MeshStandardMaterial({ color: 0xf2f2f2 })
        );
        gbeard.position.set(2.0, 0.68, 2.78);
        g.add(gh, gb, gbeard);
      } else {
        // banner
        const cloth2 = new THREE.Mesh(
          new THREE.PlaneGeometry(3.4, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x7b4fd0, side: THREE.DoubleSide })
        );
        cloth2.position.set(0, 8.0, 1.7);
        const star = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.4),
          new THREE.MeshStandardMaterial({
            color: 0xffd447, emissive: 0xffb300, emissiveIntensity: 0.7,
          })
        );
        star.position.set(0, 8.0, 1.85);
        g.add(cloth2, star);
      }
      g.visible = false;
      treeHouse.add(g);
      return g;
    }
    DECORS.forEach((d) => decorMeshes.set(d.id, buildDecor(d.id)));
    function syncDecor() {
      const placed = progRef.current.placedDecors;
      decorMeshes.forEach((mesh, id) => {
        mesh.visible = placed.includes(id);
      });
    }
    syncDecor();
    syncDecorRef.current = syncDecor;
    // walking home from the far snowfields would be a long, sad trip for a kid
    goHomeRef.current = () => {
      player.position.set(HOME_X + 5, terrainHeight(HOME_X + 5, HOME_Z + 6), HOME_Z + 6);
    };

    // ---------- quests: five kinds, rotating so play stays fresh ----------
    let questIdx = 0;
    let kind: QuestKind = "collect";
    let need = 0;
    let got = 0;
    let items: THREE.Mesh[] = [];
    let gates: THREE.Group[] = [];       // race: pass through in order
    let gateIdx = 0;
    let raceEndsAt = 0;                  // ms timestamp; 0 when not racing
    let target: THREE.Group | null = null; // treasure chest / delivery house / shard altar

    // pick a walkable spot at a given distance from the player
    function spotNear(minD: number, maxD: number) {
      for (let tries = 0; tries < 12; tries++) {
        const ang = rand() * Math.PI * 2;
        const dist = minD + rand() * (maxD - minD);
        const x = player.position.x + Math.cos(ang) * dist;
        const z = player.position.z + Math.sin(ang) * dist;
        if (terrainHeight(x, z) > WATER_Y + 0.4) return { x, z };
      }
      return { x: player.position.x + minD, z: player.position.z };
    }

    function clearQuestObjects() {
      items.forEach((m) => scene.remove(m));
      items = [];
      gates.forEach((g) => scene.remove(g));
      gates = [];
      if (target) {
        scene.remove(target);
        target = null;
      }
      raceEndsAt = 0;
      setRaceTime(null);
      setRaceGates(null);
    }

    // a glowing ring the player runs through during a race
    function buildGate(x: number, z: number, n: number) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.22, 8, 20),
        new THREE.MeshStandardMaterial({
          color: 0x59d0ff, emissive: 0x2f9fd0, emissiveIntensity: 0.8,
        })
      );
      ring.position.y = 2.4;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 2.4, 6),
        new THREE.MeshStandardMaterial({ color: 0xe8d7a8 })
      );
      post.position.y = 1.2;
      g.add(ring, post);
      g.position.set(x, terrainHeight(x, z), z);
      g.userData.n = n;
      scene.add(g);
      return g;
    }

    function buildChest(x: number, z: number) {
      const g = new THREE.Group();
      const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2b });
      const gold = new THREE.MeshStandardMaterial({
        color: 0xffd447, emissive: 0xffb300, emissiveIntensity: 0.5,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.1), wood);
      box.position.y = 0.5;
      box.castShadow = true;
      const lid = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 1.2), gold);
      lid.position.y = 1.15;
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.9), gold);
      mark.position.y = 0.02;
      mark.rotation.y = Math.PI / 4;
      const mark2 = mark.clone();
      mark2.rotation.y = -Math.PI / 4;
      g.add(box, lid, mark, mark2);
      g.position.set(x, terrainHeight(x, z), z);
      scene.add(g);
      return g;
    }

    // package the player carries to a village, and the glowing drop-off marker
    function buildDropoff(x: number, z: number) {
      const g = new THREE.Group();
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 0.2, 16),
        new THREE.MeshStandardMaterial({
          color: 0x6ee07a, emissive: 0x2fa04a, emissiveIntensity: 0.6,
          transparent: true, opacity: 0.85,
        })
      );
      const parcel = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0xc98a3b })
      );
      parcel.position.y = 0.7;
      parcel.castShadow = true;
      const ribbon = new THREE.Mesh(
        new THREE.BoxGeometry(1.08, 0.14, 1.08),
        new THREE.MeshStandardMaterial({ color: 0xe14b7a })
      );
      ribbon.position.y = 0.7;
      g.add(pad, parcel, ribbon);
      g.position.set(x, terrainHeight(x, z) + 0.1, z);
      scene.add(g);
      return g;
    }

    // altar where a recovered star shard is returned
    function buildAltar(x: number, z: number) {
      const g = new THREE.Group();
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.7, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xbfb8a8, flatShading: true })
      );
      stone.position.y = 0.6;
      stone.castShadow = true;
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8),
        new THREE.MeshStandardMaterial({
          color: 0xfff0a0, emissive: 0xffd447, emissiveIntensity: 1.1,
        })
      );
      shard.position.y = 2.2;
      g.userData.shard = shard;
      const glow = new THREE.PointLight(0xffd447, 2.2, 18);
      glow.position.y = 2.2;
      g.add(stone, shard, glow);
      g.position.set(x, terrainHeight(x, z), z);
      scene.add(g);
      return g;
    }

    function newQuest() {
      clearQuestObjects();
      kind = QUEST_ROTATION[questIdx % QUEST_ROTATION.length];
      questIdx++;
      got = 0;
      setQuestKind(kind);

      if (kind === "race") {
        const total = 4 + Math.floor(rand() * 3);
        let cx = player.position.x;
        let cz = player.position.z;
        const dir = rand() * Math.PI * 2;
        for (let i = 0; i < total; i++) {
          const a = dir + (rand() - 0.5) * 1.6;
          cx += Math.cos(a) * (18 + rand() * 10);
          cz += Math.sin(a) * (18 + rand() * 10);
          if (terrainHeight(cx, cz) < WATER_Y + 0.4) {
            cx -= Math.cos(a) * 12;
            cz -= Math.sin(a) * 12;
          }
          gates.push(buildGate(cx, cz, i));
        }
        gateIdx = 0;
        need = total;
        // generous timer: fun to beat, never punishing for a small child
        const seconds = 22 + total * 9;
        raceEndsAt = performance.now() + seconds * 1000;
        setRaceGates({ done: 0, total });
        setRaceTime(seconds);
        setQuestData({ num: questIdx, need: total, noun: "race" });
        setProgressText(`0 / ${total}`);
        return;
      }

      if (kind === "treasure") {
        const s = spotNear(35, 70);
        target = buildChest(s.x, s.z);
        need = 1;
        setQuestData({ num: questIdx, need: 1, noun: "treasure" });
        setProgressText("");
        return;
      }

      if (kind === "delivery") {
        const s = spotNear(30, 60);
        target = buildDropoff(s.x, s.z);
        need = 1;
        setQuestData({ num: questIdx, need: 1, noun: "delivery" });
        setProgressText("");
        return;
      }

      if (kind === "shard") {
        const s = spotNear(28, 55);
        target = buildAltar(s.x, s.z);
        need = 1;
        setQuestData({ num: questIdx, need: 1, noun: "shard" });
        setProgressText("");
        return;
      }

      // default: collect
      const [noun, color] = QUEST_NOUNS[questIdx % QUEST_NOUNS.length];
      need = 4 + Math.floor(rand() * 4);
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.55,
      });
      for (let i = 0; i < need; i++) {
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), mat);
        const s = spotNear(14, 59);
        m.position.set(s.x, terrainHeight(s.x, s.z) + 1.4, s.z);
        scene.add(m);
        items.push(m);
      }
      setQuestData({ num: questIdx, need, noun });
      setProgressText(`0 / ${need}`);
    }

    // shared reward path for every quest kind
    function completeQuest(bonusXp: number) {
      const p = progRef.current;
      p.missionsDone++;
      gainXp(bonusXp);
      award("quest-1");
      if (p.missionsDone >= 10) award("quest-10");
      if (p.missionsDone >= 50) award("quest-50");
      // decorations unlock steadily as quests pile up
      const earned = earnedDecors(p.missionsDone);
      const fresh = earned.filter((d) => !p.decors.includes(d));
      if (fresh.length) {
        p.decors = [...new Set([...p.decors, ...earned])];
        fresh.forEach((id) => {
          const def = DECORS.find((d) => d.id === id)!;
          pushToast(t(UI.newGear, nm(def)));
        });
      }
      setProg({ ...p });
      save();
      newQuest();
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
    let talkHeld = false;
    let nearElder: THREE.Group | null = null;
    let lastBiome: Biome = "grass";
    let last = performance.now();
    let raf = 0;
    let localScore = 0;
    const dayStart = performance.now() - DAY_SECONDS * 250; // begin mid-morning

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uTime.value = now / 1000;
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

      // biome discovery achievements
      const b = biomeAt(player.position.x, player.position.z);
      if (b !== lastBiome) {
        lastBiome = b;
        if (b === "desert") award("biome-desert");
        if (b === "snow") award("biome-snow");
      }

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
      const groundY = Math.max(
        terrainHeight(player.position.x, player.position.z),
        WATER_Y // kids float on the lake surface instead of sinking
      );
      player.position.y = groundY + jumpY;

      // ---------- day-night cycle ----------
      const dayT = (((now - dayStart) / 1000) % DAY_SECONDS) / DAY_SECONDS;
      const sunA = dayT * Math.PI * 2;
      const dl = Math.max(0, Math.sin(sunA)); // daylight 0..1
      sun.position.set(
        player.position.x + Math.cos(sunA) * 70,
        Math.sin(sunA) * 70,
        player.position.z + 20
      );
      sun.intensity = 0.15 + 2.25 * dl;
      hemi.intensity = 0.3 + 0.8 * dl;
      skyColor.copy(NIGHT_SKY).lerp(DAY_SKY, dl);
      (scene.fog as THREE.Fog).color.copy(skyColor);
      moon.position.set(
        player.position.x - Math.cos(sunA) * 120,
        Math.max(10, -Math.sin(sunA) * 90),
        player.position.z - 60
      );
      starMat.opacity = 1 - Math.min(1, dl * 1.6);
      stars.position.set(player.position.x, 0, player.position.z);
      fireflyMat.opacity = 1 - Math.min(1, dl * 1.8);
      lantern.intensity =
        p.tools.includes("lantern") ? (1 - dl) * 2.2 : 0;
      if (dl < 0.03) award("night-owl");

      if (DUST) {
        dust.position.set(player.position.x, 0, player.position.z);
        dust.rotation.y = now / 26000;
        dustMat.opacity = 0.5 * dl; // motes only show where sunlight catches them
      }

      fireflies.forEach((f, i) => {
        f.position.x += Math.cos(now / 900 + i * 2.1) * dt * 2;
        f.position.z += Math.sin(now / 700 + i * 1.3) * dt * 2;
        f.position.y =
          terrainHeight(f.position.x, f.position.z) +
          1.5 + Math.sin(now / 300 + i) * 0.6;
        if (f.position.distanceTo(player.position) > 60)
          f.position.set(
            player.position.x + (hash2(i, (now / 1000) | 0) - 0.5) * 40,
            2,
            player.position.z + (hash2((now / 1000) | 0, i) - 0.5) * 40
          );
      });

      // ambient life
      clouds.forEach((c, i) => {
        c.position.x += dt * (1.5 + (i % 3) * 0.5);
        if (c.position.x - player.position.x > 130) c.position.x -= 260;
        c.position.z +=
          (player.position.z - c.position.z > 130 ? 260 : 0) -
          (c.position.z - player.position.z > 130 ? 260 : 0);
      });
      butterflies.forEach((bf, i) => {
        bf.a += dt * 0.6;
        bf.g.visible = dl > 0.15; // butterflies sleep at night
        bf.g.position.x += Math.cos(bf.a) * dt * 3;
        bf.g.position.z += Math.sin(bf.a) * dt * 3;
        const gy = terrainHeight(bf.g.position.x, bf.g.position.z);
        bf.g.position.y = gy + 2.5 + Math.sin(now / 250 + i) * 0.5;
        const flap = Math.sin(now / 60 + i) * 0.9;
        bf.w1.rotation.y = flap;
        bf.w2.rotation.y = -flap;
        if (bf.g.position.distanceTo(player.position) > 90)
          bf.g.position.set(
            player.position.x + (hash2(i, now | 0) - 0.5) * 50,
            0,
            player.position.z + (hash2(now | 0, i) - 0.5) * 50
          );
      });
      bunnies.forEach((bn, i) => {
        bn.a += (hash2(i, Math.floor(now / 2000)) - 0.5) * dt * 3;
        bn.g.position.x += Math.sin(bn.a) * bn.s * dt;
        bn.g.position.z += Math.cos(bn.a) * bn.s * dt;
        bn.g.rotation.y = bn.a;
        const gy = terrainHeight(bn.g.position.x, bn.g.position.z);
        bn.g.position.y = gy + Math.abs(Math.sin(now / 220 + i)) * 0.35;
        if (bn.g.position.distanceTo(player.position) > 90)
          bn.g.position.set(
            player.position.x + (hash2(i * 3, i) - 0.5) * 40,
            0,
            player.position.z + (hash2(i, i * 7) - 0.5) * 40
          );
      });

      // pet follows a step behind the player
      const petId = activePetId();
      petMeshes.forEach((mesh, id) => {
        mesh.visible = id === petId;
      });
      if (petId) {
        const mesh = petMeshes.get(petId)!;
        const behind = new THREE.Vector3(
          player.position.x - Math.sin(player.rotation.y) * 2.4,
          0,
          player.position.z - Math.cos(player.rotation.y) * 2.4
        );
        mesh.position.x += (behind.x - mesh.position.x) * Math.min(1, dt * 4);
        mesh.position.z += (behind.z - mesh.position.z) * Math.min(1, dt * 4);
        const gy = Math.max(
          terrainHeight(mesh.position.x, mesh.position.z),
          WATER_Y
        );
        if (petId === "bird") {
          mesh.position.y = gy + 2.2 + Math.sin(now / 260) * 0.4;
          const wings = mesh.userData.wings as THREE.Mesh[] | undefined;
          if (wings) {
            const flap = Math.sin(now / 80) * 0.7;
            wings[0].rotation.z = flap;
            wings[1].rotation.z = -flap;
          }
        } else {
          mesh.position.y = gy + Math.abs(Math.sin(now / 200)) * 0.2;
        }
        mesh.rotation.y = player.rotation.y;
      }

      // ---------- villages: stream in/out + elder talk ----------
      const prx = Math.floor(player.position.x / REGION);
      const prz = Math.floor(player.position.z / REGION);
      for (let dx3 = -1; dx3 <= 1; dx3++)
        for (let dz3 = -1; dz3 <= 1; dz3++) {
          const key = `${prx + dx3},${prz + dz3}`;
          if (!villages.has(key)) {
            const spot = villagePos(prx + dx3, prz + dz3);
            if (spot) villages.set(key, buildVillage(spot.x, spot.z));
            else villages.set(key, { g: new THREE.Group(), elder: new THREE.Group() });
          }
        }
      villages.forEach((v, key) => {
        const [rx, rz] = key.split(",").map(Number);
        if (Math.abs(rx - prx) > 2 || Math.abs(rz - prz) > 2) {
          scene.remove(v.g);
          villages.delete(key);
        }
      });
      nearElder = null;
      villages.forEach((v) => {
        if (!v.elder.parent) return;
        v.elder.rotation.y = Math.atan2(
          player.position.x - v.elder.position.x,
          player.position.z - v.elder.position.z
        );
        v.elder.position.y =
          terrainHeight(v.elder.position.x, v.elder.position.z) +
          Math.sin(now / 500) * 0.05;
        if (v.elder.position.distanceTo(player.position) < 6) nearElder = v.elder;
      });
      setNpcNear(!!nearElder && p.storyChapter < STORY.length);
      const talkPressed = keys["e"] || talkRef.current;
      if (talkPressed && !talkHeld && nearElder && p.storyChapter < STORY.length) {
        setStoryOpen(p.storyChapter + 1);
      }
      talkHeld = talkPressed;
      talkRef.current = false;

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
            Math.max(terrainHeight(m.position.x, m.position.z), WATER_Y) +
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
            pushToast(t(UI.missionDone));
            completeQuest(30);
          }
        }
      }

      // ---------- race: run the gates in order before the timer runs out ----------
      if (kind === "race" && raceEndsAt) {
        const leftMs = raceEndsAt - now;
        setRaceTime(Math.max(0, Math.ceil(leftMs / 1000)));
        gates.forEach((g, i) => {
          const passed = i < gateIdx;
          g.rotation.y += dt * (passed ? 0.4 : 1.6);
          const ring = g.children[0] as THREE.Mesh;
          const m = ring.material as THREE.MeshStandardMaterial;
          // the next gate glows gold so kids always know where to run
          m.color.setHex(passed ? 0x6f8fa0 : i === gateIdx ? 0xffd447 : 0x59d0ff);
          m.emissiveIntensity = i === gateIdx ? 1.2 : 0.4;
        });
        const nextGate = gates[gateIdx];
        if (nextGate) {
          const d = Math.hypot(
            nextGate.position.x - player.position.x,
            nextGate.position.z - player.position.z
          );
          if (d < 3.2) {
            gateIdx++;
            got = gateIdx;
            chime(700 + gateIdx * 60);
            setRaceGates({ done: gateIdx, total: need });
            setProgressText(`${gateIdx} / ${need}`);
            if (gateIdx >= gates.length) {
              p.racesWon++;
              award("race-1");
              if (p.racesWon >= 10) award("race-10");
              pushToast(t(UI.raceWon));
              completeQuest(45);
            }
          }
        }
        if (raceEndsAt && leftMs <= 0) {
          pushToast(t(UI.raceLost));
          newQuest(); // no penalty — just roll a fresh adventure
        }
      }

      // ---------- treasure / delivery / shard: reach the marked spot ----------
      if (target && (kind === "treasure" || kind === "delivery" || kind === "shard")) {
        const d = Math.hypot(
          target.position.x - player.position.x,
          target.position.z - player.position.z
        );
        if (kind === "shard") {
          const shard = target.userData.shard as THREE.Mesh | undefined;
          if (shard) {
            shard.rotation.y += dt * 1.5;
            shard.position.y = 2.2 + Math.sin(now / 400) * 0.25;
          }
        } else {
          target.rotation.y += dt * 0.6;
        }
        if (d < 3.4) {
          if (kind === "treasure") {
            p.treasuresFound++;
            award("treasure-1");
            localScore += 60 + toolBonus() * 3;
            setScore(localScore);
            if (localScore > p.bestScore) p.bestScore = localScore;
            pushToast(t(UI.treasureFound));
            completeQuest(60);
          } else if (kind === "delivery") {
            p.deliveries++;
            award("delivery-1");
            pushToast(t(UI.deliveryDone));
            completeQuest(40);
          } else {
            p.starQuests = Math.min(12, p.starQuests + 1);
            if (p.starQuests >= 3) award("starquest-3");
            pushToast(t(UI.starShardDone));
            completeQuest(70);
          }
        }
      }

      // compass points at whatever the current quest wants
      const guide =
        kind === "race"
          ? gates[gateIdx]?.position
          : target
            ? target.position
            : null;
      if (guide) {
        setArrow(
          Math.atan2(
            guide.x - player.position.x,
            -(guide.z - player.position.z)
          )
        );
      }

      renderer.render(scene, camera);

      // Grab the frame in the same tick it was drawn, so the GL buffer is still
      // valid without paying for preserveDrawingBuffer on every frame.
      if (captureRef.current) {
        captureRef.current = false;
        try {
          onCaptureRef.current?.(renderer.domElement.toDataURL("image/png"));
        } catch {}
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(saveTimer);
      clearInterval(musicTimer);
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("resize", onResize);
      save();
      try {
        audioCtx?.close();
      } catch {}
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero, gfx]);

  // finish reading a story chapter: advance, reward, save
  function closeStory(accepted: boolean) {
    setStoryOpen(null);
    if (!accepted) return;
    const p = progRef.current;
    if (p.storyChapter >= STORY.length) return;
    p.storyChapter++;
    p.xp += 50;
    setHudXp(p.xp);
    setHudLevel(levelFromXp(p.xp));
    const grant = (id: string) => {
      if (!p.achievements.includes(id)) {
        const def = ACHIEVEMENTS.find((a) => a.id === id)!;
        p.achievements = [...p.achievements, id];
        const name = lang === "id" ? def.nama : def.namaEn;
        pushToast(lang === "id" ? `Prestasi terbuka: ${name}` : `Achievement unlocked: ${name}`);
      }
    };
    if (p.storyChapter >= 1) grant("story-1");
    if (p.storyChapter >= 6) grant("story-6");
    if (p.storyChapter >= 12) grant("story-12");
    Object.assign(p, applyUnlocks(p));
    setProg({ ...p });
    save();
  }

  function toggleLang() {
    const next: Lang = lang === "id" ? "en" : "id";
    setLang(next);
    langRef.current = next;
    saveLang(next);
  }

  function toggleMusic() {
    const next = !musicRef.current;
    musicRef.current = next;
    setMusicOn(next);
    try {
      localStorage.setItem("meadowfar-music", next ? "on" : "off");
    } catch {}
  }

  function toggleDecor(id: string) {
    const p = progRef.current;
    if (!p.decors.includes(id)) return;
    const placed = p.placedDecors.includes(id);
    p.placedDecors = placed
      ? p.placedDecors.filter((d) => d !== id)
      : [...p.placedDecors, id];
    if (!placed) {
      const def = DECORS.find((d) => d.id === id)!;
      const name = lang === "id" ? def.nama : def.namaEn;
      pushToast((lang === "id" ? UI.homePlaced.id : UI.homePlaced.en)(name));
      if (!p.achievements.includes("home-1")) {
        p.achievements = [...p.achievements, "home-1"];
        const a = ACHIEVEMENTS.find((x) => x.id === "home-1")!;
        pushToast(
          (lang === "id" ? UI.achievementUnlocked.id : UI.achievementUnlocked.en)(
            lang === "id" ? a.nama : a.namaEn
          )
        );
      }
    }
    syncDecorRef.current?.();
    setProg({ ...p });
    save();
  }

  // Draw the raw frame, then the child's stickers, a soft frame and a caption.
  async function composePhoto(raw: string) {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = raw;
    });
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    if (!g) return raw;
    g.drawImage(img, 0, 0);

    const size = c.width * 0.1;
    g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    placedStickers.forEach((s) => g.fillText(s.e, s.x * c.width, s.y * c.height));

    const b = Math.max(8, c.width * 0.013);
    g.strokeStyle = "#ffffff";
    g.lineWidth = b;
    g.strokeRect(b / 2, b / 2, c.width - b, c.height - b);

    const cap = Math.max(16, c.width * 0.028);
    g.font = `600 ${cap}px system-ui, sans-serif`;
    g.textAlign = "right";
    g.textBaseline = "alphabetic";
    g.fillStyle = "rgba(0,0,0,0.45)";
    g.fillText("Meadowfar", c.width - b * 2 + 2, c.height - b * 2 + 2);
    g.fillStyle = "#ffffff";
    g.fillText("Meadowfar", c.width - b * 2, c.height - b * 2);
    return c.toDataURL("image/png");
  }

  function takePhoto() {
    onCaptureRef.current = async (raw) => {
      onCaptureRef.current = null;
      try {
        setPhoto(await composePhoto(raw));
      } catch {
        setPhoto(raw);
      }
    };
    captureRef.current = true;
  }

  function savePhoto() {
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo;
    a.download = `meadowfar-${Date.now()}.png`;
    a.click();
  }

  function exitPhoto() {
    setPhotoMode(false);
    setPhoto(null);
    setPlacedStickers([]);
  }

  function changeGfx(next: "auto" | "low" | "high") {
    setGfx(next);
    try {
      localStorage.setItem("meadowfar-gfx", next);
    } catch {}
  }

  function goHome() {
    goHomeRef.current?.();
    setShowHome(false);
  }

  function choosePet(id: string) {
    progRef.current.pet = id;
    setProg({ ...progRef.current });
    save();
  }

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
        <p className="text-lg font-semibold text-emerald-900">{pick(lang, UI.loading.id, UI.loading.en)}</p>
      </div>
    );

  if (!hero) {
    const level = levelFromXp(prog.xp);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-300 to-emerald-200 px-6 py-12 text-center">
        <button
          onClick={toggleLang}
          className="absolute right-4 top-4 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800"
        >
          {lang === "id" ? "English" : "Bahasa Indonesia"}
        </button>
        <div>
          <h1 className="text-4xl font-bold text-emerald-900">{pick(lang, UI.choose.id, UI.choose.en)}</h1>
          <p className="mx-auto mt-3 max-w-md text-emerald-800">
            {user
              ? (lang === "id" ? UI.helloUser.id : UI.helloUser.en)(user, level)
              : pick(lang, UI.guestNote.id, UI.guestNote.en)}
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
                {lang === "id" ? h.nama : h.namaEn}
                {!unlocked && (
                  <span className="mt-1 block text-xs font-normal">
                    {(lang === "id" ? UI.unlockAtLevel.id : UI.unlockAtLevel.en)(h.level)}
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
                {pick(lang, UI.register.id, UI.register.en)}
              </a>
              <a href="/masuk" className="rounded-xl border border-emerald-700 px-5 py-2 font-semibold text-emerald-800">
                {pick(lang, UI.login.id, UI.login.en)}
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
  const chapter = storyOpen ? STORY[storyOpen - 1] : null;
  const nounName = questData
    ? (QUEST_NOUN_NAMES[questData.noun]?.[lang] ?? questData.noun)
    : "";
  let questLine = "";
  if (questData) {
    if (questKind === "race")
      questLine = (lang === "id" ? UI.raceTitle.id : UI.raceTitle.en)(
        raceTime ?? 0
      );
    else if (questKind === "treasure")
      questLine = pick(lang, UI.treasureTitle.id, UI.treasureTitle.en);
    else if (questKind === "delivery")
      questLine = pick(lang, UI.deliveryTitle.id, UI.deliveryTitle.en);
    else if (questKind === "shard")
      questLine = pick(lang, UI.starShardTitle.id, UI.starShardTitle.en);
    else
      questLine = (lang === "id" ? UI.mission.id : UI.mission.en)(
        questData.num,
        questData.need,
        nounName
      );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
      {!photoMode && (
        <>
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/45 px-4 py-3 text-white backdrop-blur">
        <p className="text-sm font-semibold">{questLine}</p>
        {questKind === "race" && raceGates && (
          <p className="text-xs font-bold text-sky-300">
            {(lang === "id" ? UI.raceTimeLeft.id : UI.raceTimeLeft.en)(raceTime ?? 0)}
            {" · "}
            {(lang === "id" ? UI.raceGates.id : UI.raceGates.en)(
              raceGates.done,
              raceGates.total
            )}
          </p>
        )}
        {progressText && (
          <p className="text-xs opacity-80">
            {pick(lang, UI.collected.id, UI.collected.en)}: {progressText}
          </p>
        )}
        <p className="mt-1 text-xs opacity-80">{pick(lang, UI.scoreLbl.id, UI.scoreLbl.en)}: {score}</p>
        <p className="text-xs opacity-80">{pick(lang, UI.bestLbl.id, UI.bestLbl.en)}: {prog.bestScore}</p>
        <p className="text-xs opacity-80">
          {(lang === "id" ? UI.storyLbl.id : UI.storyLbl.en)(prog.storyChapter, STORY.length)}
        </p>
        <div className="mt-2">
          <p className="text-xs font-semibold text-amber-300">{pick(lang, UI.level.id, UI.level.en)} {level}</p>
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
        {pick(lang, UI.controls.id, UI.controls.en)}{" "}
        {prog.skills.includes("sprint") && pick(lang, UI.sprintHint.id, UI.sprintHint.en)}
      </div>
      <div className="absolute right-4 top-16 flex flex-col gap-2">
        <button
          onClick={() => setShowBook(true)}
          className="rounded-xl bg-black/45 px-4 py-2 text-xs font-semibold text-amber-300 backdrop-blur"
        >
          {pick(lang, UI.book.id, UI.book.en)}
        </button>
        <button
          onClick={() => setShowHome(true)}
          className="rounded-xl bg-black/45 px-4 py-2 text-xs font-semibold text-lime-300 backdrop-blur"
        >
          {pick(lang, UI.home.id, UI.home.en)}
        </button>
        <a
          href="/keluarga"
          className="rounded-xl bg-black/45 px-4 py-2 text-center text-xs font-semibold text-sky-300 backdrop-blur"
        >
          {pick(lang, UI.leaderboard.id, UI.leaderboard.en)}
        </a>
        <button
          onClick={toggleMusic}
          className="rounded-xl bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur"
        >
          {pick(lang, UI.music.id, UI.music.en)}: {musicOn ? pick(lang, UI.on.id, UI.on.en) : pick(lang, UI.off.id, UI.off.en)}
        </button>
        <button
          onClick={() => setPhotoMode(true)}
          className="rounded-xl bg-black/45 px-4 py-2 text-xs font-semibold text-pink-300 backdrop-blur"
        >
          {pick(lang, UI.photo.id, UI.photo.en)}
        </button>
        {isParent && (
          <a
            href="/orangtua"
            className="rounded-xl bg-black/45 px-4 py-2 text-center text-xs font-semibold text-violet-300 backdrop-blur"
          >
            {pick(lang, UI.parentTitle.id, UI.parentTitle.en)}
          </a>
        )}
        <div className="rounded-xl bg-black/45 px-3 py-2 text-xs text-white backdrop-blur">
          <p className="mb-1 font-semibold">{pick(lang, UI.graphics.id, UI.graphics.en)}</p>
          <div className="flex gap-1">
            {(["auto", "low", "high"] as const).map((q) => (
              <button
                key={q}
                onClick={() => changeGfx(q)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                  gfx === q ? "bg-amber-400 text-amber-950" : "bg-white/20"
                }`}
              >
                {q === "auto"
                  ? pick(lang, UI.gfxAuto.id, UI.gfxAuto.en)
                  : q === "low"
                    ? pick(lang, UI.gfxLow.id, UI.gfxLow.en)
                    : pick(lang, UI.gfxHigh.id, UI.gfxHigh.en)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={toggleLang}
          className="rounded-xl bg-black/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur"
        >
          {lang === "id" ? "English" : "Bahasa Indonesia"}
        </button>
      </div>
        </>
      )}
      {npcNear && !storyOpen && !photoMode && (
        <button
          onClick={() => (talkRef.current = true)}
          onTouchStart={() => (talkRef.current = true)}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 rounded-2xl bg-violet-500 px-8 py-3 font-bold text-white shadow-xl"
        >
          {pick(lang, UI.talkElder.id, UI.talkElder.en)}
        </button>
      )}
      {toast && !photoMode && (
        <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-amber-950 shadow-2xl">
          {toast}
        </div>
      )}
      {chapter && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-amber-50 p-8 text-amber-950 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {(lang === "id" ? UI.storyHeader.id : UI.storyHeader.en)(chapter.bab, STORY.length)}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{pick(lang, chapter.judul, chapter.judulEn)}</h2>
            <p className="mt-4 leading-relaxed">{pick(lang, chapter.teks, chapter.teksEn)}</p>
            <div className="mt-4 rounded-2xl bg-violet-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                {pick(lang, UI.elderTask.id, UI.elderTask.en)}
              </p>
              <p className="mt-1 text-sm">{pick(lang, chapter.tugas, chapter.tugasEn)}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => closeStory(true)}
                className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white"
              >
                {pick(lang, UI.thanksElder.id, UI.thanksElder.en)}
              </button>
              <button
                onClick={() => closeStory(false)}
                className="rounded-xl border border-amber-300 px-6 py-3 font-semibold"
              >
                {pick(lang, UI.later.id, UI.later.en)}
              </button>
            </div>
          </div>
        </div>
      )}
      {restOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-amber-50 p-8 text-center text-amber-950 shadow-2xl">
            <p className="text-4xl">🌙</p>
            <h2 className="mt-3 text-2xl font-bold">
              {pick(lang, UI.restTitle.id, UI.restTitle.en)}
            </h2>
            <p className="mt-3 leading-relaxed">{pick(lang, UI.restBody.id, UI.restBody.en)}</p>
            <button
              onClick={() => setRestOpen(false)}
              className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white"
            >
              {pick(lang, UI.restOk.id, UI.restOk.en)}
            </button>
          </div>
        </div>
      )}
      {photoMode && !photo && (
        <>
          {/* tap layer: places the selected sticker where the child touches */}
          <div
            className="absolute inset-0 z-10"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPlacedStickers((s) => [
                ...s,
                {
                  e: sticker,
                  x: (e.clientX - r.left) / r.width,
                  y: (e.clientY - r.top) / r.height,
                },
              ]);
            }}
          >
            {placedStickers.map((s, i) => (
              <span
                key={i}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none"
                style={{
                  left: `${s.x * 100}%`,
                  top: `${s.y * 100}%`,
                  fontSize: "10vw",
                  lineHeight: 1,
                }}
              >
                {s.e}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 z-20 border-[6px] border-white/70" />
          <div className="absolute left-1/2 top-3 z-30 w-[92%] max-w-xl -translate-x-1/2 rounded-2xl bg-black/55 p-3 backdrop-blur">
            <p className="text-center text-[11px] text-white/90">
              {pick(lang, UI.photoHint.id, UI.photoHint.en)}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSticker(s)}
                  className={`rounded-lg px-2 py-1 text-xl ${
                    sticker === s ? "bg-amber-400" : "bg-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
            <button
              onClick={() => setPlacedStickers([])}
              className="rounded-xl bg-black/55 px-4 py-2 text-xs font-semibold text-white backdrop-blur"
            >
              {pick(lang, UI.clearStickers.id, UI.clearStickers.en)}
            </button>
            <button
              onClick={takePhoto}
              className="h-16 w-16 rounded-full border-4 border-white bg-pink-500 text-2xl shadow-xl"
              aria-label={pick(lang, UI.shutter.id, UI.shutter.en)}
            >
              📸
            </button>
            <button
              onClick={exitPhoto}
              className="rounded-xl bg-black/55 px-4 py-2 text-xs font-semibold text-white backdrop-blur"
            >
              {pick(lang, UI.exitPhoto.id, UI.exitPhoto.en)}
            </button>
          </div>
        </>
      )}
      {photo && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 text-emerald-950 shadow-2xl">
            <h2 className="text-lg font-bold">{pick(lang, UI.photoReady.id, UI.photoReady.en)}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Meadowfar" className="mt-3 w-full rounded-xl" />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={savePhoto}
                className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white"
              >
                {pick(lang, UI.savePhoto.id, UI.savePhoto.en)}
              </button>
              <button
                onClick={() => setPhoto(null)}
                className="rounded-xl border border-emerald-300 px-5 py-3 font-semibold"
              >
                {pick(lang, UI.retake.id, UI.retake.en)}
              </button>
              <button
                onClick={exitPhoto}
                className="rounded-xl border border-emerald-300 px-5 py-3 font-semibold"
              >
                {pick(lang, UI.exitPhoto.id, UI.exitPhoto.en)}
              </button>
            </div>
          </div>
        </div>
      )}
      {showHome && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-emerald-950 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{pick(lang, UI.home.id, UI.home.en)}</h2>
              <button
                onClick={() => setShowHome(false)}
                className="rounded-full bg-emerald-100 px-4 py-1 font-semibold"
              >
                {pick(lang, UI.close.id, UI.close.en)}
              </button>
            </div>
            <p className="mt-2 text-sm text-emerald-700">
              {pick(lang, UI.homeIntro.id, UI.homeIntro.en)}
            </p>
            <button
              onClick={goHome}
              className="mt-4 w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white"
            >
              {pick(lang, UI.goHome.id, UI.goHome.en)}
            </button>
            <h3 className="mt-5 font-semibold">
              {pick(lang, UI.decorations.id, UI.decorations.en)} (
              {prog.placedDecors.length}/{DECORS.length})
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DECORS.map((d) => {
                const owned = prog.decors.includes(d.id);
                const placed = prog.placedDecors.includes(d.id);
                return (
                  <button
                    key={d.id}
                    disabled={!owned}
                    onClick={() => toggleDecor(d.id)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      placed
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : owned
                          ? "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                          : "border-emerald-100 text-emerald-300"
                    }`}
                  >
                    {lang === "id" ? d.nama : d.namaEn}
                    <span className="mt-0.5 block text-xs font-normal">
                      {!owned
                        ? (lang === "id" ? UI.decorLockedAt.id : UI.decorLockedAt.en)(d.missions)
                        : placed
                          ? pick(lang, UI.remove.id, UI.remove.en)
                          : pick(lang, UI.place.id, UI.place.en)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showBook && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-emerald-950 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{pick(lang, UI.book.id, UI.book.en)}</h2>
              <button
                onClick={() => setShowBook(false)}
                className="rounded-full bg-emerald-100 px-4 py-1 font-semibold"
              >
                {pick(lang, UI.close.id, UI.close.en)}
              </button>
            </div>
            <p className="mt-2 text-sm text-emerald-700">
              {(lang === "id" ? UI.bookStats.id : UI.bookStats.en)(
                level,
                prog.itemsCollected,
                prog.missionsDone,
                Math.round(prog.distance),
                prog.storyChapter,
                STORY.length
              )}
            </p>
            <h3 className="mt-5 font-semibold">{pick(lang, UI.pets.id, UI.pets.en)}</h3>
            <div className="mt-2 flex gap-2">
              {PETS.map((pt) => {
                const unlocked = level >= pt.level;
                const active = prog.pet === pt.id;
                return (
                  <button
                    key={pt.id}
                    disabled={!unlocked}
                    onClick={() => choosePet(pt.id)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : unlocked
                          ? "border-emerald-300 text-emerald-800"
                          : "border-emerald-100 text-emerald-300"
                    }`}
                  >
                    {lang === "id" ? pt.nama : pt.namaEn}
                    {!unlocked && ` (Lv ${pt.level})`}
                  </button>
                );
              })}
            </div>
            <h3 className="mt-5 font-semibold">{pick(lang, UI.skills.id, UI.skills.en)}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {SKILLS.map((s) => (
                <li key={s.id} className={prog.skills.includes(s.id) ? "" : "opacity-40"}>
                  {prog.skills.includes(s.id) ? "✓" : `Lv ${s.level}`} —{" "}
                  {lang === "id" ? s.nama : s.namaEn}:{" "}
                  {lang === "id" ? s.keterangan : s.keteranganEn}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 font-semibold">{pick(lang, UI.gear.id, UI.gear.en)}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {TOOLS.map((t) => (
                <li key={t.id} className={prog.tools.includes(t.id) ? "" : "opacity-40"}>
                  {prog.tools.includes(t.id) ? "✓" : `Lv ${t.level}`} —{" "}
                  {lang === "id" ? t.nama : t.namaEn}
                  {t.bonus > 0 && (lang === "id" ? UI.gearBonus.id : UI.gearBonus.en)(t.bonus)}
                </li>
              ))}
            </ul>
            <h3 className="mt-5 font-semibold">
              {pick(lang, UI.achievements.id, UI.achievements.en)} (
              {prog.achievements.length}/{ACHIEVEMENTS.length})
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {ACHIEVEMENTS.map((a) => (
                <li
                  key={a.id}
                  className={prog.achievements.includes(a.id) ? "" : "opacity-40"}
                >
                  {prog.achievements.includes(a.id) ? "★" : "☆"}{" "}
                  {lang === "id" ? a.nama : a.namaEn} —{" "}
                  {lang === "id" ? a.keterangan : a.keteranganEn}
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
        {pick(lang, UI.jumpBtn.id, UI.jumpBtn.en)}
      </button>
    </div>
  );
}
