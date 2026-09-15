// Graphics and control settings. Presets cover the common cases; every value
// can also be changed on its own ("custom"), like the settings screens of
// big console and PC games.

export type Preset = "supersmooth" | "smooth" | "medium" | "high" | "superhigh" | "ultra" | "extreme";

export const PRESET_ORDER: Preset[] = ["supersmooth", "smooth", "medium", "high", "superhigh", "ultra", "extreme"];
export const PRESET_LABEL: Record<Preset, { id: string; en: string; hint: string; hintEn: string }> = {
  supersmooth: { id: "Super Mulus", en: "Super Smooth", hint: "Laptop sekolah & HP lama", hintEn: "School laptops and older phones" },
  smooth: { id: "Mulus", en: "Smooth", hint: "Utamakan FPS", hintEn: "Frame rate first" },
  medium: { id: "Sedang", en: "Medium", hint: "Seimbang", hintEn: "Balanced" },
  high: { id: "Tinggi", en: "High", hint: "Bayangan tajam, bloom", hintEn: "Sharp shadows, bloom" },
  superhigh: { id: "Super Tinggi", en: "Super High", hint: "Pandangan jauh", hintEn: "Longer view distance" },
  ultra: { id: "Ultra", en: "Ultra", hint: "Kartu grafis khusus", hintEn: "Dedicated graphics card" },
  extreme: { id: "Ekstrem", en: "Extreme", hint: "PC gaming kelas atas", hintEn: "High-end gaming PC" },
};

export interface Gfx {
  preset: Preset | "custom";
  scale: number; // render resolution, multiplied with the device pixel ratio
  shadows: 0 | 1 | 2; // off / soft / sharp high-res
  view: number; // view distance in terrain chunks (1..6)
  grass: number; // grass density multiplier (0..2.2)
  bloom: boolean; // glow on bright things (sun, crystals, lanterns)
  aa: boolean; // antialiasing
  wildlife: number; // animal density (0..1.5)
  fov: number; // field of view in degrees
  brightness: number; // 0.6 .. 1.5 (applied live, no rebuild)
  contrast: number; // 0.7 .. 1.4
  saturation: number; // 0.5 .. 1.6
  showFps: boolean;
  maxFps: 0 | 30 | 60; // 0 = unlimited (screen refresh)
}

type EngineOpts = Pick<Gfx, "scale" | "shadows" | "view" | "grass" | "bloom" | "aa" | "wildlife">;
export const PRESETS: Record<Preset, EngineOpts> = {
  supersmooth: { scale: 0.55, shadows: 0, view: 1, grass: 0, bloom: false, aa: false, wildlife: 0.4 },
  smooth: { scale: 0.75, shadows: 0, view: 2, grass: 0.25, bloom: false, aa: false, wildlife: 0.6 },
  medium: { scale: 1, shadows: 1, view: 2, grass: 0.6, bloom: false, aa: true, wildlife: 0.8 },
  high: { scale: 1, shadows: 2, view: 3, grass: 1, bloom: true, aa: true, wildlife: 1 },
  superhigh: { scale: 1.15, shadows: 2, view: 4, grass: 1.3, bloom: true, aa: true, wildlife: 1.2 },
  ultra: { scale: 1.3, shadows: 2, view: 5, grass: 1.7, bloom: true, aa: true, wildlife: 1.3 },
  extreme: { scale: 1.5, shadows: 2, view: 6, grass: 2.2, bloom: true, aa: true, wildlife: 1.5 },
};

export function autoPreset(): Preset {
  const cores = navigator.hardwareConcurrency || 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (cores <= 2) return "supersmooth";
  if (small) return "smooth";
  if (cores <= 4) return "medium";
  return "high";
}

// Brightness / contrast / saturation as a CSS filter on the canvas: applied
// instantly and costs nothing on the GPU budget of the 3D scene.
export function colorFilter(g: Gfx) {
  if (g.brightness === 1 && g.contrast === 1 && g.saturation === 1) return "none";
  return `brightness(${g.brightness}) contrast(${g.contrast}) saturate(${g.saturation})`;
}

const GFX_KEY = "meadowfar-gfx2";
const clamp = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};
export function loadGfx(): Gfx {
  try {
    const raw = JSON.parse(localStorage.getItem(GFX_KEY) || "null");
    if (raw && typeof raw === "object" && typeof raw.view === "number") {
      return {
        preset: PRESET_ORDER.includes(raw.preset) ? raw.preset : "custom",
        scale: clamp(raw.scale, 0.5, 1.5, 1),
        shadows: ([0, 1, 2].includes(raw.shadows) ? raw.shadows : 1) as Gfx["shadows"],
        view: Math.round(clamp(raw.view, 1, 6, 2)),
        grass: clamp(raw.grass, 0, 2.2, 0.6),
        bloom: !!raw.bloom,
        aa: !!raw.aa,
        wildlife: clamp(raw.wildlife, 0, 1.5, 1),
        fov: clamp(raw.fov, 50, 95, 62),
        brightness: clamp(raw.brightness, 0.6, 1.5, 1),
        contrast: clamp(raw.contrast, 0.7, 1.4, 1),
        saturation: clamp(raw.saturation, 0.5, 1.6, 1),
        showFps: !!raw.showFps,
        maxFps: ([0, 30, 60].includes(raw.maxFps) ? raw.maxFps : 0) as Gfx["maxFps"],
      };
    }
  } catch {}
  const p = autoPreset();
  return { preset: p, ...PRESETS[p], fov: 62, brightness: 1, contrast: 1, saturation: 1, showFps: false, maxFps: 0 };
}

export function saveGfx(g: Gfx) {
  try {
    localStorage.setItem(GFX_KEY, JSON.stringify(g));
  } catch {}
}

// Only these values need the renderer and world rebuilt; the rest apply live.
export function engineKey(g: Gfx) {
  return [g.scale, g.shadows, g.view, g.grass, g.bloom, g.aa, g.wildlife].join("|");
}

export interface Controls {
  sensitivity: number;
  invertY: boolean;
  touch: "auto" | "on" | "off";
  view: "tpp" | "fpp";
}

const CTRL_KEY = "meadowfar-controls";
export function loadControls(): Controls {
  try {
    const r = JSON.parse(localStorage.getItem(CTRL_KEY) || "null");
    if (r && typeof r === "object")
      return {
        sensitivity: Math.min(3, Math.max(0.2, Number(r.sensitivity) || 1)),
        invertY: !!r.invertY,
        touch: r.touch === "on" || r.touch === "off" ? r.touch : "auto",
        view: r.view === "fpp" ? "fpp" : "tpp",
      };
  } catch {}
  return { sensitivity: 1, invertY: false, touch: "auto", view: "tpp" };
}

export function saveControls(c: Controls) {
  try {
    localStorage.setItem(CTRL_KEY, JSON.stringify(c));
  } catch {}
}
