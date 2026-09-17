"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
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
  type GameMode,
  type HeroId,
  type Progress,
} from "@/lib/progression";
import { STORY } from "@/lib/story";
import { UI, QUEST_NOUN_NAMES, detectLang, saveLang, pick, type Lang } from "@/lib/i18n";
import { COSMETICS, ITEMS, MAX_HEARTS, RECIPES, canCraft, type Slot } from "@/lib/catalog";
import { hash2, terrainHeight, biomeAt, forestAt, fbm, addPad, removePad, mulberry32, WATER_Y, type Biome } from "@/lib/game/terrain";
import { CHUNK, HOME, REGION, SITES, VILLAGE0, dungeonName, dungeonPos, nearLandmark, villagePos, villageName } from "@/lib/game/world";
import { buildAnimal, herdFor, wander, animateAnimal, preloadAnimalModels, SPECIES, type Animal } from "@/lib/game/wildlife";
import MiniMap, { type MapState } from "./game/MiniMap";
import { Physics, STEP } from "@/lib/game/physics";
import { buildAvatar, type Avatar } from "@/lib/game/avatar";
import { Input } from "@/lib/game/input";
import { buildHouse, buildTreeHouse, buildPortalSite, label, type PortalKind, type Room as HouseRoom } from "@/lib/game/structures";
import { buildInterior, type Interior, type InteriorId } from "@/lib/game/interiors";
import { Critters } from "@/lib/game/creatures";
import { Room, type EmoteId, type NetPlayer } from "@/lib/game/net";
import { colorFilter, engineKey, loadControls, loadGfx, saveControls, saveGfx, type Controls, type Gfx } from "@/lib/game/gfx";
import { devnetBuy } from "@/lib/solana-client";
import TouchControls from "./TouchControls";
import Thumb from "./game/Thumb";
import Menu, { Coin, EMOTE_TEXT, Heart, type MenuTab, type RoomUi } from "./game/Menu";

const QUEST_NOUNS = [
  ["bintang emas", 0xffd447],
  ["buah beri merah", 0xe14b4b],
  ["kristal biru", 0x4bb7e1],
  ["jamur ungu", 0x9b59d0],
  ["kunang cahaya", 0xb6ff6b],
] as const;

const GUEST_KEY = "meadowfar-progress";
const DAY_SECONDS = 900; // full day-night cycle length

// Quest variety: the rotation keeps play from turning into one long fetch loop.
type QuestKind = "collect" | "race" | "treasure" | "delivery" | "shard";
const QUEST_ROTATION: QuestKind[] = [
  "collect", "race", "collect", "treasure",
  "collect", "delivery", "race", "shard",
];

// Photo-mode stickers.
const STICKERS = ["⭐", "🌟", "🐰", "🦊", "🐦", "🌸", "🍄", "🌈", "🎈", "👑", "😄", "❤️"];

const PLAYER_R = 0.45;
const PLAYER_H = 2.3;

type Zone = "world" | InteriorId;

function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

const EMPTY_ROOM: RoomUi = { status: "none", code: "", isHost: false, ping: 0, players: [], error: "" };

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const [hero, setHero] = useState<HeroId | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const langRef = useRef<Lang>("en");
  const [questData, setQuestData] = useState<{ num: number; need: number; noun: string } | null>(null);
  const [questKind, setQuestKind] = useState<QuestKind>("collect");
  const [raceTime, setRaceTime] = useState<number | null>(null);
  const [raceGates, setRaceGates] = useState<{ done: number; total: number } | null>(null);
  const [photoMode, setPhotoMode] = useState(false);
  const [sticker, setSticker] = useState(STICKERS[0]);
  const [placedStickers, setPlacedStickers] = useState<{ e: string; x: number; y: number }[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const [restOpen, setRestOpen] = useState(false);
  const limitRef = useRef(0); // daily minutes allowed; 0 = no limit
  const captureRef = useRef(false);
  const onCaptureRef = useRef<((url: string) => void) | null>(null);
  const [progressText, setProgressText] = useState("");
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [prog, setProg] = useState<Progress | null>(null);
  const [hudLevel, setHudLevel] = useState(1);
  const [hudXp, setHudXp] = useState(0);
  const [npcNear, setNpcNear] = useState(false);
  const [storyOpen, setStoryOpen] = useState<number | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [volume, setVolume] = useState(70);
  const volRef = useRef(70);
  const progRef = useRef<Progress>(defaultProgress());
  const userRef = useRef<string | null>(null);
  const musicRef = useRef(true);
  const syncDecorRef = useRef<(() => void) | null>(null);
  const goHomeRef = useRef<(() => void) | null>(null);
  const applyEquipRef = useRef<(() => void) | null>(null);
  const toastQueue = useRef<string[]>([]);
  const toastBusy = useRef(false);
  // new systems
  const [input] = useState(() => new Input());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  const [menuTab, setMenuTab] = useState<MenuTab>("play");
  const [gfx, setGfxState] = useState<Gfx | null>(null);
  const gfxRef = useRef<Gfx | null>(null);
  const [controls, setControlsState] = useState<Controls | null>(null);
  const controlsRef = useRef<Controls | null>(null);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const heartsRef = useRef(MAX_HEARTS);
  const boostUntilRef = useRef(0);
  const [coins, setCoins] = useState(0);
  const [zoneName, setZoneName] = useState<string>("world");
  const [fainted, setFainted] = useState(false);
  const [fps, setFps] = useState(0);
  const [touchUi, setTouchUi] = useState(false);
  const [roomUi, setRoomUi] = useState<RoomUi>(EMPTY_ROOM);
  const roomRef = useRef<Room | null>(null);
  const [devnetStatus, setDevnetStatus] = useState("");
  const [gamepad, setGamepad] = useState("");
  const [insideHouse, setInsideHouse] = useState(false);
  const emoteRef = useRef<{ e: EmoteId; at: number } | null>(null);
  const mapRef = useRef<MapState | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [rideHint, setRideHint] = useState<string | null>(null); // species near enough to ride
  const [riding, setRiding] = useState<string | null>(null);
  const shieldRef = useRef(false);
  const getMapState = useCallback(() => mapRef.current, []);

  useEffect(() => {
    volRef.current = volume;
    try {
      localStorage.setItem("meadowfar-vol", String(volume));
    } catch {}
  }, [volume]);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen && document.pointerLockElement) document.exitPointerLock();
  }, [menuOpen]);

  // ---------- settings + account + saved progress ----------
  useEffect(() => {
    const l = detectLang();
    setLang(l);
    langRef.current = l;
    const g = loadGfx();
    setGfxState(g);
    gfxRef.current = g;
    const c = loadControls();
    setControlsState(c);
    controlsRef.current = c;
    input.settings = { sensitivity: c.sensitivity, invertY: c.invertY };
    try {
      const m = localStorage.getItem("meadowfar-music");
      if (m === "off") {
        setMusicOn(false);
        musicRef.current = false;
      }
      const v = localStorage.getItem("meadowfar-vol");
      if (v !== null) {
        const n = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
        setVolume(n);
        volRef.current = n;
      }
    } catch {}
    const onPad = (e: GamepadEvent) => setGamepad(e.type === "gamepadconnected" ? e.gamepad.id : "");
    window.addEventListener("gamepadconnected", onPad);
    window.addEventListener("gamepaddisconnected", onPad);
    const loaded = (clean: Progress) => {
      progRef.current = clean;
      setProg(clean);
      setHudLevel(levelFromXp(clean.xp));
      setHudXp(clean.xp);
      setCoins(clean.coins);
    };
    (async () => {
      try {
        const me = await fetch("/api/auth/me").then((r) => r.json());
        if (me.user) {
          userRef.current = me.user.username;
          setUser(me.user.username);
          setIsParent(!!me.user.isParent);
          limitRef.current = me.user.dailyLimitMin || 0;
          const p = await fetch("/api/progress").then((r) => r.json());
          loaded(sanitizeProgress(p.progress));
          return;
        }
      } catch {}
      let clean = defaultProgress();
      try {
        const raw = localStorage.getItem(GUEST_KEY);
        if (raw) clean = sanitizeProgress(JSON.parse(raw));
      } catch {}
      loaded(clean);
    })();
    return () => {
      window.removeEventListener("gamepadconnected", onPad);
      window.removeEventListener("gamepaddisconnected", onPad);
      roomRef.current?.close();
    };
  }, [input]);

  // on-screen controller: shown automatically on touch devices
  useEffect(() => {
    if (!controls) return;
    const coarse =
      window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setTouchUi(controls.touch === "on" || (controls.touch === "auto" && coarse));
  }, [controls]);

  // Daily play-time: a gentle reminder — never a lock-out, never a scold.
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

  // room status for the menu, refreshed while a room is live
  useEffect(() => {
    const t = setInterval(() => {
      const r = roomRef.current;
      if (!r) return;
      setRoomUi({
        status: r.status,
        code: r.code,
        isHost: r.isHost,
        ping: r.ping,
        players: [...r.players.values()].map((p) => ({ id: p.id, name: p.name })),
        error: r.error,
      });
    }, 500);
    return () => clearInterval(t);
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

  function grant(id: string) {
    const p = progRef.current;
    if (p.achievements.includes(id)) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    p.achievements = [...p.achievements, id];
    const l = langRef.current;
    pushToast((l === "id" ? UI.achievementUnlocked.id : UI.achievementUnlocked.en)(l === "id" ? def.nama : def.namaEn));
  }

  function addCoins(n: number) {
    const p = progRef.current;
    p.coins = Math.max(0, p.coins + n);
    setCoins(p.coins);
  }

  function myName() {
    if (userRef.current) return userRef.current;
    try {
      let g = localStorage.getItem("meadowfar-guest");
      if (!g) {
        g = `Guest ${100 + Math.floor(Math.random() * 900)}`;
        localStorage.setItem("meadowfar-guest", g);
      }
      return g;
    } catch {
      return "Guest";
    }
  }

  // ======================= the engine =======================
  const eKey = gfx ? engineKey(gfx) : "";
  useEffect(() => {
    if (!hero || !mountRef.current || !gfxRef.current) return;
    const mountEl = mountRef.current;
    const G = gfxRef.current;
    const rand = mulberry32(20260710);
    const heroDef = HEROES.find((h) => h.id === hero)!;
    const heroId: HeroId = hero;
    progRef.current.lastHero = hero;
    const LOW = G.shadows === 0 && G.grass === 0;

    const has = (skill: string) => progRef.current.skills.includes(skill);
    const nm = (d: { nama: string; namaEn: string }) => (langRef.current === "id" ? d.nama : d.namaEn);
    const t = <A extends unknown[]>(entry: { id: ((...a: A) => string) | string; en: ((...a: A) => string) | string }, ...args: A) => {
      const v = langRef.current === "id" ? entry.id : entry.en;
      return typeof v === "function" ? v(...args) : v;
    };
    const toolBonus = () =>
      Math.max(0, ...TOOLS.filter((tl) => progRef.current.tools.includes(tl.id)).map((tl) => tl.bonus));

    const award = grant;

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
        const newTools = upgraded.tools.filter((tl) => !p.tools.includes(tl));
        Object.assign(p, upgraded);
        setHudLevel(after);
        pushToast(t(UI.levelUp, after));
        newHeroes.forEach((h) => pushToast(t(UI.newHero, nm(HEROES.find((x) => x.id === h)!))));
        newSkills.forEach((s) => pushToast(t(UI.newSkill, nm(SKILLS.find((x) => x.id === s)!))));
        newTools.forEach((tl) => pushToast(t(UI.newGear, nm(TOOLS.find((x) => x.id === tl)!))));
        PETS.forEach((pt) => {
          if (after >= pt.level && before < pt.level) pushToast(t(UI.newPet, nm(pt)));
        });
        if (after >= 5) award("level-5");
        if (after >= 10) award("level-10");
        setProg({ ...p });
      }
    }

    // ---------- audio: chimes + gentle procedural lullaby (no audio files) ----------
    let audioCtx: AudioContext | null = null;
    let masterNode: GainNode | null = null;
    function ctx() {
      audioCtx = audioCtx || new AudioContext();
      return audioCtx;
    }
    function master() {
      const c = ctx();
      if (!masterNode) {
        masterNode = c.createGain();
        masterNode.connect(c.destination);
      }
      masterNode.gain.value = volRef.current / 100;
      return masterNode;
    }
    function chime(freq: number, type: OscillatorType = "sine", len = 0.5, vol = 0.15) {
      try {
        const c = ctx();
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + len);
        o.connect(g).connect(master());
        o.start();
        o.stop(c.currentTime + len);
      } catch {}
    }
    const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const melodyRand = mulberry32(777);
    let step = 0;
    const musicTimer = setInterval(() => {
      if (!musicRef.current || !audioCtx) return;
      try {
        const c = ctx();
        step++;
        if (melodyRand() < 0.35) return;
        const note = SCALE[Math.floor(melodyRand() * SCALE.length)];
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = "triangle";
        o.frequency.value = step % 8 === 0 ? note / 2 : note;
        g.gain.setValueAtTime(0.035, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0005, c.currentTime + 1.4);
        o.connect(g).connect(master());
        o.start();
        o.stop(c.currentTime + 1.4);
      } catch {}
    }, 480);
    // browsers only allow sound after a gesture
    const wakeAudio = () => {
      ctx();
      audioCtx?.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", wakeAudio);
    window.addEventListener("keydown", wakeAudio);

    // ---------- renderer ----------
    const VIEW = G.view;
    const FOG_FAR = CHUNK * (VIEW + 0.65);
    const renderer = new THREE.WebGLRenderer({ antialias: G.aa, powerPreference: "high-performance" });
    const pixelRatio = () => Math.min(window.devicePixelRatio * G.scale, 2.25);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    renderer.shadowMap.enabled = G.shadows > 0;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.setAttribute("data-testid", "game-canvas");
    mountEl.appendChild(renderer.domElement);
    input.attach(renderer.domElement);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const onCanvasClick = () => {
      if (!coarse && !menuOpenRef.current) input.requestPointerLock();
    };
    renderer.domElement.addEventListener("click", onCanvasClick);

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(0xbfe6f5);
    // haze starts far out, so nearby ground keeps its colour and only the
    // horizon fades into the sky (aerial perspective, not a white veil)
    scene.fog = new THREE.Fog(skyColor, FOG_FAR * 0.72, FOG_FAR * 1.45);

    const camera = new THREE.PerspectiveCamera(G.fov, mountEl.clientWidth / mountEl.clientHeight, 0.08, 1200);

    // gradient sky dome that follows the camera
    const skyU = {
      top: { value: new THREE.Color(0x3f8fe0) },
      horizon: { value: new THREE.Color(0xbfe6f5) },
      bottom: { value: new THREE.Color(0x6fa86a) },
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyU,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `varying vec3 vDir;
        void main(){ vec4 w = modelMatrix*vec4(position,1.0); vDir = w.xyz - cameraPosition; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;
        void main(){ float h = normalize(vDir).y;
          vec3 c = h > 0.0 ? mix(horizon, top, pow(h, 0.55)) : mix(horizon, bottom, pow(-h, 0.4));
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat);
    skyDome.renderOrder = -10;
    scene.add(skyDome);
    // physically based atmosphere (Rayleigh + Mie scattering) on non-low presets
    let sky: Sky | null = null;
    if (!LOW) {
      sky = new Sky();
      // keep the box corners (half-diagonal ~0.87 x scale) inside camera.far
      sky.scale.setScalar(1100);
      sky.frustumCulled = false;
      sky.renderOrder = -10;
      const su = sky.material.uniforms;
      su.turbidity.value = 3.2;
      su.rayleigh.value = 1.1;
      su.mieCoefficient.value = 0.0025;
      su.mieDirectionalG.value = 0.82;
      scene.add(sky);
      skyDome.visible = false;
    }
    // Drifting cloud sheet: layered value noise on a big plane above the
    // world. Cheap (one draw call) but it stops the sky reading as flat blue.
    let cloudLayer: THREE.Mesh | null = null;
    const cloudUniforms = { uTime: { value: 0 }, uSun: { value: 1 } };
    if (!LOW) {
      const cg = new THREE.PlaneGeometry(2400, 2400, 1, 1);
      cg.rotateX(-Math.PI / 2);
      const cm = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide,
        uniforms: cloudUniforms,
        vertexShader: `varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `varying vec2 vUv;
          uniform float uTime; uniform float uSun;
          float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float n(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
          float fbm(vec2 p){ float v = 0.0, a = 0.5;
            for (int i = 0; i < 5; i++){ v += n(p) * a; p = p * 2.07 + 13.1; a *= 0.5; } return v; }
          void main(){
            vec2 p = vUv * 3.2 + vec2(uTime * 0.004, uTime * 0.0017);
            float f = fbm(p) * 0.65 + fbm(p * 2.6 + 4.0) * 0.35;
            float cover = smoothstep(0.50, 0.72, f);
            float edge = smoothstep(0.46, 0.86, f);
            vec3 lit = mix(vec3(0.78, 0.82, 0.88), vec3(1.0, 0.99, 0.96), edge);
            gl_FragColor = vec4(lit * uSun, cover * 0.75);
          }`,
      });
      cloudLayer = new THREE.Mesh(cg, cm);
      cloudLayer.position.y = 300;
      cloudLayer.frustumCulled = false;
      cloudLayer.renderOrder = -9;
      scene.add(cloudLayer);
    }
    const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(22, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff1c4, fog: false }));
    scene.add(sunDisc);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(14, 20, 14), new THREE.MeshBasicMaterial({ color: 0xf3f0dc, fog: false }));
    scene.add(moon);

    const sun = new THREE.DirectionalLight(0xfff2d8, 2.6);
    sun.castShadow = G.shadows > 0;
    const smap = G.shadows === 2 ? 2048 : 1024;
    sun.shadow.mapSize.set(smap, smap);
    const SR = G.shadows === 2 ? 60 : 45;
    sun.shadow.camera.left = -SR;
    sun.shadow.camera.right = SR;
    sun.shadow.camera.top = SR;
    sun.shadow.camera.bottom = -SR;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 260;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = G.shadows === 2 ? 2 : 4;
    scene.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight(0xcfeaff, 0x7cc26a, 1.1);
    scene.add(hemi);
    // image-based lighting: every PBR material picks up soft reflections and
    // bounce light from a prefiltered environment instead of flat ambient
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = LOW ? 0.15 : 0.35;

    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      const a = rand() * Math.PI * 2;
      const e = 0.1 + rand() * 1.3;
      starPos[i * 3] = Math.cos(a) * Math.cos(e) * 600;
      starPos[i * 3 + 1] = Math.sin(e) * 600;
      starPos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 600;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // soft drifting clouds
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, roughness: 1 });
    const clouds: THREE.Group[] = [];
    const cloudGeo = new THREE.IcosahedronGeometry(3, 1);
    for (let i = 0; i < 14; i++) {
      const c = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const puff = new THREE.Mesh(cloudGeo, cloudMat);
        puff.scale.setScalar(0.8 + rand() * 0.8);
        puff.position.set((j - 2) * 3.2, rand() * 1.4, rand() * 2.5);
        c.add(puff);
      }
      c.position.set((rand() - 0.5) * 300, 45 + rand() * 15, (rand() - 0.5) * 300);
      scene.add(c);
      clouds.push(c);
    }

    // butterflies (day) + fireflies (night) + dust motes
    const butterflies: { g: THREE.Group; w1: THREE.Mesh; w2: THREE.Mesh; a: number }[] = [];
    const wingGeo = new THREE.PlaneGeometry(0.4, 0.3);
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const wm = new THREE.MeshBasicMaterial({ color: [0xffa1c6, 0xa1d9ff, 0xfff3a1][i % 3], side: THREE.DoubleSide });
      const w1 = new THREE.Mesh(wingGeo, wm);
      const w2 = new THREE.Mesh(wingGeo, wm);
      w1.position.x = -0.2;
      w2.position.x = 0.2;
      g.add(w1, w2);
      g.position.set((rand() - 0.5) * 60, 3 + rand() * 2, (rand() - 0.5) * 60);
      scene.add(g);
      butterflies.push({ g, w1, w2, a: rand() * Math.PI * 2 });
    }
    const DUST = LOW ? 0 : 160;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(Math.max(1, DUST) * 3);
    for (let i = 0; i < DUST; i++) {
      dustPos[i * 3] = (rand() - 0.5) * 70;
      dustPos[i * 3 + 1] = 1 + rand() * 14;
      dustPos[i * 3 + 2] = (rand() - 0.5) * 70;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xfff6d8, size: 0.14, transparent: true, opacity: 0.55, depthWrite: false });
    const dust = new THREE.Points(dustGeo, dustMat);
    dust.visible = DUST > 0;
    scene.add(dust);
    const fireflies: THREE.Mesh[] = [];
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xd8ff7a, transparent: true, opacity: 0 });
    for (let i = 0; i < 18; i++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), fireflyMat);
      f.position.set((rand() - 0.5) * 50, 2, (rand() - 0.5) * 50);
      scene.add(f);
      fireflies.push(f);
    }

    // wildlife lives per chunk (see buildChunk); forage pickups too
    const animals = new Set<Animal>();
    preloadAnimalModels();
    const forage: { mesh: THREE.Object3D; item: string; key: string; chunk: string }[] = [];
    const picked = new Set<string>();
    const ridden = new Set<string>();
    let mount: Animal | null = null;

    // ---------- landmarks (pads first, so terrain is flat under them) ----------
    const homeY = addPad(HOME.x, HOME.z, 9);
    addPad(VILLAGE0.x, VILLAGE0.z, 17);
    SITES.forEach((s) => addPad(s.x, s.z, s.pad));
    const worldPhysics = new Physics();

    // ---------- player ----------
    const av: Avatar = buildAvatar(heroDef, progRef.current.equip);
    const player = av.root;
    scene.add(player);
    player.position.set(HOME.x + 6, terrainHeight(HOME.x + 6, HOME.z + 9), HOME.z + 9);
    applyEquipRef.current = () => av.setEquip(progRef.current.equip);
    const lantern = new THREE.PointLight(0xffd9a0, 0, 14);
    lantern.position.set(0.7, 1.8, 0.4);
    player.add(lantern);
    const emoteSelf = { sprite: null as THREE.Sprite | null, until: 0, at: 0 };

    // ---------- pets ----------
    function buildPet(id: string) {
      const g = new THREE.Group();
      if (id === "puppy") {
        const fur = new THREE.MeshStandardMaterial({ color: 0xa9743e });
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 10), fur);
        body.rotation.x = Math.PI / 2;
        body.position.y = 0.45;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), fur);
        head.position.set(0, 0.75, 0.5);
        const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.3, 2, 6), fur);
        tail.position.set(0, 0.65, -0.5);
        tail.rotation.x = -0.8;
        const e1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.06), new THREE.MeshStandardMaterial({ color: 0x7a4d2b }));
        e1.position.set(-0.18, 0.92, 0.45);
        const e2 = e1.clone();
        e2.position.x = 0.18;
        g.add(body, head, tail, e1, e2);
      } else if (id === "fox") {
        const fur = new THREE.MeshStandardMaterial({ color: 0xe07a2f });
        const white = new THREE.MeshStandardMaterial({ color: 0xfff4e6 });
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.55, 4, 10), fur);
        body.rotation.x = Math.PI / 2;
        body.position.y = 0.45;
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.5, 6), fur);
        head.rotation.x = Math.PI / 2;
        head.position.set(0, 0.72, 0.65);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 8), white);
        tail.rotation.x = -Math.PI / 2.5;
        tail.position.set(0, 0.68, -0.65);
        const e1 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.25, 4), fur);
        e1.position.set(-0.14, 1.0, 0.5);
        const e2 = e1.clone();
        e2.position.x = 0.14;
        g.add(body, head, tail, e1, e2);
      } else {
        const feathers = new THREE.MeshStandardMaterial({ color: 0x4b9fe1 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), feathers);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), feathers);
        head.position.set(0, 0.28, 0.18);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), new THREE.MeshStandardMaterial({ color: 0xffb02e }));
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0.28, 0.38);
        const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), feathers);
        w1.position.set(-0.3, 0.05, 0);
        const w2 = w1.clone();
        w2.position.x = 0.3;
        g.add(body, head, beak, w1, w2);
        g.userData.wings = [w1, w2];
      }
      g.traverse((o) => o instanceof THREE.Mesh && (o.castShadow = true));
      g.visible = false;
      scene.add(g);
      return g;
    }
    const petMeshes = new Map(PETS.map((p) => [p.id, buildPet(p.id)]));
    function activePetId(): string | null {
      const lv = levelFromXp(progRef.current.xp);
      const unlocked = PETS.filter((p) => lv >= p.level);
      if (!unlocked.length) return null;
      if (progRef.current.pet && unlocked.some((p) => p.id === progRef.current.pet)) return progRef.current.pet;
      return unlocked[unlocked.length - 1].id;
    }

    // ---------- chunked world with painted terrain ----------
    const chunks = new Map<string, THREE.Group>();
    // trunk: tapered, slightly irregular, with root flare at the base
    const trunkGeo = (() => {
      const g = new THREE.CylinderGeometry(0.26, 0.62, 2.8, 9, 5);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const t = (y + 1.4) / 2.8;
        const flare = t < 0.18 ? 1 + (0.18 - t) * 1.6 : 1;
        const lean = Math.sin(t * 2.2) * 0.12;
        p.setX(i, x * flare + lean);
        p.setZ(i, z * flare * (1 + Math.sin(y * 3.1 + x * 2) * 0.06));
      }
      g.computeVertexNormals();
      g.translate(0, 0.1, 0);
      return g;
    })();
    // leaf cluster: a lumpy blob, not a clean sphere
    const blobGeo = (() => {
      const g = new THREE.IcosahedronGeometry(1.6, 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const k = 1 + Math.sin(x * 2.3) * 0.13 + Math.cos(z * 2.7) * 0.11 + Math.sin(y * 3.1) * 0.09;
        p.setXYZ(i, x * k, y * k * 0.92, z * k);
      }
      g.computeVertexNormals();
      return g;
    })();
    // pine tiers: drooping, ragged skirts instead of smooth cones
    const pineTier = (r: number, h: number) => {
      const g = new THREE.ConeGeometry(r, h, 11, 3);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const t = 1 - (y + h / 2) / h;
        const ragged = 1 + Math.sin(Math.atan2(z, x) * 7) * 0.12 * t;
        p.setX(i, x * ragged);
        p.setZ(i, z * ragged);
        p.setY(i, y - t * t * 0.28 * h); // branches sag toward the tips
      }
      g.computeVertexNormals();
      return g;
    };
    const coneGeos = [pineTier(2.3, 3), pineTier(1.8, 2.6), pineTier(1.2, 2.1)];
    const leafMats = [0x2e8b46, 0x3aa055, 0x4fb562, 0x27793c].map((c) => new THREE.MeshStandardMaterial({ color: c, flatShading: true, roughness: 0.9 }));
    const autumn = new THREE.MeshStandardMaterial({ color: 0xe0923a, flatShading: true, roughness: 0.9 });
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x2a6e4f, flatShading: true });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf2f7fb, flatShading: true });
    const cactusMat = new THREE.MeshStandardMaterial({ color: 0x3f9e58, roughness: 0.7 });
    // Photo-scanned CC0 textures from Poly Haven (public/textures). They load
    // in the background; until then the procedural colours below are used.
    const texLoader = new THREE.TextureLoader();
    const photoTex = (name: string) => {
      const t = texLoader.load(`/textures/${name}_diff.jpg`);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return t;
    };
    const tGrass = photoTex("aerial_grass_rock");
    const tSoil = photoTex("forest_ground_04");
    const tRock = photoTex("rock_face");
    const tBark = photoTex("bark_willow_02");
    tBark.repeat.set(1, 2);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0xb08a6a, map: tBark, roughness: 0.95 });
    const flowerMats = [0xffffff, 0xffd447, 0xff8fb3, 0xb28fff, 0xff6b4a].map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.12 }));
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x3f8f3a });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, flatShading: true, roughness: 0.95 });
    const sandRockMat = new THREE.MeshStandardMaterial({ color: 0xc9a15f, flatShading: true });
    const groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    // surface detail without textures: multi-scale noise breaks up flat
    // colour (soil patches, grass tufts), steep slopes turn to rock, and a
    // micro-normal perturbation gives the ground a lit, grainy relief
    groundMat.onBeforeCompile = (sh) => {
      sh.uniforms.tGrass = { value: tGrass };
      sh.uniforms.tSoil = { value: tSoil };
      sh.uniforms.tRock = { value: tRock };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNorm;")
        .replace(
          "#include <worldpos_vertex>",
          "#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNorm = normalize(mat3(modelMatrix) * objectNormal);"
        );
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vWPos;
varying vec3 vWNorm;
uniform sampler2D tGrass;
uniform sampler2D tSoil;
uniform sampler2D tRock;
float gLum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float gHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gNoise(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(gHash(i), gHash(i+vec2(1.,0.)), f.x), mix(gHash(i+vec2(0.,1.)), gHash(i+vec2(1.,1.)), f.x), f.y); }`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
{
  float n1 = gNoise(vWPos.xz * 0.08);
  float n2 = gNoise(vWPos.xz * 0.6);
  float n3 = gNoise(vWPos.xz * 3.1);
  diffuseColor.rgb *= 0.82 + n1 * 0.18 + n2 * 0.12 + n3 * 0.08;
  float slope = 1.0 - clamp(vWNorm.y, 0.0, 1.0);
  // rock: warm/cool strata that follow height (wobbled so the bands are not
  // ruler-straight), plus dark ridged cracks
  float band = vWPos.y * 1.3 + gNoise(vWPos.xz * 0.35) * 2.5;
  float strata = 0.5 + 0.5 * sin(band);
  vec3 rock = mix(vec3(0.42, 0.40, 0.38), vec3(0.56, 0.52, 0.46), strata) * (0.8 + n2 * 0.3);
  float crack = 1.0 - abs(gNoise(vWPos.xz * 1.7 + vWPos.y * 0.9) * 2.0 - 1.0);
  rock *= 1.0 - smoothstep(0.9, 0.99, crack) * 0.45;
  diffuseColor.rgb = mix(diffuseColor.rgb, rock, smoothstep(0.28, 0.5, slope));
  // scattered pebbles and bare-soil specks on flat ground
  // (round, soft-edged dots inside each cell, never full square cells)
  vec2 pc = vWPos.xz * 6.0;
  float peb = gHash(floor(pc));
  float pd = length(fract(pc) - 0.5);
  float flat_ = 1.0 - smoothstep(0.15, 0.3, slope);
  float pebMask = step(0.985, peb) * (1.0 - smoothstep(0.18, 0.3, pd));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.5, 0.44) * (0.85 + n3 * 0.3), pebMask * flat_ * 0.6);
  // photo detail: grass and forest-floor luminance modulate the biome tint
  // (so snow and sand keep their colour); slopes get tri-planar rock photo
  vec2 uv = vWPos.xz * 0.25;
  float gd = gLum(texture2D(tGrass, uv).rgb) / 0.32;
  float sd = gLum(texture2D(tSoil, uv * 0.8 + 0.37).rgb) / 0.30;
  float detail = mix(gd, sd, smoothstep(0.35, 0.75, n1));
  diffuseColor.rgb *= mix(1.0, clamp(detail, 0.45, 1.6), 0.65 * flat_);
  vec3 bw = pow(abs(vWNorm), vec3(4.0));
  bw /= (bw.x + bw.y + bw.z);
  vec3 rp = texture2D(tRock, vWPos.zy * 0.12).rgb * bw.x
          + texture2D(tRock, vWPos.xz * 0.12).rgb * bw.y
          + texture2D(tRock, vWPos.xy * 0.12).rgb * bw.z;
  diffuseColor.rgb = mix(diffuseColor.rgb, rp * 1.1, smoothstep(0.3, 0.55, slope) * 0.85);
}`
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
{
  float e = 0.15;
  float h0 = gNoise(vWPos.xz * 2.2);
  float hx = gNoise((vWPos.xz + vec2(e, 0.0)) * 2.2);
  float hz = gNoise((vWPos.xz + vec2(0.0, e)) * 2.2);
  normal = normalize(normal + (vec3(h0 - hx, 0.0, h0 - hz) * 0.55));
}`
        );
    };
    const uTime = { value: 0 };
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2f86c8, transparent: true, opacity: 0.8, roughness: 0.12, metalness: 0.15,
      emissive: 0x0a3050, emissiveIntensity: 0.25,
    });
    waterMat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime;
      sh.vertexShader =
        "uniform float uTime;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           vec4 wpW = modelMatrix * vec4(transformed, 1.0);
           transformed.z += sin(uTime * 1.1 + wpW.x * 0.25) * 0.18 + cos(uTime * 0.8 + wpW.z * 0.2) * 0.12;`
        );
    };
    const bladeGeo = (() => {
      // one tuft: five tapered blades fanning out from a common root
      const parts: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 5; i++) {
        const h = 0.6 + ((i * 37) % 11) / 20;
        const p = new THREE.PlaneGeometry(0.15, h, 1, 3);
        const pos = p.attributes.position;
        for (let v = 0; v < pos.count; v++) {
          const y = pos.getY(v) + h / 2;
          const t = y / h;
          pos.setX(v, pos.getX(v) * (1 - t * 0.75)); // taper to a point
          pos.setZ(v, t * t * (0.18 + ((i * 13) % 7) / 40)); // bend over
        }
        p.translate(0, h / 2, 0);
        p.rotateY((i / 5) * Math.PI * 2 + ((i * 29) % 13) / 30);
        p.translate(((i % 3) - 1) * 0.06, 0, (((i + 1) % 3) - 1) * 0.06);
        p.computeVertexNormals();
        parts.push(p);
      }
      return mergeGeometries(parts) ?? new THREE.PlaneGeometry(0.17, 0.85);
    })();
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x5aad4a, side: THREE.DoubleSide, roughness: 0.9 });
    // meadow flowers: a slim stem with a ring of petals and a bright centre
    const flowerGeo = (() => {
      const parts: THREE.BufferGeometry[] = [];
      const stem = new THREE.CylinderGeometry(0.011, 0.016, 0.24, 4);
      stem.translate(0, 0.12, 0);
      parts.push(stem);
      for (let i = 0; i < 5; i++) {
        const petal = new THREE.SphereGeometry(0.05, 6, 4);
        petal.scale(1.7, 0.2, 0.52); // long, thin petal
        const a = (i / 5) * Math.PI * 2;
        petal.translate(0.085, 0, 0);
        petal.rotateY(-a);
        petal.translate(0, 0.25, 0);
        parts.push(petal);
      }
      const eye = new THREE.SphereGeometry(0.032, 7, 5);
      eye.scale(1, 0.6, 1);
      eye.translate(0, 0.262, 0);
      parts.push(eye);
      return mergeGeometries(parts) ?? new THREE.SphereGeometry(0.06, 5, 4);
    })();
    const flowerMat = new THREE.MeshStandardMaterial({ roughness: 0.75, vertexColors: false });
    const FLOWERS = Math.round(130 * G.grass);
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
    // each instance is a tuft of crossed blades, so the meadow reads as dense
    // ground cover rather than scattered single leaves
    const BLADES = Math.round(900 * G.grass);
    const cA = new THREE.Color();
    const cB = new THREE.Color();

    const berryLeaf = new THREE.MeshStandardMaterial({ color: 0x2f7a3a, roughness: 0.85, flatShading: true });
    const berryFruit = new THREE.MeshStandardMaterial({ color: 0xc2304a, roughness: 0.3, emissive: 0x3a0010, emissiveIntensity: 0.25 });
    const shroomCap = new THREE.MeshStandardMaterial({ color: 0xc9543a, roughness: 0.5 });
    const shroomStem = new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.7 });
    const pinkPetal = new THREE.MeshStandardMaterial({ color: 0xf2a8c8, roughness: 0.5, emissive: 0x401020, emissiveIntensity: 0.15 });
    const bushGeo = new THREE.IcosahedronGeometry(0.7, 1);
    const berryGeo = new THREE.SphereGeometry(0.09, 8, 6);
    function forageMesh(item: string) {
      const g = new THREE.Group();
      if (item === "berry") {
        const bush = new THREE.Mesh(bushGeo, berryLeaf);
        bush.scale.set(1.1, 0.8, 1.1);
        bush.position.y = 0.45;
        bush.castShadow = true;
        g.add(bush);
        for (let i = 0; i < 9; i++) {
          const b = new THREE.Mesh(berryGeo, berryFruit);
          const a = i * 2.4;
          b.position.set(Math.cos(a) * 0.62, 0.35 + (i % 3) * 0.18, Math.sin(a) * 0.62);
          g.add(b);
        }
      } else if (item === "mushroom") {
        for (let i = 0; i < 3; i++) {
          const s = 0.7 + i * 0.25;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.3 * s, 8), shroomStem);
          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), shroomCap);
          const ox = (i - 1) * 0.25;
          stem.position.set(ox, 0.15 * s, i * 0.1);
          cap.position.set(ox, 0.28 * s, i * 0.1);
          g.add(stem, cap);
        }
      } else {
        for (let k = 0; k < 4; k++) {
          const fx = (k % 2) * 0.35 - 0.15;
          const fz = (k >> 1) * 0.35 - 0.15;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 4), stemMat);
          stem.position.set(fx, 0.27, fz);
          g.add(stem);
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const p = new THREE.Mesh(berryGeo, pinkPetal);
            p.scale.set(1.2, 0.5, 0.8);
            p.position.set(fx + Math.cos(a) * 0.09, 0.57, fz + Math.sin(a) * 0.09);
            g.add(p);
          }
          const c = new THREE.Mesh(berryGeo, flowerMats[1]);
          c.scale.setScalar(0.6);
          c.position.set(fx, 0.6, fz);
          g.add(c);
        }
      }
      return g;
    }

    function buildChunk(cx: number, cz: number, key: string) {
      const g = new THREE.Group();
      const owner = `c:${key}`;
      const biome = biomeAt(cx * CHUNK, cz * CHUNK);
      const seg = LOW ? 20 : 30;
      const geo = new THREE.PlaneGeometry(CHUNK, CHUNK, seg, seg);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      let minY = Infinity;
      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i) + cx * CHUNK;
        const wz = pos.getZ(i) + cz * CHUNK;
        const y = terrainHeight(wx, wz);
        if (y < minY) minY = y;
        pos.setY(i, y);
        const b = biomeAt(wx, wz);
        const n = hash2(Math.floor(wx * 0.7), Math.floor(wz * 0.7));
        if (y < WATER_Y + 0.7) cA.setHex(0xdcc88e).lerp(cB.setHex(0xc9b070), n * 0.5);
        else if (b === "desert") cA.setHex(0xe8c97c).lerp(cB.setHex(0xd6a95e), n * 0.7);
        else if (b === "snow") cA.setHex(0xf1f6fa).lerp(cB.setHex(0xc9d8e6), n * 0.5);
        else {
          cA.setHex(0x5cb54c).lerp(cB.setHex(0x8fd06a), n * 0.7);
          if (y > 4) cA.lerp(cB.setHex(0x8c9a6a), Math.min(1, (y - 4) / 4));
        }
        colors[i * 3] = cA.r;
        colors[i * 3 + 1] = cA.g;
        colors[i * 3 + 2] = cA.b;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      const ground = new THREE.Mesh(geo, groundMat);
      ground.position.set(cx * CHUNK, 0, cz * CHUNK);
      ground.receiveShadow = true;
      g.add(ground);
      // PlaneGeometry positions are local; shift so vertex heights match world
      pos.needsUpdate = true;

      if (minY < WATER_Y - 0.1) {
        const water = new THREE.Mesh(new THREE.PlaneGeometry(CHUNK, CHUNK, LOW ? 1 : 16, LOW ? 1 : 16), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(cx * CHUNK, WATER_Y, cz * CHUNK);
        g.add(water);
      }

      if (BLADES && biome === "grass") {
        const blades = new THREE.InstancedMesh(bladeGeo, grassMat, BLADES);
        blades.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(BLADES * 3), 3);
        const tint = new THREE.Color();
        const mtx = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const sc = new THREE.Vector3();
        const pv = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        let placed = 0;
        for (let i = 0; i < BLADES; i++) {
          const bx = cx * CHUNK + (hash2(cx * 13 + i, cz * 29 + i * 3) - 0.5) * CHUNK;
          const bz = cz * CHUNK + (hash2(cx * 37 + i * 5, cz * 11 + i) - 0.5) * CHUNK;
          const by = terrainHeight(bx, bz);
          if (by < WATER_Y + 0.35) continue;
          pv.set(bx, by, bz);
          q.setFromAxisAngle(up, hash2(bz, bx) * Math.PI * 2);
          const s = 0.42 + hash2(bx, bz) * 0.45;
          sc.set(0.85 + hash2(bz * 3, bx) * 0.5, s, 0.85 + hash2(bx * 3, bz) * 0.5);
          mtx.compose(pv, q, sc);
          // shade each tuft a little differently: sunlit tips, shaded hollows
          const k = hash2(bx * 0.7, bz * 0.7);
          const shadeK = forestAt(bx, bz);
          tint.setRGB(0.78 + k * 0.4 - shadeK * 0.18, 0.95 + k * 0.25 - shadeK * 0.1, 0.62 + k * 0.32 - shadeK * 0.12);
          blades.setColorAt(placed, tint);
          blades.setMatrixAt(placed++, mtx);
        }
        blades.count = placed;
        blades.instanceMatrix.needsUpdate = true;
        if (blades.instanceColor) blades.instanceColor.needsUpdate = true;
        blades.computeBoundingSphere();
        g.add(blades);

        // flowers bloom in patches, thickest in open meadow
        if (FLOWERS) {
          const fl = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWERS);
          fl.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(FLOWERS * 3), 3);
          const petal = new THREE.Color();
          const palette = [0xf2f2f4, 0xffd766, 0xef7fae, 0x9f7fe0, 0xff8f5e, 0x7fd2f0];
          let fp = 0;
          for (let i = 0; i < FLOWERS; i++) {
            const fx = cx * CHUNK + (hash2(cx * 19 + i * 7, cz * 23 + i) - 0.5) * CHUNK;
            const fz = cz * CHUNK + (hash2(cx * 41 + i, cz * 17 + i * 3) - 0.5) * CHUNK;
            const fy = terrainHeight(fx, fz);
            if (fy < WATER_Y + 0.4) continue;
            if (fbm(fx * 0.05, fz * 0.05, 2, 77) < 0.08) continue; // clump, don't sprinkle
            pv.set(fx, fy, fz);
            q.setFromAxisAngle(up, hash2(fz, fx) * Math.PI * 2);
            const fs = 0.95 + hash2(fx, fz) * 0.6;
            sc.set(fs, fs * (0.85 + hash2(fz, fx) * 0.4), fs);
            mtx.compose(pv, q, sc);
            petal.setHex(palette[Math.floor(hash2(fx * 0.3, fz * 0.3) * palette.length)]);
            fl.setColorAt(fp, petal);
            fl.setMatrixAt(fp++, mtx);
          }
          fl.count = fp;
          fl.instanceMatrix.needsUpdate = true;
          if (fl.instanceColor) fl.instanceColor.needsUpdate = true;
          fl.computeBoundingSphere();
          fl.castShadow = false;
          g.add(fl);
        }
      }

      // wildlife herd for this chunk
      if (G.wildlife > 0) {
        for (const h of herdFor(cx, cz, CHUNK)) {
          if (hash2(h.seed, 0.7) > G.wildlife / 1.5 + 0.15) continue;
          const a = buildAnimal(h.species, h.seed);
          a.owner = owner;
          a.group.position.set(h.x, terrainHeight(h.x, h.z), h.z);
          scene.add(a.group);
          animals.add(a);
        }
      }
      // forage: berry bushes, flower clumps, mushroom rings
      for (let i = 0; i < 5; i++) {
        const fx = cx * CHUNK + (hash2(cx * 17 + i * 3.1, cz * 23 + i) - 0.5) * CHUNK;
        const fz = cz * CHUNK + (hash2(cx * 29 + i, cz * 19 + i * 5.3) - 0.5) * CHUNK;
        const fy = terrainHeight(fx, fz);
        const key = `${Math.round(fx)},${Math.round(fz)}`;
        if (fy < WATER_Y + 0.4 || picked.has(key) || nearLandmark(fx, fz, 3) || biome === "desert") continue;
        const fr = forestAt(fx, fz);
        const item = biome === "snow" ? "berry" : fr > 0.6 ? (i % 2 ? "mushroom" : "berry") : i % 3 === 0 ? "berry" : "flower";
        const mesh = forageMesh(item);
        mesh.position.set(fx, fy, fz);
        mesh.rotation.y = hash2(fx, fz) * 6.28;
        g.add(mesh);
        forage.push({ mesh, item, key, chunk: owner });
      }

      // props — every tree trunk and boulder is solid. Forest cover decides
      // how many trees grow, so open meadows and deep woods alternate.
      const density = forestAt(cx * CHUNK, cz * CHUNK);
      const PROPS = Math.round(8 + density * 26);
      for (let i = 0; i < PROPS; i++) {
        const r1 = hash2(cx * 91 + i * 7, cz * 57 + i * 13);
        const r2 = hash2(cx * 31 + i * 17, cz * 77 + i * 3);
        const x = cx * CHUNK + (r1 - 0.5) * CHUNK;
        const z = cz * CHUNK + (r2 - 0.5) * CHUNK;
        const y = terrainHeight(x, z);
        if (y < WATER_Y + 0.3 || nearLandmark(x, z, 4)) continue;
        const local = forestAt(x, z);
        let kind = hash2(x, z);
        if (biome === "grass") {
          // remap so the tree share (kind < 0.42) follows local forest cover
          const treeChance = 0.12 + local * 0.7;
          kind = kind < treeChance ? (kind / treeChance) * 0.42 : 0.42 + ((kind - treeChance) / (1 - treeChance)) * 0.58;
        }
        const s = 0.8 + hash2(z, x) * 0.5;
        // every prop gets its own turn, tilt and slight squash, so repeated
        // geometry never reads as copy-paste
        const spin = hash2(x * 1.7, z * 2.3) * Math.PI * 2;
        const tilt = (hash2(z * 3.1, x * 1.3) - 0.5) * 0.12;
        const add = (m: THREE.Mesh, px: number, py: number, pz: number, sc = 1) => {
          m.position.set(px, py, pz);
          m.scale.set(sc * (0.92 + hash2(px, pz) * 0.18), sc * (0.94 + hash2(pz, px) * 0.16), sc * (0.92 + hash2(px * 2, pz) * 0.18));
          m.rotation.set(tilt, spin + hash2(px, py) * 0.6, tilt * 0.7);
          m.castShadow = true;
          m.receiveShadow = true;
          g.add(m);
        };
        if (biome === "desert") {
          if (kind < 0.4) {
            add(new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 2.2, 4, 10), cactusMat), x, y + 1.4, z);
            const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.8, 4, 8), cactusMat);
            add(arm, x + 0.55, y + 1.9, z);
            worldPhysics.addBox(owner, x, y + 1.4, z, 0.8, 2.8, 0.8);
          } else if (kind < 0.75) {
            add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 + kind, 0), sandRockMat), x, y + 0.35, z);
            const rs = (0.6 + kind) * 1.3;
            worldPhysics.addBox(owner, x, y + 0.35, z, rs, rs, rs);
          }
        } else if (biome === "snow") {
          if (kind < 0.5) {
            add(new THREE.Mesh(trunkGeo, trunkMat), x, y + 1.2, z, s);
            add(new THREE.Mesh(coneGeos[0], pineMat), x, y + 3.2 * s, z, s);
            add(new THREE.Mesh(coneGeos[1], pineMat), x, y + 4.5 * s, z, s);
            add(new THREE.Mesh(coneGeos[2], snowCapMat), x, y + 5.6 * s, z, s);
            worldPhysics.addBox(owner, x, y + 1.5, z, 0.9, 3, 0.9);
          } else if (kind < 0.8) {
            add(new THREE.Mesh(new THREE.SphereGeometry(0.5 + kind * 0.4, 10, 8), snowCapMat), x, y + 0.2, z);
          }
        } else {
          if (kind < 0.42) {
            const pine = kind < 0.12;
            add(new THREE.Mesh(trunkGeo, trunkMat), x, y + 1.3 * s, z, s);
            if (pine) {
              add(new THREE.Mesh(coneGeos[0], pineMat), x, y + 3.2 * s, z, s);
              add(new THREE.Mesh(coneGeos[1], pineMat), x, y + 4.4 * s, z, s);
              add(new THREE.Mesh(coneGeos[2], pineMat), x, y + 5.5 * s, z, s);
            } else {
              const m = kind > 0.39 ? autumn : leafMats[i % 4];
              add(new THREE.Mesh(blobGeo, m), x, y + 3.8 * s, z, 1.25 * s);
              add(new THREE.Mesh(blobGeo, m), x + 0.9 * s, y + 3.1 * s, z + 0.4 * s, 0.85 * s);
              add(new THREE.Mesh(blobGeo, m), x - 0.9 * s, y + 3.3 * s, z - 0.3 * s, 0.9 * s);
            }
            worldPhysics.addBox(owner, x, y + 1.3, z, 0.9 * s, 2.6, 0.9 * s);
          } else if (kind < 0.8) {
            // a little flower patch
            for (let f = 0; f < 3; f++) {
              const fx = x + (hash2(i, f) - 0.5) * 1.4;
              const fz = z + (hash2(f, i) - 0.5) * 1.4;
              const fy = terrainHeight(fx, fz);
              add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4), stemMat), fx, fy + 0.25, fz);
              add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), flowerMats[(i + f) % 5]), fx, fy + 0.55, fz);
            }
          } else {
            const rs = 0.8 + kind;
            add(new THREE.Mesh(new THREE.DodecahedronGeometry(rs, 0), rockMat), x, y + 0.4, z);
            worldPhysics.addBox(owner, x, y + 0.2, z, rs * 1.3, rs * 1.2, rs * 1.3);
          }
        }
      }
      return g;
    }

    // ---------- villages: real houses you can walk into ----------
    interface Village { g: THREE.Group; elder: THREE.Group; rooms: HouseRoom[]; lights: THREE.Vector3[] }
    const villages = new Map<string, Village>();
    const allRooms = new Set<HouseRoom>();
    function buildElder() {
      const elder = new THREE.Group();
      const robe = new THREE.MeshStandardMaterial({ color: 0x6d5bd0 });
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.6, 12), robe);
      body.position.y = 0.8;
      const headE = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), new THREE.MeshStandardMaterial({ color: 0xf1c6a0 }));
      headE.position.y = 1.85;
      const beard = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xe8e8e8 }));
      beard.position.set(0, 1.6, 0.22);
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.7, 12), robe);
      hat.position.y = 2.3;
      elder.add(body, headE, beard, hat);
      elder.traverse((o) => o instanceof THREE.Mesh && (o.castShadow = true));
      return elder;
    }
    function buildVillage(x: number, z: number, owner: string): Village {
      const g = new THREE.Group();
      const rooms: HouseRoom[] = [];
      const lights: THREE.Vector3[] = [];
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.6;
        const hx = x + Math.cos(a) * 12;
        const hz = z + Math.sin(a) * 12;
        const q = Math.round(Math.atan2(x - hx, z - hz) / (Math.PI / 2));
        const h = buildHouse(worldPhysics, owner, hx, hz, q, hash2(hx, hz));
        g.add(h.group);
        rooms.push(h.room);
        allRooms.add(h.room);
        lights.push(h.center);
      }
      const elder = buildElder();
      elder.position.set(x, terrainHeight(x, z), z);
      g.add(elder);
      // village well
      const well = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 0.9, 16), new THREE.MeshStandardMaterial({ color: 0xa79f93, flatShading: true }));
      const wy = terrainHeight(x + 3, z + 2);
      well.position.set(x + 3, wy + 0.45, z + 2);
      well.castShadow = true;
      g.add(well);
      worldPhysics.addBox(owner, x + 3, wy + 0.45, z + 2, 2.1, 0.9, 2.1);
      if (owner !== "v:start") {
        const sign = label(villageName(x, z), { scale: 1.2 });
        sign.position.set(x, terrainHeight(x, z) + 7, z);
        g.add(sign);
      }
      scene.add(g);
      return { g, elder, rooms, lights };
    }
    const startVillage = buildVillage(VILLAGE0.x, VILLAGE0.z, "v:start");
    const nameSign = label(pick(langRef.current, "Desa Padang", "Meadow Village"), { scale: 1.4 });
    nameSign.position.set(VILLAGE0.x, terrainHeight(VILLAGE0.x, VILLAGE0.z) + 7, VILLAGE0.z);
    scene.add(nameSign);

    // ---------- tree house ----------
    const th = buildTreeHouse(worldPhysics, "home", HOME.x, HOME.z, homeY);
    const treeHouse = th.group;
    scene.add(treeHouse);
    allRooms.add(th.room);

    // ---------- doorways into the cave, the mountain hall and the arena ----------
    const siteTitles: Record<PortalKind, [string, string]> = {
      cave: ["Gua Kristal", "Crystal Cave"],
      hall: ["Aula Gunung", "Mountain Hall"],
      arena: ["Arena Latihan", "Training Arena"],
    };
    type Site = ReturnType<typeof buildPortalSite> & { owner: string; kind: PortalKind };
    const sites: Site[] = SITES.map((s) => {
      const title = pick(langRef.current, siteTitles[s.kind][0], siteTitles[s.kind][1]);
      const site = buildPortalSite(worldPhysics, `site:${s.kind}`, s.kind, s.x, s.z, terrainHeight(s.x, s.z), title);
      scene.add(site.group);
      return { ...site, owner: `site:${s.kind}`, kind: s.kind };
    });
    // procedural dungeons far out in the world, built as their region nears
    const dungeonSites = new Map<string, Site | null>();
    let enteredSite: Site | null = null;
    function streamDungeons(prx: number, prz: number) {
      for (let dx = -3; dx <= 3; dx++)
        for (let dz = -3; dz <= 3; dz++) {
          const d = dungeonPos(prx + dx, prz + dz);
          if (d) addPad(d.x, d.z, d.pad); // flatten before nearby chunks build
        }
      for (let dx = -1; dx <= 1; dx++)
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${prx + dx},${prz + dz}`;
          if (dungeonSites.has(key)) continue;
          const d = dungeonPos(prx + dx, prz + dz);
          if (!d) {
            dungeonSites.set(key, null);
            continue;
          }
          const owner = `dg:${key}`;
          const built = buildPortalSite(worldPhysics, owner, d.kind, d.x, d.z, terrainHeight(d.x, d.z), dungeonName(d, langRef.current));
          scene.add(built.group);
          const site: Site = { ...built, owner, kind: d.kind };
          sites.push(site);
          dungeonSites.set(key, site);
        }
      dungeonSites.forEach((site, key) => {
        const [rx, rz] = key.split(",").map(Number);
        if (Math.abs(rx - prx) <= 2 && Math.abs(rz - prz) <= 2) return;
        if (site && site !== enteredSite) {
          scene.remove(site.group);
          worldPhysics.removeOwner(site.owner);
          sites.splice(sites.indexOf(site), 1);
        }
        const d = dungeonPos(rx, rz);
        if (d && (Math.abs(rx - prx) > 4 || Math.abs(rz - prz) > 4)) removePad(d.x, d.z);
        if (site !== enteredSite) dungeonSites.delete(key);
      });
    }

    // decorations placed on the tree house
    const decorMeshes = new Map<string, THREE.Object3D>();
    function buildDecor(id: string): THREE.Object3D {
      const g = new THREE.Group();
      const M = (c: number, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color: c, ...extra });
      if (id === "flag") {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), M(0xdcd0b8));
        pole.position.set(2.6, 6.4, -2.4);
        g.add(pole);
        [0xff6b6b, 0xffd447, 0x6bd0ff].forEach((c, i) => {
          const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), M(c, { side: THREE.DoubleSide }));
          cl.position.set(3.05, 7.1 - i * 0.55, -2.4);
          g.add(cl);
        });
      } else if (id === "pot") {
        for (let i = 0; i < 3; i++) {
          const px = -2.6 + i * 0.5;
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.35, 10), M(0xc06a4a));
          pot.position.set(px, 5.53, 2.6);
          const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), M([0xff8fb3, 0xffd447, 0xb28fff][i]));
          bloom.position.set(px, 5.85, 2.6);
          g.add(pot, bloom);
        }
      } else if (id === "lights") {
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), M(0xfff0b0, { emissive: 0xffc94a, emissiveIntensity: 1.4 }));
          bulb.position.set(Math.cos(a) * 3.1, 6.45 + Math.sin(a * 3) * 0.12, Math.sin(a) * 3.1);
          g.add(bulb);
        }
        const warm = new THREE.PointLight(0xffc94a, 6, 14);
        warm.position.set(0, 6.6, 0);
        g.add(warm);
      } else if (id === "swing") {
        const rope = M(0xd8c9a8);
        const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 5), rope);
        r1.position.set(-3.5, 3.55, 0.5);
        const r2 = r1.clone();
        r2.position.z = -0.5;
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 1.3), M(0x8a5a2b));
        seat.position.set(-3.5, 1.9, 0);
        g.add(r1, r2, seat);
      } else if (id === "chime") {
        const bar = M(0xd7dde6, { metalness: 0.6, roughness: 0.3 });
        for (let i = 0; i < 5; i++) {
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6 + i * 0.1, 6), bar);
          tube.position.set(1.0 + i * 0.16, 7.4 - i * 0.05, 1.9);
          g.add(tube);
        }
      } else if (id === "telescope") {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.6, 12), M(0x3a4a6a, { metalness: 0.5 }));
        body.rotation.z = Math.PI / 5;
        body.position.set(-2.5, 6.5, -2.3);
        const tri = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.0, 3), M(0x6a5a4a));
        tri.position.set(-2.5, 5.85, -2.3);
        g.add(body, tri);
      } else if (id === "gnome") {
        const gh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 10), M(0xe14b4b));
        gh.position.set(-2.2, 1.1, 5.8);
        const gb = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.55, 10), M(0x4b8fe1));
        gb.position.set(-2.2, 0.55, 5.8);
        const gbeard = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 8), M(0xf2f2f2));
        gbeard.position.set(-2.2, 0.68, 5.98);
        g.add(gh, gb, gbeard);
      } else {
        const cl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), M(0x7b4fd0, { side: THREE.DoubleSide }));
        cl.position.set(0, 8.35, 1.85);
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.35), M(0xffd447, { emissive: 0xffb300, emissiveIntensity: 0.9 }));
        star.position.set(0, 8.35, 1.95);
        g.add(cl, star);
      }
      g.visible = false;
      treeHouse.add(g);
      return g;
    }
    DECORS.forEach((d) => decorMeshes.set(d.id, buildDecor(d.id)));
    function syncDecor() {
      const placed = progRef.current.placedDecors;
      decorMeshes.forEach((mesh, id) => (mesh.visible = placed.includes(id)));
    }
    syncDecor();
    syncDecorRef.current = syncDecor;

    // ---------- zones: open world or one of the interiors ----------
    let zone: Zone = "world";
    let activeScene: THREE.Scene = scene;
    let phys: Physics = worldPhysics;
    let activeInterior: Interior | null = null;
    const interiors = new Map<InteriorId, Interior>();
    const critters = new Critters(scene);
    let portalCooldown = 1.5;
    let arenaPops = 0;
    let composerPass: RenderPass | null = null;
    let aoPass: GTAOPass | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    const remotes = new Map<string, { av: Avatar; tag: THREE.Sprite; emote: THREE.Sprite | null; emoteUntil: number; lastEmoteAt: number; eqKey: string; walk: number; zone: string }>();

    function moveActors(to: THREE.Scene) {
      to.add(player);
      petMeshes.forEach((m) => to.add(m));
      remotes.forEach((r) => to.add(r.av.root));
      critters.setScene(to);
      if (composerPass) composerPass.scene = to;
      if (aoPass) aoPass.scene = to;
      if (bloomPass) bloomPass.enabled = to !== scene;
      to.environment = envTex;
    }

    // ---------- quests ----------
    let questIdx = 0;
    let kind: QuestKind = "collect";
    let need = 0;
    let got = 0;
    let items: THREE.Mesh[] = [];
    let gates: THREE.Group[] = [];
    let gateIdx = 0;
    let raceEndsAt = 0;
    let target: THREE.Group | null = null;

    function spotNear(minD: number, maxD: number) {
      for (let tries = 0; tries < 16; tries++) {
        const ang = rand() * Math.PI * 2;
        const dist = minD + rand() * (maxD - minD);
        const x = player.position.x + Math.cos(ang) * dist;
        const z = player.position.z + Math.sin(ang) * dist;
        if (terrainHeight(x, z) > WATER_Y + 0.4 && !worldPhysics.inside(x, terrainHeight(x, z) + 1, z, 0.8)) return { x, z };
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
    function buildGate(x: number, z: number, n: number) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 10, 28), new THREE.MeshStandardMaterial({ color: 0x59d0ff, emissive: 0x2f9fd0, emissiveIntensity: 0.8 }));
      ring.position.y = 2.4;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xe8d7a8 }));
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
      const gold = new THREE.MeshStandardMaterial({ color: 0xffd447, emissive: 0xffb300, emissiveIntensity: 0.5, metalness: 0.4, roughness: 0.35 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.1), wood);
      box.position.y = 0.5;
      box.castShadow = true;
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 1.7, 16, 1, false, 0, Math.PI), gold);
      lid.rotation.z = Math.PI / 2;
      lid.position.y = 1.0;
      const beam = new THREE.PointLight(0xffd447, 3, 10);
      beam.position.y = 2;
      g.add(box, lid, beam);
      g.position.set(x, terrainHeight(x, z), z);
      scene.add(g);
      return g;
    }
    function buildDropoff(x: number, z: number) {
      const g = new THREE.Group();
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.2, 24), new THREE.MeshStandardMaterial({ color: 0x6ee07a, emissive: 0x2fa04a, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }));
      const parcel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xc98a3b }));
      parcel.position.y = 0.7;
      parcel.castShadow = true;
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.14, 1.08), new THREE.MeshStandardMaterial({ color: 0xe14b7a }));
      ribbon.position.y = 0.7;
      g.add(pad, parcel, ribbon);
      g.position.set(x, terrainHeight(x, z) + 0.1, z);
      scene.add(g);
      return g;
    }
    function buildAltar(x: number, z: number) {
      const g = new THREE.Group();
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 1.2, 10), new THREE.MeshStandardMaterial({ color: 0xbfb8a8, flatShading: true }));
      stone.position.y = 0.6;
      stone.castShadow = true;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.8), new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xffd447, emissiveIntensity: 1.1 }));
      shard.position.y = 2.2;
      g.userData.shard = shard;
      const glow = new THREE.PointLight(0xffd447, 5, 18);
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
        const seconds = 24 + total * 10;
        raceEndsAt = performance.now() + seconds * 1000;
        setRaceGates({ done: 0, total });
        setRaceTime(seconds);
        setQuestData({ num: questIdx, need: total, noun: "race" });
        setProgressText(`0 / ${total}`);
        return;
      }
      if (kind === "treasure" || kind === "delivery" || kind === "shard") {
        const s = kind === "treasure" ? spotNear(35, 70) : kind === "delivery" ? spotNear(30, 60) : spotNear(28, 55);
        target = kind === "treasure" ? buildChest(s.x, s.z) : kind === "delivery" ? buildDropoff(s.x, s.z) : buildAltar(s.x, s.z);
        need = 1;
        setQuestData({ num: questIdx, need: 1, noun: kind });
        setProgressText("");
        return;
      }
      const [noun, color] = QUEST_NOUNS[questIdx % QUEST_NOUNS.length];
      need = 4 + Math.floor(rand() * 4);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.2 });
      for (let i = 0; i < need; i++) {
        const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), mat);
        const s = spotNear(14, 59);
        m.position.set(s.x, terrainHeight(s.x, s.z) + 1.4, s.z);
        m.castShadow = true;
        scene.add(m);
        items.push(m);
      }
      setQuestData({ num: questIdx, need, noun });
      setProgressText(`0 / ${need}`);
    }
    function completeQuest(bonusXp: number) {
      const p = progRef.current;
      p.missionsDone++;
      gainXp(bonusXp);
      addCoins(15 + Math.round(bonusXp / 4));
      award("quest-1");
      if (p.missionsDone >= 10) award("quest-10");
      if (p.missionsDone >= 50) award("quest-50");
      const earned = earnedDecors(p.missionsDone);
      const fresh = earned.filter((d) => !p.decors.includes(d));
      if (fresh.length) {
        p.decors = [...new Set([...p.decors, ...earned])];
        fresh.forEach((id) => pushToast(t(UI.newGear, nm(DECORS.find((d) => d.id === id)!))));
      }
      setProg({ ...p });
      save();
      newQuest();
    }
    newQuest();

    const onResize = () => {
      camera.aspect = mountEl.clientWidth / mountEl.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
      composer?.setPixelRatio(pixelRatio());
      composer?.setSize(mountEl.clientWidth, mountEl.clientHeight);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(mountEl);

    const saveTimer = setInterval(save, 15000);
    const onLeave = () => save();
    window.addEventListener("beforeunload", onLeave);

    // ---------- post-processing ----------
    let composer: EffectComposer | null = null;
    if (G.bloom) {
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(pixelRatio());
      composer.setSize(mountEl.clientWidth, mountEl.clientHeight);
      composerPass = new RenderPass(scene, camera);
      composer.addPass(composerPass);
      if (G.view >= 4) {
        // ground-truth ambient occlusion: contact shadows under trees, in
        // doorways, between rocks (Super High and above)
        aoPass = new GTAOPass(scene, camera, mountEl.clientWidth, mountEl.clientHeight);
        aoPass.blendIntensity = 0.85;
        composer.addPass(aoPass);
      }
      // The scattering sky is far brighter than any glowing object, so under
      // daylight bloom just veils the whole frame. Keep it for night and
      // interiors, where lanterns and crystals are the brightest things.
      bloomPass = new UnrealBloomPass(new THREE.Vector2(mountEl.clientWidth, mountEl.clientHeight), 0.42, 0.5, 0.82);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      if (G.aa) composer.addPass(new SMAAPass());
    }

    // ---------- sparkles + score pops ----------
    const sparkGeo = new THREE.OctahedronGeometry(0.16);
    const sparks: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
    function burst(x: number, y: number, z: number, color: number, count = LOW ? 6 : 12) {
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
        const mesh = new THREE.Mesh(sparkGeo, mat);
        mesh.position.set(x, y, z);
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 3;
        sparks.push({ mesh, vx: Math.cos(a) * sp, vy: 3 + Math.random() * 3, vz: Math.sin(a) * sp, life: 0.6 });
        activeScene.add(mesh);
      }
    }
    function updateSparks(dt: number) {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          s.mesh.parent?.remove(s.mesh);
          (s.mesh.material as THREE.Material).dispose();
          sparks.splice(i, 1);
          continue;
        }
        s.vy -= 9 * dt;
        s.mesh.position.x += s.vx * dt;
        s.mesh.position.y += s.vy * dt;
        s.mesh.position.z += s.vz * dt;
        s.mesh.rotation.x += dt * 6;
        s.mesh.rotation.y += dt * 6;
        const k = s.life / 0.6;
        s.mesh.scale.setScalar(0.4 + k * 0.8);
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = k;
      }
    }
    const projV = new THREE.Vector3();
    function popScore(x: number, y: number, z: number, text: string) {
      projV.set(x, y, z).project(camera);
      if (projV.z > 1) return;
      const sx = (projV.x * 0.5 + 0.5) * 100;
      const sy = (-projV.y * 0.5 + 0.5) * 100;
      const id = Date.now() + Math.random();
      setPops((ps) => [...ps.slice(-6), { id, x: sx, y: sy, text }]);
      setTimeout(() => setPops((ps) => ps.filter((p) => p.id !== id)), 850);
    }

    // ---------- zone switching ----------
    function enterInterior(id: InteriorId) {
      dismount();
      let it = interiors.get(id);
      if (!it) {
        it = buildInterior(id, langRef.current, LOW);
        interiors.set(id, it);
      }
      activeInterior = it;
      zone = id;
      activeScene = it.scene;
      phys = it.physics;
      moveActors(it.scene);
      player.position.copy(it.spawn);
      vy = 0;
      camYaw = it.spawnYaw;
      camPitch = 0.3;
      portalCooldown = 1.2;
      arenaPops = 0;
      it.pickups.forEach((pk) => {
        if (pk.kind === "chest") pk.taken = false;
      });
      setZoneName(id);
      // an arena should never open empty: three slimes are waiting at the edge
      const area = it.slimeArea;
      if (area) {
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2 + 0.5;
          critters.spawn(area.x + Math.cos(a) * area.r * 0.7, 0, area.z + Math.sin(a) * area.r * 0.7);
        }
      }
      if (id === "cave") award("cave-1");
      chime(520, "triangle", 0.8, 0.12);
      chime(780, "triangle", 0.9, 0.08);
    }
    function exitInterior() {
      const site = enteredSite ?? sites.find((s) => s.kind === zone);
      enteredSite = null;
      zone = "world";
      activeInterior = null;
      activeScene = scene;
      phys = worldPhysics;
      moveActors(scene);
      const tx = site ? site.trigger.x : HOME.x;
      const tz = site ? site.trigger.z + 3.2 : HOME.z + 8;
      player.position.set(tx, terrainHeight(tx, tz), tz);
      vy = 0;
      camYaw = Math.PI;
      portalCooldown = 1.8;
      setZoneName("world");
      chime(440, "triangle", 0.6, 0.1);
    }
    function mountUp(a: Animal) {
      mount = a;
      a.ridden = true;
      player.position.x = a.group.position.x;
      player.position.z = a.group.position.z;
      heading = a.group.rotation.y;
      player.rotation.y = heading;
      ridden.add(a.species);
      award("ride-1");
      if (ridden.size >= 5) award("ride-5");
      setRiding(a.species);
      chime(520, "triangle", 0.4, 0.1);
      chime(660, "triangle", 0.5, 0.08);
    }
    function dismount() {
      const a = mount;
      if (!a) return;
      mount = null;
      a.ridden = false;
      a.speed = 0;
      a.heading = a.group.rotation.y;
      player.position.x += Math.cos(player.rotation.y) * 1.6;
      player.position.z -= Math.sin(player.rotation.y) * 1.6;
      phys.collide(player.position, PLAYER_R, PLAYER_H);
      av.body.position.y = 0;
      av.legL.rotation.set(0, 0, 0);
      av.legR.rotation.set(0, 0, 0);
      setRiding(null);
      chime(440, "triangle", 0.3, 0.08);
    }

    goHomeRef.current = () => {
      dismount();
      if (zone !== "world") exitInterior();
      player.position.set(HOME.x + 6, terrainHeight(HOME.x + 6, HOME.z + 9), HOME.z + 9);
      vy = 0;
    };

    // ---------- main loop state ----------
    let camYaw = 0;
    let camPitch = 0.32;
    let menuFrame = 0;
    let view: "tpp" | "fpp" = controlsRef.current?.view ?? "tpp";
    let walk = 0;
    let vy = 0;
    let grounded = true;
    let usedDouble = false;
    let jumpHeld = false;
    let nearElder: THREE.Group | null = null;
    let lastBiome: Biome = "grass";
    let last = performance.now();
    let lastRender = 0;
    let raf = 0;
    let localScore = 0;
    let lean = 0;
    let landT = 0;
    let camDip = 0;
    let invT = 0;
    let knockX = 0, knockZ = 0;
    let faintT = 0;
    let slimeTimer = 3;
    let netTimer = 0;
    let fpsFrames = 0, fpsTime = 0;
    let lastNpc = false;
    let lastInside = false;
    let lastRace = -1;
    let heading = 0;
    let lastRideHint: string | null = null;
    let foraged = 0;
    let mapTimer = 0;
    let mapGuide: { x: number; z: number } | null = null;
    const LAND = 0.16;
    const dayStart = performance.now() - DAY_SECONDS * 250;
    const camTarget = new THREE.Vector3().copy(player.position);
    const boomWant = new THREE.Vector3();
    const boomOut = new THREE.Vector3();
    const headPos = new THREE.Vector3();
    const houseLight = new THREE.PointLight(0xffd9a0, 0, 12, 1.5);
    scene.add(houseLight);
    const cDay = new THREE.Color(0x3f8fe0), cNight = new THREE.Color(0x0b1230);
    const hDay = new THREE.Color(0xbfe6f5), hNight = new THREE.Color(0x2a3a60), hDusk = new THREE.Color(0xffa36b);
    let lastVillageCheck = -1;

    const groundAt = (x: number, z: number, feet: number) => {
      const solid = phys.groundAt(x, z, feet, PLAYER_R);
      if (zone !== "world") return Math.max(solid, 0);
      return Math.max(solid, terrainHeight(x, z), WATER_Y);
    };
    function faint() {
      faintT = 2.2;
      setFainted(true);
      critters.clear();
      chime(330, "sine", 1.2, 0.12);
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const cap = gfxRef.current?.maxFps ?? 0;
      if (cap && now - lastRender < 1000 / cap - 2) return;
      lastRender = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      uTime.value = now / 1000;
      const p = progRef.current;
      const adventure = p.mode === "adventure";
      const Gl = gfxRef.current!;

      // ---------- input (camera-relative, never inverted) ----------
      const inp = input.read(dt);
      const blocked = menuOpenRef.current || faintT > 0;
      if (blocked) {
        inp.moveX = inp.moveY = inp.lookX = inp.lookY = 0;
        inp.jump = inp.sprint = inp.interact = inp.attack = inp.toggleView = inp.useItem = false;
      }
      if (inp.menu && !menuOpenRef.current) {
        menuOpenRef.current = true;
        setMenuOpen(true);
      }
      const want = controlsRef.current?.view ?? "tpp";
      if (inp.toggleView) {
        view = view === "tpp" ? "fpp" : "tpp";
        if (controlsRef.current) {
          const c = { ...controlsRef.current, view };
          controlsRef.current = c;
          saveControls(c);
          setControlsState(c);
        }
      } else if (want !== view) view = want;
      camYaw -= inp.lookX;
      camPitch = Math.max(view === "fpp" ? -1.25 : -0.3, Math.min(view === "fpp" ? 1.25 : 1.2, camPitch - inp.lookY));

      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
      const mx = fx * inp.moveY + rx * inp.moveX;
      const mz = fz * inp.moveY + rz * inp.moveX;
      const len = Math.min(1, Math.hypot(inp.moveX, inp.moveY));
      const moving = len > 0.12;
      let sprintNow = false;
      let speedNow = 0;
      if (moving) {
        const sprinting = has("sprint") && (inp.sprint || (inp.device === "touch" && len > 0.97));
        sprintNow = sprinting;
        const boost = (now < boostUntilRef.current ? 1.35 : 1) * (mount ? mount.def.speed * 0.75 : 1);
        const speed = (sprinting ? 14 : 8.5) * boost * Math.max(0.35, len);
        speedNow = speed / 14;
        const l = Math.hypot(mx, mz) || 1;
        const dx = (mx / l) * speed * dt;
        const dz = (mz / l) * speed * dt;
        player.position.x += dx;
        player.position.z += dz;
        p.distance += Math.hypot(dx, dz);
        if (p.distance >= 1000) award("walk-1000");
        if (p.distance >= 10000) award("walk-10000");
        walk += dt * (sprinting ? 15 : 10) * Math.max(0.5, len);
        if (view === "tpp") heading = Math.atan2(dx, dz);
        const swing = sprinting ? 1.1 : 0.75;
        av.armL.rotation.x = Math.sin(walk) * swing;
        av.armR.rotation.x = -Math.sin(walk) * swing;
        av.legL.rotation.x = -Math.sin(walk) * swing;
        av.legR.rotation.x = Math.sin(walk) * swing;
        lean += ((sprinting ? 0.16 : 0.07) - lean) * 0.15;
      } else {
        av.armL.rotation.x *= 0.85;
        av.armR.rotation.x *= 0.85;
        av.legL.rotation.x *= 0.85;
        av.legR.rotation.x *= 0.85;
        lean += (0 - lean) * 0.12;
      }
      if (view === "fpp") heading = camYaw + Math.PI;
      // knockback from a slime bump
      if (knockX || knockZ) {
        player.position.x += knockX * dt;
        player.position.z += knockZ * dt;
        knockX *= Math.pow(0.02, dt);
        knockZ *= Math.pow(0.02, dt);
        if (Math.abs(knockX) + Math.abs(knockZ) < 0.1) knockX = knockZ = 0;
      }
      // walls, trunks, rocks, furniture push back
      phys.collide(player.position, PLAYER_R, PLAYER_H);
      player.rotation.y += wrapAngle(heading - player.rotation.y) * Math.min(1, dt * 12);
      av.body.rotation.x = lean;

      // ---------- vertical: floors, steps, ceilings ----------
      const jumpPressed = inp.jump;
      const jumpPower = has("rocket") ? 12 : 9;
      if (jumpPressed && !jumpHeld) {
        if (grounded) {
          vy = jumpPower;
          grounded = false;
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
      const floor = groundAt(player.position.x, player.position.z, player.position.y);
      const wasGrounded = grounded;
      if (grounded && vy <= 0) {
        if (floor >= player.position.y - STEP) {
          player.position.y = floor; // follow slopes and stairs up and down
        } else {
          grounded = false; // walked off a ledge
        }
      }
      if (!grounded) {
        vy -= 25 * dt;
        if (has("glide") && jumpPressed && vy < -3) vy = -3;
        player.position.y += vy * dt;
        const ceil = phys.ceilingAt(player.position.x, player.position.z, player.position.y + PLAYER_H, PLAYER_R);
        if (vy > 0 && player.position.y + PLAYER_H > ceil) {
          player.position.y = ceil - PLAYER_H;
          vy = 0;
        }
        const f2 = groundAt(player.position.x, player.position.z, player.position.y + 0.05);
        if (player.position.y <= f2 && vy <= 0) {
          player.position.y = f2;
          vy = 0;
          grounded = true;
        }
      }
      if (!wasGrounded && grounded) {
        landT = LAND;
        camDip = 0.3;
      }
      if (player.position.y < -80) goHomeRef.current?.();

      // squash & stretch + walk bounce (visual only, physics stays exact)
      if (landT > 0) landT = Math.max(0, landT - dt);
      let sx = 1, sy = 1;
      if (!grounded) {
        sy = 1.1;
        sx = 0.95;
      } else if (landT > 0) {
        const k = landT / LAND;
        sy = 1 - 0.16 * k;
        sx = 1 + 0.12 * k;
      } else if (!moving) {
        sy = 1 + Math.sin(now / 700) * 0.02;
        sx = 1 - Math.sin(now / 700) * 0.01;
      }
      av.body.scale.set(sx, sy, sx);
      av.body.position.y = moving && grounded ? Math.abs(Math.sin(walk)) * 0.08 : 0;

      const swimming =
        zone === "world" && terrainHeight(player.position.x, player.position.z) < WATER_Y - 0.05 && grounded &&
        player.position.y <= WATER_Y + 0.01;
      if (swimming) {
        const tt = now / 220;
        av.body.rotation.x = 0.95;
        av.armL.rotation.x = -0.7 + Math.sin(tt) * 1.0;
        av.armR.rotation.x = -0.7 + Math.sin(tt + Math.PI) * 1.0;
        av.legL.rotation.x = Math.sin(tt * 1.3) * 0.35;
        av.legR.rotation.x = Math.sin(tt * 1.3 + Math.PI) * 0.35;
        av.body.scale.set(1, 1, 1);
        av.body.position.y = -0.35 + Math.sin(now / 500) * 0.12;
      }
      // riding: the animal walks where the player goes; the rider sits on it
      if (mount) {
        mount.group.position.copy(player.position);
        mount.group.rotation.y = player.rotation.y;
        animateAnimal(mount, dt, now, moving ? Math.min(1.6, speedNow * 1.6) : 0);
        const seat = mount.def.saddle * mount.group.scale.y;
        av.body.position.y = seat - 1.0 + (moving ? Math.abs(Math.sin(mount.walk)) * 0.06 : 0);
        av.body.rotation.x = 0.08;
        av.legL.rotation.set(-1.25, 0, -0.55);
        av.legR.rotation.set(-1.25, 0, 0.55);
        av.armL.rotation.x = -0.75;
        av.armR.rotation.x = -0.75;
      } else {
        av.legL.rotation.z = 0;
        av.legR.rotation.z = 0;
      }
      av.tick(now, sprintNow ? 1 : moving ? 0.45 : 0);
      if (invT > 0) {
        invT -= dt;
        player.visible = view === "fpp" ? false : Math.floor(invT * 12) % 2 === 0;
      } else player.visible = view !== "fpp";

      // ---------- day-night (sky, sun, stars) ----------
      const dayT = (((now - dayStart) / 1000) % DAY_SECONDS) / DAY_SECONDS;
      const sunA = dayT * Math.PI * 2;
      const dl = Math.max(0, Math.sin(sunA));
      const dusk = Math.max(0, 1 - Math.abs(Math.sin(sunA)) * 3.2);
      if (zone === "world") {
        sun.position.set(player.position.x + Math.cos(sunA) * 80, Math.max(8, Math.sin(sunA) * 90), player.position.z + 25);
        sun.target.position.copy(player.position);
        sun.intensity = 0.12 + 2.5 * dl;
        sun.color.setHex(dusk > 0.3 ? 0xffc48a : 0xfff2d8);
        hemi.intensity = 0.28 + 0.85 * dl;
        skyU.top.value.copy(cNight).lerp(cDay, dl);
        skyU.horizon.value.copy(hNight).lerp(hDay, dl).lerp(hDusk, dusk * 0.7);
        skyColor.copy(skyU.horizon.value);
        // fog takes the horizon tint, a little deeper than the zenith colour
        (scene.fog as THREE.Fog).color.copy(skyColor).lerp(new THREE.Color(0x9fc4d8), 0.25);
        skyDome.position.copy(camera.position);
        if (sky) {
          sky.position.copy(camera.position);
          // Sky expects a world-space sun position (~450 km out), not a unit vector
          sky.material.uniforms.sunPosition.value.set(Math.cos(sunA), Math.sin(sunA), 0.28).normalize().multiplyScalar(450000);
          sunDisc.visible = false;
          // after sunset the scattering sky is pitch black; use the starry gradient
          const daySky = Math.sin(sunA) > -0.05;
          sky.visible = daySky;
          skyDome.visible = !daySky;
          if (bloomPass) bloomPass.enabled = !daySky;
          if (cloudLayer) {
            cloudLayer.position.set(camera.position.x, 300, camera.position.z);
            cloudUniforms.uTime.value = now / 1000;
            cloudUniforms.uSun.value = 0.35 + Math.max(0, Math.sin(sunA)) * 0.75;
            cloudLayer.visible = daySky;
          }
        }
        sunDisc.position.set(camera.position.x + Math.cos(sunA) * 700, camera.position.y + Math.sin(sunA) * 700, camera.position.z + 200);
        sunDisc.visible = Math.sin(sunA) > -0.08;
        moon.position.set(camera.position.x - Math.cos(sunA) * 700, camera.position.y - Math.sin(sunA) * 700, camera.position.z - 200);
        moon.visible = Math.sin(sunA) < 0.1;
        starMat.opacity = 1 - Math.min(1, dl * 1.6);
        stars.position.copy(camera.position);
        fireflyMat.opacity = 1 - Math.min(1, dl * 1.8);
        if (dl < 0.03) award("night-owl");
        if (DUST) {
          dust.position.set(player.position.x, 0, player.position.z);
          dust.rotation.y = now / 26000;
          dustMat.opacity = 0.5 * dl;
        }
        fireflies.forEach((f, i) => {
          f.position.x += Math.cos(now / 900 + i * 2.1) * dt * 2;
          f.position.z += Math.sin(now / 700 + i * 1.3) * dt * 2;
          f.position.y = terrainHeight(f.position.x, f.position.z) + 1.5 + Math.sin(now / 300 + i) * 0.6;
          if (f.position.distanceTo(player.position) > 60)
            f.position.set(player.position.x + (hash2(i, (now / 1000) | 0) - 0.5) * 40, 2, player.position.z + (hash2((now / 1000) | 0, i) - 0.5) * 40);
        });
        clouds.forEach((c, i) => {
          c.position.x += dt * (1.5 + (i % 3) * 0.5);
          if (c.position.x - player.position.x > 160) c.position.x -= 320;
          if (player.position.x - c.position.x > 160) c.position.x += 320;
          if (c.position.z - player.position.z > 160) c.position.z -= 320;
          if (player.position.z - c.position.z > 160) c.position.z += 320;
        });
        butterflies.forEach((bf, i) => {
          bf.a += dt * 0.6;
          bf.g.visible = dl > 0.15;
          bf.g.position.x += Math.cos(bf.a) * dt * 3;
          bf.g.position.z += Math.sin(bf.a) * dt * 3;
          bf.g.position.y = terrainHeight(bf.g.position.x, bf.g.position.z) + 2.5 + Math.sin(now / 250 + i) * 0.5;
          const flap = Math.sin(now / 60 + i) * 0.9;
          bf.w1.rotation.y = flap;
          bf.w2.rotation.y = -flap;
          if (bf.g.position.distanceTo(player.position) > 90)
            bf.g.position.set(player.position.x + (hash2(i, now | 0) - 0.5) * 50, 0, player.position.z + (hash2(now | 0, i) - 0.5) * 50);
        });
        const b = biomeAt(player.position.x, player.position.z);
        if (b !== lastBiome) {
          lastBiome = b;
          if (b === "desert") award("biome-desert");
          if (b === "snow") award("biome-snow");
        }
      }
      lantern.intensity = p.tools.includes("lantern") && (zone !== "world" || dl < 0.5) ? (zone === "world" ? (1 - dl) * 6 : 4) : 0;

      // ---------- inside a house? warm light + chip ----------
      let inside = false;
      if (zone === "world") {
        for (const r of allRooms) {
          if (
            player.position.x > r.minX && player.position.x < r.maxX &&
            player.position.z > r.minZ && player.position.z < r.maxZ &&
            player.position.y >= r.floorY - 0.3 && player.position.y < r.top
          ) {
            inside = true;
            houseLight.position.set((r.minX + r.maxX) / 2, r.top - 0.6, (r.minZ + r.maxZ) / 2);
            break;
          }
        }
      }
      houseLight.intensity += ((inside ? 9 : 0) - houseLight.intensity) * Math.min(1, dt * 6);
      if (inside !== lastInside) {
        lastInside = inside;
        setInsideHouse(inside);
        if (inside) award("inside-1");
      }

      // ---------- pet ----------
      const petId = activePetId();
      petMeshes.forEach((mesh, id) => (mesh.visible = id === petId));
      if (petId) {
        const mesh = petMeshes.get(petId)!;
        const bx = player.position.x - Math.sin(player.rotation.y) * 2.4;
        const bz = player.position.z - Math.cos(player.rotation.y) * 2.4;
        mesh.position.x += (bx - mesh.position.x) * Math.min(1, dt * 4);
        mesh.position.z += (bz - mesh.position.z) * Math.min(1, dt * 4);
        const gy = Math.max(groundAt(mesh.position.x, mesh.position.z, player.position.y + 0.5), zone === "world" ? WATER_Y : 0);
        if (petId === "bird") {
          mesh.position.y = gy + 2.2 + Math.sin(now / 260) * 0.4;
          const wings = mesh.userData.wings as THREE.Mesh[] | undefined;
          if (wings) {
            const flap = Math.sin(now / 80) * 0.7;
            wings[0].rotation.z = flap;
            wings[1].rotation.z = -flap;
          }
        } else mesh.position.y = gy + Math.abs(Math.sin(now / 200)) * 0.2;
        mesh.rotation.y = player.rotation.y;
      }

      // ---------- world streaming ----------
      if (zone === "world") {
        const prx = Math.floor(player.position.x / REGION);
        const prz = Math.floor(player.position.z / REGION);
        const vkey = prx * 10007 + prz;
        if (vkey !== lastVillageCheck) {
          lastVillageCheck = vkey;
          streamDungeons(prx, prz);
          for (let dx3 = -1; dx3 <= 1; dx3++)
            for (let dz3 = -1; dz3 <= 1; dz3++) {
              const key = `${prx + dx3},${prz + dz3}`;
              if (!villages.has(key)) {
                const spot = villagePos(prx + dx3, prz + dz3);
                villages.set(key, spot ? buildVillage(spot.x, spot.z, `v:${key}`) : { g: new THREE.Group(), elder: new THREE.Group(), rooms: [], lights: [] });
              }
            }
          villages.forEach((v, key) => {
            const [vx, vz] = key.split(",").map(Number);
            if (Math.abs(vx - prx) > 2 || Math.abs(vz - prz) > 2) {
              scene.remove(v.g);
              worldPhysics.removeOwner(`v:${key}`);
              v.rooms.forEach((r) => allRooms.delete(r));
              villages.delete(key);
            }
          });
        }
        // chunks: nearest first, a small budget per frame keeps it smooth
        const pcx = Math.round(player.position.x / CHUNK);
        const pcz = Math.round(player.position.z / CHUNK);
        let budget = chunks.size === 0 ? 99 : 2;
        for (let ring = 0; ring <= VIEW && budget > 0; ring++)
          for (let dx2 = -ring; dx2 <= ring && budget > 0; dx2++)
            for (let dz2 = -ring; dz2 <= ring && budget > 0; dz2++) {
              if (Math.max(Math.abs(dx2), Math.abs(dz2)) !== ring) continue;
              const key = `${pcx + dx2},${pcz + dz2}`;
              if (!chunks.has(key)) {
                const c = buildChunk(pcx + dx2, pcz + dz2, key);
                chunks.set(key, c);
                scene.add(c);
                budget--;
              }
            }
        chunks.forEach((c, key) => {
          const [cx, cz] = key.split(",").map(Number);
          if (Math.abs(cx - pcx) > VIEW + 1 || Math.abs(cz - pcz) > VIEW + 1) {
            scene.remove(c);
            c.traverse((o) => {
              if (o instanceof THREE.Mesh && o.geometry !== trunkGeo && o.geometry !== blobGeo && !coneGeos.includes(o.geometry as THREE.ConeGeometry) && o.geometry !== bladeGeo && o.geometry !== flowerGeo && o.geometry !== bushGeo && o.geometry !== berryGeo) o.geometry.dispose();
            });
            worldPhysics.removeOwner(`c:${key}`);
            animals.forEach((a) => {
              if (a.owner === `c:${key}` && a !== mount) {
                scene.remove(a.group);
                a.group.traverse((o) => o instanceof THREE.Mesh && !o.userData.shared && o.geometry.dispose());
                a.mixer?.stopAllAction();
                animals.delete(a);
              }
            });
            for (let i = forage.length - 1; i >= 0; i--) if (forage[i].chunk === `c:${key}`) forage.splice(i, 1);
            chunks.delete(key);
          }
        });
      }

      // ---------- elders ----------
      nearElder = null;
      if (zone === "world") {
        const eld = [startVillage, ...villages.values()];
        for (const v of eld) {
          if (!v.elder.parent) continue;
          v.elder.rotation.y = Math.atan2(player.position.x - v.elder.position.x, player.position.z - v.elder.position.z);
          v.elder.position.y = terrainHeight(v.elder.position.x, v.elder.position.z) + Math.sin(now / 500) * 0.05;
          if (v.elder.position.distanceTo(player.position) < 6) nearElder = v.elder;
        }
      }
      const npc = !!nearElder && p.storyChapter < STORY.length;
      if (npc !== lastNpc) {
        lastNpc = npc;
        setNpcNear(npc);
      }
      // nearest rideable animal
      let near: Animal | null = null;
      if (zone === "world" && !mount) {
        let nd = 3.4;
        animals.forEach((a) => {
          const d = Math.hypot(a.group.position.x - player.position.x, a.group.position.z - player.position.z);
          if (d < nd) {
            nd = d;
            near = a;
          }
        });
      }
      const hintNow = (near as Animal | null)?.species ?? null;
      if (hintNow !== lastRideHint) {
        lastRideHint = hintNow;
        setRideHint(hintNow);
      }
      if (inp.interact) {
        if (mount) dismount();
        else if (npc) setStoryOpen(p.storyChapter + 1);
        else if (near) mountUp(near);
      }

      // wildlife: animals near the player roam; far ones sleep
      if (zone === "world") {
        animals.forEach((a) => {
          if (a === mount) return;
          const d = Math.abs(a.group.position.x - player.position.x) + Math.abs(a.group.position.z - player.position.z);
          a.group.visible = d < CHUNK * (VIEW + 0.8) * 1.4;
          if (d < 110) wander(a, dt, now, player.position);
        });
        // gather ingredients by walking through them
        for (let i = forage.length - 1; i >= 0; i--) {
          const f = forage[i];
          const fp = f.mesh.position;
          if (Math.abs(fp.x - player.position.x) > 1.8 || Math.abs(fp.z - player.position.z) > 1.8) continue;
          if (Math.abs(fp.y - player.position.y) > 2.5) continue;
          f.mesh.parent?.remove(f.mesh);
          forage.splice(i, 1);
          picked.add(f.key);
          const n = f.item === "flower" ? 1 : 2;
          p.inventory = { ...p.inventory, [f.item]: Math.min(999, (p.inventory[f.item] ?? 0) + n) };
          foraged++;
          if (foraged >= 50) award("forage-50");
          burst(fp.x, fp.y + 0.7, fp.z, f.item === "berry" ? 0xc2304a : f.item === "mushroom" ? 0xc9543a : 0xf2a8c8, 8);
          const def = ITEMS.find((x) => x.id === f.item);
          popScore(fp.x, fp.y + 1.2, fp.z, `+${n} ${def ? (langRef.current === "id" ? def.nama : def.namaEn) : ""}`);
          chime(760, "triangle", 0.3, 0.08);
          setProg({ ...p });
        }
      }

      // map data for the minimap (refreshed a few times a second)
      mapTimer -= dt;
      if (mapTimer <= 0) {
        mapTimer = 0.2;
        const nearAnimals: { x: number; z: number }[] = [];
        animals.forEach((a) => {
          if (nearAnimals.length < 60 && Math.abs(a.group.position.x - player.position.x) < 260 && Math.abs(a.group.position.z - player.position.z) < 260)
            nearAnimals.push({ x: a.group.position.x, z: a.group.position.z });
        });
        const friends: MapState["friends"] = [];
        const rm = roomRef.current;
        if (rm && rm.status === "open") rm.players.forEach((np) => np.zone === "world" && friends.push({ x: np.x, z: np.z, name: np.name }));
        mapRef.current = {
          x: player.position.x,
          z: player.position.z,
          camYaw,
          zone,
          guide: mapGuide,
          friends,
          animals: nearAnimals,
          mounted: !!mount,
        };
      }

      // ---------- doorways ----------
      if (portalCooldown > 0) portalCooldown -= dt;
      else if (zone === "world") {
        for (const s of sites) {
          if (Math.hypot(s.trigger.x - player.position.x, s.trigger.z - player.position.z) < 1.7) {
            enterInterior(s.kind);
            enteredSite = s;
            break;
          }
        }
      } else if (activeInterior && player.position.distanceTo(activeInterior.exit) < 1.9) {
        exitInterior();
      }

      // ---------- interior life ----------
      if (activeInterior) {
        activeInterior.update(dt, now);
        for (const pk of activeInterior.pickups) {
          if (pk.taken) continue;
          const d = pk.mesh.position.distanceTo(player.position.clone().setY(pk.mesh.position.y));
          if (pk.kind === "gem" && d < 1.6 && Math.abs(pk.mesh.position.y - player.position.y - 1) < 1.6) {
            pk.taken = true;
            pk.mesh.visible = false;
            burst(pk.mesh.position.x, pk.mesh.position.y, pk.mesh.position.z, 0x7fe7ff);
            addCoins(5);
            p.inventory.gem = (p.inventory.gem ?? 0) + 1;
            p.gemsFound++;
            popScore(pk.mesh.position.x, pk.mesh.position.y + 1, pk.mesh.position.z, "+5");
            chime(1040, "sine", 0.6, 0.15);
            setProg({ ...p });
          } else if (pk.kind === "chest" && d < 2.2 && Math.abs(pk.mesh.position.y - player.position.y) < 1.2) {
            pk.taken = true;
            const lid = pk.mesh.children[1];
            if (lid) lid.rotation.x = -1.1;
            addCoins(40);
            burst(pk.mesh.position.x, pk.mesh.position.y + 1.2, pk.mesh.position.z, 0xffd447, 20);
            popScore(pk.mesh.position.x, pk.mesh.position.y + 2, pk.mesh.position.z, "+40");
            pushToast(pick(langRef.current, "Peti aula terbuka! +40 koin", "Hall chest opened! +40 coins"));
            chime(880);
            chime(1320, "triangle", 0.8);
            save();
          }
        }
        if (zone === "hall" && player.position.y > 3.9) award("hall-1");
      }

      // ---------- slimes + bubble wand ----------
      const arena = activeInterior?.slimeArea;
      if (inp.attack) {
        const dir = view === "fpp" ? { x: fx, z: fz } : { x: Math.sin(player.rotation.y), z: Math.cos(player.rotation.y) };
        critters.shoot(player.position.x + dir.x * 0.8, player.position.y + 1.5, player.position.z + dir.z * 0.8, dir.x, dir.z);
        chime(900, "sine", 0.25, 0.08);
        av.armR.rotation.x = -1.6;
      }
      slimeTimer -= dt;
      if (slimeTimer <= 0 && faintT <= 0) {
        slimeTimer = arena ? 2.2 : 5;
        if (arena && critters.count() < 6) {
          const a = Math.random() * Math.PI * 2;
          const r = arena.r * (0.45 + Math.random() * 0.5);
          critters.spawn(arena.x + Math.cos(a) * r, 0, arena.z + Math.sin(a) * r);
        } else if (adventure && zone === "world" && critters.count() < 4) {
          const a = Math.random() * Math.PI * 2;
          const sx2 = player.position.x + Math.cos(a) * 22;
          const sz2 = player.position.z + Math.sin(a) * 22;
          if (terrainHeight(sx2, sz2) > WATER_Y + 0.5 && !nearLandmark(sx2, sz2, 8)) critters.spawn(sx2, terrainHeight(sx2, sz2), sz2);
        }
      }
      if (!adventure && !arena && critters.count()) critters.clear();
      critters.update(
        dt,
        now,
        player.position,
        (x, z) => (zone === "world" ? Math.max(terrainHeight(x, z), WATER_Y) : 0),
        (dx, dz) => {
          if (invT > 0 || faintT > 0) return;
          knockX = dx * 14;
          knockZ = dz * 14;
          vy = 5;
          grounded = false;
          invT = 1.3;
          chime(220, "square", 0.25, 0.06);
          if (adventure && shieldRef.current) {
            shieldRef.current = false;
            burst(player.position.x, player.position.y + 1.4, player.position.z, 0x9fe8ff, 18);
            pushToast(pick(langRef.current, "Jimat kristal menahan senggolan!", "Your crystal charm blocked the bump!"));
          } else if (adventure) {
            heartsRef.current = Math.max(0, heartsRef.current - 1);
            setHearts(heartsRef.current);
            if (heartsRef.current === 0) faint();
          }
        },
        (pos, color) => {
          burst(pos.x, pos.y, pos.z, color, 16);
          addCoins(3);
          p.slimesPopped++;
          popScore(pos.x, pos.y + 1, pos.z, "+3");
          chime(1200, "triangle", 0.3, 0.1);
          if (arena) {
            arenaPops++;
            if (arenaPops >= 10) award("arena-1");
          }
        },
        adventure || !!arena
      );
      if (zone === "world") critters.cull(player.position, 60);
      if (faintT > 0) {
        faintT -= dt;
        av.body.rotation.z = Math.min(1.4, av.body.rotation.z + dt * 3);
        if (faintT <= 0) {
          av.body.rotation.z = 0;
          heartsRef.current = MAX_HEARTS;
          setHearts(MAX_HEARTS);
          setFainted(false);
          goHomeRef.current?.();
          pushToast(pick(langRef.current, "Kamu bangun segar di rumah pohon. Semua barangmu aman.", "You wake up rested at the tree house. Everything you found is safe."));
        }
      }
      if (inp.useItem) useItemRef.current?.(null);

      // ---------- quests (open world only) ----------
      if (zone === "world") {
        for (let i = items.length - 1; i >= 0; i--) {
          const m = items[i];
          m.rotation.y += dt * 2;
          const dist = m.position.distanceTo(player.position);
          if (has("magnet") && dist < 9 && dist > 2) {
            m.position.lerp(new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z), dt * 3);
          } else {
            m.position.y = Math.max(terrainHeight(m.position.x, m.position.z), WATER_Y) + 1.4 + Math.sin(now / 300 + i) * 0.25;
          }
          if (m.position.distanceTo(player.position.clone().setY(player.position.y + 1.2)) < 2.2) {
            const itemColor = (m.material as THREE.MeshStandardMaterial).color.getHex();
            burst(m.position.x, m.position.y, m.position.z, itemColor);
            const gain = 10 + toolBonus();
            popScore(m.position.x, m.position.y + 1.4, m.position.z, `+${gain}`);
            scene.remove(m);
            items.splice(i, 1);
            got++;
            localScore += gain;
            p.itemsCollected++;
            addCoins(2);
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
        if (kind === "race" && raceEndsAt) {
          const leftMs = raceEndsAt - now;
          const secs = Math.max(0, Math.ceil(leftMs / 1000));
          if (secs !== lastRace) {
            lastRace = secs;
            setRaceTime(secs);
          }
          gates.forEach((g, i) => {
            const passed = i < gateIdx;
            g.rotation.y += dt * (passed ? 0.4 : 1.6);
            const m = (g.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
            m.color.setHex(passed ? 0x6f8fa0 : i === gateIdx ? 0xffd447 : 0x59d0ff);
            m.emissive.setHex(i === gateIdx ? 0xffb300 : 0x2f9fd0);
            m.emissiveIntensity = i === gateIdx ? 1.4 : 0.4;
          });
          const nextGate = gates[gateIdx];
          if (nextGate && Math.hypot(nextGate.position.x - player.position.x, nextGate.position.z - player.position.z) < 3.2) {
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
          if (raceEndsAt && leftMs <= 0) {
            pushToast(t(UI.raceLost));
            newQuest();
          }
        }
        if (target && (kind === "treasure" || kind === "delivery" || kind === "shard")) {
          const d = Math.hypot(target.position.x - player.position.x, target.position.z - player.position.z);
          if (kind === "shard") {
            const shard = target.userData.shard as THREE.Mesh | undefined;
            if (shard) {
              shard.rotation.y += dt * 1.5;
              shard.position.y = 2.2 + Math.sin(now / 400) * 0.25;
            }
          } else target.rotation.y += dt * 0.6;
          if (d < 3.4) {
            if (kind === "treasure") {
              p.treasuresFound++;
              award("treasure-1");
              localScore += 60 + toolBonus() * 3;
              setScore(localScore);
              if (localScore > p.bestScore) p.bestScore = localScore;
              addCoins(25);
              burst(target.position.x, target.position.y + 1.5, target.position.z, 0xffd447, 24);
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
        // compass: nearest collectible, the next gate or the quest target
        let guide: THREE.Vector3 | null = null;
        if (kind === "race") guide = gates[gateIdx]?.position ?? null;
        else if (target) guide = target.position;
        else if (items.length) {
          let nd = Infinity;
          for (const m of items) {
            const d = m.position.distanceTo(player.position);
            if (d < nd) {
              nd = d;
              guide = m.position;
            }
          }
        }
        mapGuide = guide ? { x: guide.x, z: guide.z } : null;
        if (arrowRef.current) {
          if (guide) {
            // relative to where the camera looks, so "up" on the arrow = straight ahead
            const ang = Math.atan2(guide.x - player.position.x, guide.z - player.position.z);
            const rel = wrapAngle(ang - (camYaw + Math.PI));
            arrowRef.current.style.transform = `translateX(-50%) rotate(${-rel}rad)`;
            arrowRef.current.style.opacity = "1";
          } else arrowRef.current.style.opacity = "0";
        }
      } else if (arrowRef.current) arrowRef.current.style.opacity = "0";

      // ---------- friends in the room ----------
      const room = roomRef.current;
      if (room && room.status === "open") {
        netTimer -= dt;
        if (netTimer <= 0) {
          netTimer = 1 / 15;
          const em = emoteRef.current;
          room.sendState({
            name: myName(),
            hero: heroId,
            equip: p.equip,
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
            ry: player.rotation.y,
            speed: moving ? speedNow : 0,
            zone,
            emote: em?.e ?? null,
            emoteAt: em?.at ?? 0,
          });
          if (room.size() >= 2) award("together-1");
        }
        const seen = new Set<string>();
        room.players.forEach((np: NetPlayer, id) => {
          seen.add(id);
          let r = remotes.get(id);
          const hd = HEROES.find((h) => h.id === np.hero) ?? HEROES[0];
          const eqKey = `${np.hero}|${JSON.stringify(np.equip)}`;
          if (!r || r.eqKey.split("|")[0] !== np.hero) {
            if (r) {
              r.av.root.parent?.remove(r.av.root);
              r.av.dispose();
            }
            const rav = buildAvatar(hd, np.equip);
            const tag = label(np.name, { scale: 0.7, bg: "rgba(20,90,70,0.8)" });
            tag.position.y = 3.6;
            rav.root.add(tag);
            rav.root.position.set(np.x, np.y, np.z);
            activeScene.add(rav.root);
            r = { av: rav, tag, emote: null, emoteUntil: 0, lastEmoteAt: np.emoteAt, eqKey, walk: 0, zone: np.zone };
            remotes.set(id, r);
          } else if (r.eqKey !== eqKey) {
            r.av.setEquip(np.equip);
            r.eqKey = eqKey;
          }
          const k = 1 - Math.exp(-dt * 12);
          r.av.root.position.x += (np.x - r.av.root.position.x) * k;
          r.av.root.position.y += (np.y - r.av.root.position.y) * k;
          r.av.root.position.z += (np.z - r.av.root.position.z) * k;
          r.av.root.rotation.y += wrapAngle(np.ry - r.av.root.rotation.y) * k;
          r.av.root.visible = np.zone === zone;
          r.walk += dt * 10 * np.speed * 1.4;
          const sw = Math.min(1, np.speed * 1.4) * 0.8;
          r.av.armL.rotation.x = Math.sin(r.walk) * sw;
          r.av.armR.rotation.x = -Math.sin(r.walk) * sw;
          r.av.legL.rotation.x = -Math.sin(r.walk) * sw;
          r.av.legR.rotation.x = Math.sin(r.walk) * sw;
          r.av.tick(now, np.speed);
          if (np.emote && np.emoteAt !== r.lastEmoteAt) {
            r.lastEmoteAt = np.emoteAt;
            if (r.emote) r.av.root.remove(r.emote);
            const tx = EMOTE_TEXT[np.emote];
            r.emote = label(pick(langRef.current, tx.id, tx.en), { scale: 0.8, bg: "rgba(60,110,220,0.9)" });
            r.emote.position.y = 4.4;
            r.av.root.add(r.emote);
            r.emoteUntil = now + 3000;
            chime(990, "triangle", 0.3, 0.06);
          }
          if (r.emote && now > r.emoteUntil) {
            r.av.root.remove(r.emote);
            r.emote = null;
          }
        });
        remotes.forEach((r, id) => {
          if (!seen.has(id)) {
            r.av.root.parent?.remove(r.av.root);
            r.av.dispose();
            remotes.delete(id);
          }
        });
      } else if (remotes.size) {
        remotes.forEach((r) => {
          r.av.root.parent?.remove(r.av.root);
          r.av.dispose();
        });
        remotes.clear();
      }
      // my own emote bubble
      const em = emoteRef.current;
      if (em && em.at !== emoteSelf.at) {
        emoteSelf.at = em.at;
        if (emoteSelf.sprite) player.remove(emoteSelf.sprite);
        const tx = EMOTE_TEXT[em.e];
        emoteSelf.sprite = label(pick(langRef.current, tx.id, tx.en), { scale: 0.8, bg: "rgba(60,110,220,0.9)" });
        emoteSelf.sprite.position.y = 4.2;
        player.add(emoteSelf.sprite);
        emoteSelf.until = now + 3000;
      }
      if (emoteSelf.sprite && now > emoteSelf.until) {
        player.remove(emoteSelf.sprite);
        emoteSelf.sprite = null;
      }

      // ---------- camera: third person orbit or first person ----------
      if (camDip > 0) camDip = Math.max(0, camDip - dt * 2.4);
      const fovWant = Gl.fov + (sprintNow ? 7 : 0);
      camera.fov += (fovWant - camera.fov) * Math.min(1, dt * 5);
      camera.updateProjectionMatrix();
      camTarget.x = player.position.x;
      camTarget.z = player.position.z;
      camTarget.y += (player.position.y - camTarget.y) * Math.min(1, dt * 14);
      const seatLift = mount ? mount.def.saddle * mount.group.scale.y - 1.0 : 0;
      if (view === "fpp") {
        headPos.set(player.position.x + Math.sin(heading) * 0.15, camTarget.y + 2.35 + seatLift - camDip * 0.3, player.position.z + Math.cos(heading) * 0.15);
        camera.position.copy(headPos);
        camera.lookAt(
          headPos.x + fx * Math.cos(camPitch),
          headPos.y - Math.sin(camPitch),
          headPos.z + fz * Math.cos(camPitch)
        );
      } else {
        const indoor = zone !== "world" || inside;
        const dist = (indoor ? 6 : 8.5) + (sprintNow ? 0.8 : 0) + (mount ? 2.5 : 0);
        headPos.set(camTarget.x, camTarget.y + 1.9 + seatLift - camDip, camTarget.z);
        boomWant.set(
          headPos.x + Math.sin(camYaw) * Math.cos(camPitch) * dist,
          headPos.y + Math.sin(camPitch) * dist,
          headPos.z + Math.cos(camYaw) * Math.cos(camPitch) * dist
        );
        phys.clampBoom(headPos, boomWant, boomOut);
        if (zone === "world") boomOut.y = Math.max(boomOut.y, terrainHeight(boomOut.x, boomOut.z) + 0.5);
        camera.position.copy(boomOut);
        camera.lookAt(headPos);
      }

      updateSparks(dt);
      // Behind an open menu the world is only a backdrop: redraw it about
      // twice a second so weak GPUs can spend their time on the wardrobe preview.
      menuFrame = menuOpenRef.current && !captureRef.current ? (menuFrame + 1) % 30 : 0;
      if (menuFrame <= 1) {
        if (composer) composer.render();
        else renderer.render(activeScene, camera);
      }

      if (captureRef.current) {
        captureRef.current = false;
        try {
          onCaptureRef.current?.(renderer.domElement.toDataURL("image/png"));
        } catch {}
      }
      fpsFrames++;
      fpsTime += dt;
      if (fpsTime >= 0.5) {
        if (Gl.showFps) setFps(Math.round(fpsFrames / fpsTime));
        fpsFrames = 0;
        fpsTime = 0;
      }
    }
    raf = requestAnimationFrame(frame);
    // test hook for automated QA (read-only snapshot)
    (window as unknown as { __meadowfar?: () => unknown }).__meadowfar = () => ({
      animals: animals.size,
      forage: forage.length,
      mounted: mount?.species ?? null,
      rideNearest: () => {
        let best: Animal | null = null;
        let bd = Infinity;
        animals.forEach((a) => {
          const d = Math.hypot(a.group.position.x - player.position.x, a.group.position.z - player.position.z);
          if (d < bd) {
            bd = d;
            best = a;
          }
        });
        const b = best as Animal | null;
        if (!b) return null;
        mountUp(b);
        return b.species;
      },
      dismount: () => dismount(),
      zone,
      view,
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
      camYaw,
      heading: player.rotation.y,
      grounded,
      inside: lastInside,
      chunks: chunks.size,
      solids: phys.solids.length,
      remotes: remotes.size,
      // position of the first remote player, so tests can prove that
      // another player's movement really arrives over the network
      remotePos: (() => {
        const first = remotes.values().next().value;
        return first ? { x: first.av.root.position.x, y: first.av.root.position.y, z: first.av.root.position.z } : null;
      })(),
      hearts: heartsRef.current,
      slimes: critters.count(),
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      teleport: (x: number, z: number, y?: number) => {
        player.position.set(x, y ?? groundAt(x, z, 999), z);
        vy = 0;
      },
      setYaw: (yv: number) => {
        camYaw = yv;
      },
      // lets automated checks look at the sky without a mouse
      setPitch: (pv: number) => {
        camPitch = pv;
      },
      enter: (id: InteriorId) => enterInterior(id),
      exit: () => exitInterior(),
    });

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(saveTimer);
      clearInterval(musicTimer);
      window.removeEventListener("beforeunload", onLeave);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("pointerdown", wakeAudio);
      window.removeEventListener("keydown", wakeAudio);
      renderer.domElement.removeEventListener("click", onCanvasClick);
      ro.disconnect();
      input.detach();
      save();
      try {
        audioCtx?.close();
      } catch {}
      interiors.forEach((it) => it.dispose());
      remotes.forEach((r) => r.av.dispose());
      av.dispose();
      composer?.dispose();
      renderer.dispose();
      mountEl.removeChild(renderer.domElement);
      applyEquipRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero, eKey]);

  // ---------- menu actions ----------
  const useItemRef = useRef<((id: string | null) => void) | null>(null);
  useItemRef.current = (id: string | null) => {
    const p = progRef.current;
    const L = langRef.current;
    let pickId = id;
    if (!pickId) {
      const hurt = heartsRef.current < MAX_HEARTS;
      const heal = ["apple", "tea", "pie", "soup"].find((k) => (p.inventory[k] ?? 0) > 0) ?? null;
      pickId = (hurt && heal) || ((p.inventory.candy ?? 0) > 0 ? "candy" : null);
      if (!pickId) {
        pushToast(pick(L, "Tasmu belum punya item yang bisa dipakai.", "Nothing useful in your bag yet."));
        return;
      }
    }
    const def = ITEMS.find((i) => i.id === pickId);
    if (!def || !(p.inventory[pickId] > 0) || def.use === "none") return;
    if ((def.use === "heal1" || def.use === "heal2" || def.use === "healAll") && heartsRef.current >= MAX_HEARTS) {
      pushToast(pick(L, "Hatimu sudah penuh.", "Your hearts are already full."));
      return;
    }
    if (def.use === "shield" && shieldRef.current) {
      pushToast(pick(L, "Jimat kristal sudah aktif.", "A crystal charm is already active."));
      return;
    }
    p.inventory = { ...p.inventory, [pickId]: p.inventory[pickId] - 1 };
    if (def.use === "heal1") heartsRef.current = Math.min(MAX_HEARTS, heartsRef.current + 1);
    if (def.use === "heal2") heartsRef.current = Math.min(MAX_HEARTS, heartsRef.current + 2);
    if (def.use === "shield") shieldRef.current = true;
    if (def.use === "healAll") heartsRef.current = MAX_HEARTS;
    if (def.use === "speed") boostUntilRef.current = performance.now() + 20000;
    setHearts(heartsRef.current);
    pushToast(pick(L, `Memakai ${def.nama}`, `Used ${def.namaEn}`));
    setProg({ ...p });
    save();
  };

  function craft(recipeId: string) {
    const p = progRef.current;
    const r = RECIPES.find((x) => x.id === recipeId);
    if (!r || !canCraft(r, p.inventory)) return;
    const inv = { ...p.inventory };
    for (const [k, n] of Object.entries(r.needs)) inv[k] = (inv[k] ?? 0) - n;
    inv[r.out] = Math.min(999, (inv[r.out] ?? 0) + r.qty);
    p.inventory = inv;
    const def = ITEMS.find((i) => i.id === r.out)!;
    grant("craft-1");
    pushToast(pick(lang, `Berhasil meracik ${def.nama}!`, `Crafted ${def.namaEn}!`));
    setProg({ ...p });
    save();
  }

  function buyCosmetic(id: string) {
    const p = progRef.current;
    const def = COSMETICS.find((c) => c.id === id);
    if (!def || def.devnetLamports || p.owned.includes(id)) return;
    if (p.coins < def.price) {
      pushToast(pick(lang, `Koin kurang. Butuh ${def.price - p.coins} lagi.`, `Not enough coins. You need ${def.price - p.coins} more.`));
      return;
    }
    p.coins -= def.price;
    p.owned = [...p.owned, id];
    p.equip = { ...p.equip, [def.slot]: id };
    setCoins(p.coins);
    applyEquipRef.current?.();
    grant("style-1");
    pushToast(pick(lang, `${def.nama} dibeli dan dipakai!`, `${def.namaEn} bought and equipped!`));
    setProg({ ...p });
    save();
  }
  function equip(slot: Slot, id: string) {
    const p = progRef.current;
    if (!p.owned.includes(id) && !p.devnet.includes(id)) return;
    p.equip = { ...p.equip, [slot]: id };
    applyEquipRef.current?.();
    setProg({ ...p });
    save();
  }
  function buyItem(id: string) {
    const p = progRef.current;
    const def = ITEMS.find((i) => i.id === id);
    if (!def || !def.price) return;
    if (p.coins < def.price) {
      pushToast(pick(lang, "Koin kurang.", "Not enough coins."));
      return;
    }
    p.coins -= def.price;
    p.inventory = { ...p.inventory, [id]: (p.inventory[id] ?? 0) + 1 };
    setCoins(p.coins);
    setProg({ ...p });
    save();
  }
  async function buyDevnet(id: string) {
    setDevnetStatus(pick(lang, "Menyiapkan...", "Preparing..."));
    try {
      const list = await devnetBuy(id, (s) => {
        const msg: Record<string, [string, string]> = {
          connect: ["Menghubungkan dompet...", "Connecting wallet..."],
          sign: ["Setujui transaksi devnet di dompet...", "Approve the devnet transaction in your wallet..."],
          send: ["Mengirim ke devnet...", "Sending to devnet..."],
          verify: ["Server memeriksa transaksi di devnet...", "Server is checking the transaction on devnet..."],
        };
        if (s.startsWith("done:")) setDevnetStatus(`${pick(lang, "Berhasil. Tanda tangan", "Done. Signature")}: ${s.slice(5)}`);
        else setDevnetStatus(pick(lang, msg[s]?.[0] ?? s, msg[s]?.[1] ?? s));
      });
      const p = progRef.current;
      p.devnet = list;
      const def = COSMETICS.find((c) => c.id === id);
      if (def) p.equip = { ...p.equip, [def.slot]: id };
      applyEquipRef.current?.();
      setProg({ ...p });
      save();
      pushToast(pick(lang, "Barang devnet diterima!", "Devnet item received!"));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setDevnetStatus(m === "no-wallet" ? pick(lang, "Dompet Solana tidak ditemukan di peramban ini.", "No Solana wallet found in this browser.") : `${pick(lang, "Gagal", "Failed")}: ${m}`);
    }
  }
  function setMode(m: GameMode) {
    const p = progRef.current;
    p.mode = m;
    heartsRef.current = MAX_HEARTS;
    setHearts(MAX_HEARTS);
    setProg({ ...p });
    save();
    pushToast(m === "adventure" ? pick(lang, "Mode Petualangan: jaga hatimu!", "Adventure mode: watch your hearts!") : pick(lang, "Mode Santai: jelajah tanpa khawatir.", "Casual mode: explore without a care."));
  }
  function applyGfx(g: Gfx) {
    gfxRef.current = g;
    setGfxState(g);
    saveGfx(g);
  }
  function applyControls(c: Controls) {
    controlsRef.current = c;
    input.settings = { sensitivity: c.sensitivity, invertY: c.invertY };
    setControlsState(c);
    saveControls(c);
  }
  function netMe(): NetPlayer {
    const p = progRef.current;
    return { id: "", name: myName(), hero: hero ?? "girl", equip: p.equip, x: 0, y: 0, z: 0, ry: 0, speed: 0, zone: "world", emote: null, emoteAt: 0 };
  }
  async function hostRoom() {
    roomRef.current?.close();
    setRoomUi({ ...EMPTY_ROOM, status: "connecting" });
    try {
      roomRef.current = await Room.host(netMe());
    } catch (e) {
      setRoomUi({ ...EMPTY_ROOM, status: "error", error: String((e as { type?: string })?.type ?? e) });
    }
  }
  async function joinRoom(code: string) {
    roomRef.current?.close();
    setRoomUi({ ...EMPTY_ROOM, status: "connecting" });
    try {
      roomRef.current = await Room.join(code, netMe());
    } catch (e) {
      roomRef.current = null;
      setRoomUi({ ...EMPTY_ROOM, status: "error", error: String((e as { type?: string })?.type ?? e) });
    }
  }
  function leaveRoom() {
    roomRef.current?.close();
    roomRef.current = null;
    setRoomUi(EMPTY_ROOM);
  }
  function sendEmote(e: EmoteId) {
    emoteRef.current = { e, at: Date.now() };
    roomRef.current?.emote(e);
  }

  function closeStory(accepted: boolean) {
    setStoryOpen(null);
    if (!accepted) return;
    const p = progRef.current;
    if (p.storyChapter >= STORY.length) return;
    p.storyChapter++;
    p.xp += 50;
    setHudXp(p.xp);
    setHudLevel(levelFromXp(p.xp));
    if (p.storyChapter >= 1) grant("story-1");
    if (p.storyChapter >= 6) grant("story-6");
    if (p.storyChapter >= 12) grant("story-12");
    if (p.storyChapter >= 24) grant("story-24");
    if (p.storyChapter >= 36) grant("story-36");
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
    p.placedDecors = placed ? p.placedDecors.filter((d) => d !== id) : [...p.placedDecors, id];
    if (!placed) {
      const def = DECORS.find((d) => d.id === id)!;
      pushToast((lang === "id" ? UI.homePlaced.id : UI.homePlaced.en)(lang === "id" ? def.nama : def.namaEn));
      grant("home-1");
    }
    syncDecorRef.current?.();
    setProg({ ...p });
    save();
  }

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
  function choosePet(id: string) {
    progRef.current.pet = id;
    setProg({ ...progRef.current });
    save();
  }

  if (!prog || !gfx || !controls)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-300 to-emerald-200">
        <p className="text-lg font-semibold text-emerald-900">{pick(lang, UI.loading.id, UI.loading.en)}</p>
      </div>
    );

  if (!hero) {
    const level = levelFromXp(prog.xp);
    return (
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-6 overflow-y-auto bg-gradient-to-b from-sky-300 to-emerald-200 px-4 py-10 text-center">
        <button onClick={toggleLang} className="absolute right-4 top-4 rounded-xl border border-emerald-700 bg-white/60 px-4 py-2 text-sm font-semibold text-emerald-800">
          {lang === "id" ? "English" : "Bahasa Indonesia"}
        </button>
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 sm:text-4xl">{pick(lang, UI.choose.id, UI.choose.en)}</h1>
          <p className="mx-auto mt-3 max-w-md text-emerald-800">
            {user ? (lang === "id" ? UI.helloUser.id : UI.helloUser.en)(user, level) : pick(lang, UI.guestNote.id, UI.guestNote.en)}
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-2">
          {(["casual", "adventure"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                progRef.current.mode = m;
                setProg({ ...progRef.current });
              }}
              data-testid={`start-mode-${m}`}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition ${prog.mode === m ? "border-emerald-700 bg-white text-emerald-900" : "border-white/60 bg-white/40 text-emerald-900/80"}`}
            >
              {m === "casual" ? pick(lang, "Santai", "Casual") : pick(lang, "Petualangan", "Adventure")}
              <span className="block text-xs font-normal">
                {m === "casual" ? pick(lang, "tanpa nyawa", "no health") : pick(lang, `${MAX_HEARTS} hati + slime`, `${MAX_HEARTS} hearts + slimes`)}
              </span>
            </button>
          ))}
        </div>
        <div className="grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-3">
          {HEROES.map((h) => {
            const unlocked = prog.heroes.includes(h.id);
            return (
              <button
                key={h.id}
                disabled={!unlocked}
                onClick={() => setHero(h.id)}
                data-testid={`hero-${h.id}`}
                className={`relative rounded-2xl px-4 py-5 text-base font-semibold shadow-lg transition ${unlocked ? "bg-white text-emerald-900 hover:scale-105 active:scale-95" : "cursor-not-allowed bg-white/40 text-emerald-900/40"}`}
              >
                <span className={`mx-auto mb-2 block rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-50 ${unlocked ? "" : "opacity-50 grayscale"}`}>
                  <Thumb kind="hero" id={h.id} alt={lang === "id" ? h.nama : h.namaEn} className="mx-auto h-28 w-28 sm:h-36 sm:w-36" />
                </span>
                {lang === "id" ? h.nama : h.namaEn}
                {!unlocked && <span className="mt-1 block text-xs font-normal">{(lang === "id" ? UI.unlockAtLevel.id : UI.unlockAtLevel.en)(h.level)}</span>}
              </button>
            );
          })}
        </div>
        {!user && (
          <div className="flex gap-4 text-sm">
            <a href="/daftar" className="rounded-xl bg-emerald-700 px-5 py-2 font-semibold text-white">{pick(lang, UI.register.id, UI.register.en)}</a>
            <a href="/masuk" className="rounded-xl border border-emerald-700 px-5 py-2 font-semibold text-emerald-800">{pick(lang, UI.login.id, UI.login.en)}</a>
          </div>
        )}
      </div>
    );
  }

  const level = hudLevel;
  const xpNow = hudXp - xpForLevel(level);
  const xpNext = xpForLevel(level + 1) - xpForLevel(level);
  const chapter = storyOpen ? STORY[storyOpen - 1] : null;
  const nounName = questData ? (QUEST_NOUN_NAMES[questData.noun]?.[lang] ?? questData.noun) : "";
  let questLine = "";
  if (questData) {
    if (questKind === "race") questLine = (lang === "id" ? UI.raceTitle.id : UI.raceTitle.en)(raceTime ?? 0);
    else if (questKind === "treasure") questLine = pick(lang, UI.treasureTitle.id, UI.treasureTitle.en);
    else if (questKind === "delivery") questLine = pick(lang, UI.deliveryTitle.id, UI.deliveryTitle.en);
    else if (questKind === "shard") questLine = pick(lang, UI.starShardTitle.id, UI.starShardTitle.en);
    else questLine = (lang === "id" ? UI.mission.id : UI.mission.en)(questData.num, questData.need, nounName);
  }
  const zoneLabel: Record<string, [string, string]> = {
    cave: ["Gua Kristal", "Crystal Cave"],
    hall: ["Aula Gunung", "Mountain Hall"],
    arena: ["Arena Latihan", "Training Arena"],
  };
  const adventure = prog.mode === "adventure";

  return (
    <div className="relative h-[100dvh] w-screen select-none overflow-hidden bg-black" data-testid="game-root">
      <div ref={mountRef} className="h-full w-full" style={{ filter: colorFilter(gfx) }} data-testid="game-view" />
      {!photoMode && zoneName === "world" && <MiniMap lang={lang} getState={getMapState} bigOpen={mapOpen} setBigOpen={setMapOpen} />}
      {!photoMode && !menuOpen && (rideHint || riding) && !npcNear && (
        <button
          onClick={() => input.press("interact")}
          className="absolute bottom-44 left-1/2 z-10 -translate-x-1/2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-xl sm:bottom-24"
          data-testid="ride-prompt"
        >
          {riding
            ? pick(lang, `Turun dari ${SPECIES[riding as keyof typeof SPECIES].nama.toLowerCase()} (E)`, `Get off the ${SPECIES[riding as keyof typeof SPECIES].namaEn.toLowerCase()} (E)`)
            : pick(lang, `Tunggangi ${SPECIES[rideHint as keyof typeof SPECIES].nama.toLowerCase()} (E)`, `Ride the ${SPECIES[rideHint as keyof typeof SPECIES].namaEn.toLowerCase()} (E)`)}
        </button>
      )}
      {!photoMode && (
        <>
          <div className="pointer-events-none absolute left-2 top-2 max-w-[62vw] rounded-2xl bg-black/45 px-3 py-2 text-white backdrop-blur sm:left-4 sm:top-4 sm:max-w-xs sm:px-4 sm:py-3" data-testid="hud-quest">
            {zoneName === "world" ? (
              <>
                <p className="text-xs font-semibold sm:text-sm">{questLine}</p>
                {questKind === "race" && raceGates && (
                  <p className="text-xs font-bold text-sky-300">
                    {(lang === "id" ? UI.raceTimeLeft.id : UI.raceTimeLeft.en)(raceTime ?? 0)} · {(lang === "id" ? UI.raceGates.id : UI.raceGates.en)(raceGates.done, raceGates.total)}
                  </p>
                )}
                {progressText && <p className="text-xs opacity-80">{pick(lang, UI.collected.id, UI.collected.en)}: {progressText}</p>}
              </>
            ) : (
              <p className="text-sm font-semibold" data-testid="hud-zone">{pick(lang, zoneLabel[zoneName][0], zoneLabel[zoneName][1])}</p>
            )}
            <p className="mt-1 hidden text-xs opacity-80 sm:block">{pick(lang, UI.scoreLbl.id, UI.scoreLbl.en)}: {score} · {pick(lang, UI.bestLbl.id, UI.bestLbl.en)}: {prog.bestScore}</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs font-semibold text-amber-300">Lv {level}</p>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/25 sm:w-28">
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (xpNow / xpNext) * 100)}%` }} />
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-200" data-testid="hud-coins">
                <Coin className="h-3.5 w-3.5" /> {coins}
              </span>
            </div>
            {adventure && (
              <div className="mt-1 flex gap-0.5" data-testid="hud-hearts" aria-label={`${hearts} / ${MAX_HEARTS}`}>
                {Array.from({ length: MAX_HEARTS }, (_, i) => <Heart key={i} full={i < hearts} />)}
              </div>
            )}
          </div>
          <div
            ref={arrowRef}
            className="pointer-events-none absolute left-1/2 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-amber-300 backdrop-blur transition-opacity"
            style={{ transform: "translateX(-50%)" }}
            data-testid="hud-arrow"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden><path d="M12 3l7 12h-5v6h-4v-6H5z" fill="currentColor" /></svg>
          </div>
          <div className="absolute right-2 top-2 z-[7] flex items-center gap-2 sm:right-4 sm:top-4">
            {roomUi.status === "open" && (
              <span className="rounded-full bg-black/45 px-3 py-1.5 font-mono text-xs text-emerald-200 backdrop-blur" data-testid="hud-room">
                {roomUi.code} · {roomUi.players.length + 1}p · {roomUi.players.length ? `${roomUi.ping.toFixed(0)}ms` : "..."}
              </span>
            )}
            {gfx.showFps && <span className="rounded-full bg-black/45 px-3 py-1.5 font-mono text-xs text-white backdrop-blur" data-testid="hud-fps">{fps} fps</span>}
            <button
              onClick={() => applyControls({ ...controls, view: controls.view === "tpp" ? "fpp" : "tpp" })}
              className="rounded-full bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur"
              data-testid="hud-view"
            >
              {controls.view === "tpp" ? pick(lang, "Orang ke-3", "3rd person") : pick(lang, "Orang ke-1", "1st person")}
            </button>
            <button
              onClick={() => setMapOpen(true)}
              className="hidden rounded-full bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur sm:block"
              data-testid="hud-map"
            >
              {pick(lang, "Peta (M)", "Map (M)")}
            </button>
            <button
              onClick={() => {
                setMenuTab("wardrobe");
                setMenuOpen(true);
              }}
              className="hidden rounded-full bg-black/45 px-3 py-2 text-xs font-semibold text-pink-200 backdrop-blur sm:block"
            >
              {pick(lang, "Lemari", "Wardrobe")}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg"
              data-testid="hud-menu"
              aria-label="Menu"
            >
              {pick(lang, "Menu", "Menu")}
            </button>
          </div>
          {insideHouse && zoneName === "world" && (
            <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 rounded-full bg-amber-100/90 px-4 py-1 text-xs font-semibold text-amber-900" data-testid="hud-inside">
              {pick(lang, "Di dalam rumah", "Indoors")}
            </div>
          )}
          {!touchUi && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 rounded-full bg-black/35 px-4 py-1.5 text-[11px] text-white/90 backdrop-blur md:block">
              {pick(lang, "Klik layar untuk kamera mouse · WASD jalan · Spasi lompat · V kamera · F gelembung · Esc menu", "Click the view for mouse look · WASD move · Space jump · V camera · F bubble · Esc menu")}
            </p>
          )}
        </>
      )}
      {npcNear && !storyOpen && !photoMode && (
        <button
          onClick={() => input.press("interact")}
          className="absolute bottom-40 left-1/2 z-10 -translate-x-1/2 rounded-2xl bg-violet-500 px-8 py-3 font-bold text-white shadow-xl"
        >
          {pick(lang, UI.talkElder.id, UI.talkElder.en)}
        </button>
      )}
      {touchUi && !photoMode && !menuOpen && !storyOpen && (
        <TouchControls input={input} lang={lang} adventure={adventure} canTalk={false} />
      )}
      {!photoMode &&
        pops.map((pop) => (
          <div
            key={pop.id}
            className="animate-float-up pointer-events-none absolute z-10 text-xl font-extrabold text-amber-300"
            style={{ left: `${pop.x}%`, top: `${pop.y}%`, textShadow: "0 2px 6px rgba(0,0,0,0.55)" }}
          >
            {pop.text}
          </div>
        ))}
      {toast && !photoMode && (
        <div className="toast-in pointer-events-none absolute left-1/2 top-1/4 z-20 max-w-[90vw] -translate-x-1/2 rounded-2xl bg-amber-400 px-6 py-3 text-center text-base font-bold text-amber-950 shadow-2xl sm:text-lg">
          {toast}
        </div>
      )}
      {fainted && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-indigo-950/60 backdrop-blur-sm">
          <p className="rounded-2xl bg-white/90 px-6 py-4 text-lg font-bold text-indigo-900">
            {pick(lang, "Kamu kelelahan dan tertidur...", "You got sleepy and dozed off...")}
          </p>
        </div>
      )}
      {menuOpen && (
        <Menu
          lang={lang}
          tab={menuTab}
          setTab={setMenuTab}
          onClose={() => setMenuOpen(false)}
          prog={prog}
          hero={hero}
          user={user}
          isParent={isParent}
          mode={prog.mode}
          setMode={setMode}
          onBuy={buyCosmetic}
          onEquip={equip}
          onDevnetBuy={buyDevnet}
          devnetStatus={devnetStatus}
          onBuyItem={buyItem}
          onUseItem={(id) => useItemRef.current?.(id)}
          onCraft={craft}
          hearts={hearts}
          onToggleDecor={toggleDecor}
          onGoHome={() => {
            goHomeRef.current?.();
            setMenuOpen(false);
          }}
          onChoosePet={choosePet}
          room={roomUi}
          onHost={hostRoom}
          onJoin={joinRoom}
          onLeave={leaveRoom}
          onEmote={sendEmote}
          gfx={gfx}
          setGfx={applyGfx}
          controls={controls}
          setControls={applyControls}
          musicOn={musicOn}
          toggleMusic={toggleMusic}
          volume={volume}
          setVolume={setVolume}
          toggleLang={toggleLang}
          onPhoto={() => {
            setMenuOpen(false);
            setPhotoMode(true);
          }}
          onChangeHero={() => {
            save();
            setMenuOpen(false);
            setHero(null);
          }}
          gamepad={gamepad}
        />
      )}
      {chapter && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-amber-50 p-6 text-amber-950 shadow-2xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">{(lang === "id" ? UI.storyHeader.id : UI.storyHeader.en)(chapter.bab, STORY.length)}</p>
            <h2 className="mt-1 text-2xl font-bold">{pick(lang, chapter.judul, chapter.judulEn)}</h2>
            <p className="mt-4 leading-relaxed">{pick(lang, chapter.teks, chapter.teksEn)}</p>
            <div className="mt-4 rounded-2xl bg-violet-100 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">{pick(lang, UI.elderTask.id, UI.elderTask.en)}</p>
              <p className="mt-1 text-sm">{pick(lang, chapter.tugas, chapter.tugasEn)}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => closeStory(true)} className="rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white">{pick(lang, UI.thanksElder.id, UI.thanksElder.en)}</button>
              <button onClick={() => closeStory(false)} className="rounded-xl border border-amber-300 px-6 py-3 font-semibold">{pick(lang, UI.later.id, UI.later.en)}</button>
            </div>
          </div>
        </div>
      )}
      {restOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-amber-50 p-8 text-center text-amber-950 shadow-2xl">
            <h2 className="text-2xl font-bold">{pick(lang, UI.restTitle.id, UI.restTitle.en)}</h2>
            <p className="mt-3 leading-relaxed">{pick(lang, UI.restBody.id, UI.restBody.en)}</p>
            <button onClick={() => setRestOpen(false)} className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white">{pick(lang, UI.restOk.id, UI.restOk.en)}</button>
          </div>
        </div>
      )}
      {photoMode && !photo && (
        <>
          <div
            className="absolute inset-0 z-10"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPlacedStickers((s) => [...s, { e: sticker, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }]);
            }}
          >
            {placedStickers.map((s, i) => (
              <span key={i} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, fontSize: "10vw", lineHeight: 1 }}>
                {s.e}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 z-20 border-[6px] border-white/70" />
          <div className="absolute left-1/2 top-3 z-30 w-[92%] max-w-xl -translate-x-1/2 rounded-2xl bg-black/55 p-3 backdrop-blur">
            <p className="text-center text-[11px] text-white/90">{pick(lang, UI.photoHint.id, UI.photoHint.en)}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {STICKERS.map((s) => (
                <button key={s} onClick={() => setSticker(s)} className={`rounded-lg px-2 py-1 text-xl ${sticker === s ? "bg-amber-400" : "bg-white/20"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
            <button onClick={() => setPlacedStickers([])} className="rounded-xl bg-black/55 px-4 py-2 text-xs font-semibold text-white backdrop-blur">{pick(lang, UI.clearStickers.id, UI.clearStickers.en)}</button>
            <button onClick={takePhoto} className="h-16 w-16 rounded-full border-4 border-white bg-pink-500 shadow-xl" aria-label={pick(lang, UI.shutter.id, UI.shutter.en)} />
            <button onClick={exitPhoto} className="rounded-xl bg-black/55 px-4 py-2 text-xs font-semibold text-white backdrop-blur">{pick(lang, UI.exitPhoto.id, UI.exitPhoto.en)}</button>
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
              <button onClick={savePhoto} className="flex-1 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white">{pick(lang, UI.savePhoto.id, UI.savePhoto.en)}</button>
              <button onClick={() => setPhoto(null)} className="rounded-xl border border-emerald-300 px-5 py-3 font-semibold">{pick(lang, UI.retake.id, UI.retake.en)}</button>
              <button onClick={exitPhoto} className="rounded-xl border border-emerald-300 px-5 py-3 font-semibold">{pick(lang, UI.exitPhoto.id, UI.exitPhoto.en)}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
