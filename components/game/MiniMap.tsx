"use client";

// Corner minimap plus a full-screen world map. Both are drawn from the same
// deterministic terrain the 3D world uses, so the map is always accurate,
// including far-away villages the engine has not built yet.

import { useCallback, useEffect, useRef, useState } from "react";
import { biomeAt, terrainHeight, WATER_Y } from "@/lib/game/terrain";
import { HOME, SITES, VILLAGE0, dungeonName, dungeonsIn, villageName, villagesIn } from "@/lib/game/world";
import { pick, type Lang } from "@/lib/i18n";

export interface MapState {
  x: number;
  z: number;
  camYaw: number; // camera yaw: forward is (-sin, -cos)
  zone: string;
  guide: { x: number; z: number } | null;
  friends: { x: number; z: number; name: string }[];
  animals: { x: number; z: number }[];
  mounted: boolean;
}

const MINI_ZOOMS = [40, 70, 120, 200]; // metres from centre to edge
const MAP_ZOOMS = [150, 300, 600, 1200, 2400, 4800];

function groundColor(x: number, z: number, out: Uint8ClampedArray, i: number) {
  const h = terrainHeight(x, z);
  let r: number, g: number, b: number;
  if (h < WATER_Y) {
    const d = Math.min(1, (WATER_Y - h) / 6);
    r = 70 - d * 40; g = 150 - d * 50; b = 205 - d * 30;
  } else if (h < WATER_Y + 0.6) {
    r = 222; g = 206; b = 150;
  } else {
    const bi = biomeAt(x, z);
    if (bi === "desert") { r = 228; g = 196; b = 128; }
    else if (bi === "snow") { r = 236; g = 242; b = 248; }
    else { r = 104; g = 176; b = 84; }
    if (h > 10) {
      const k = Math.min(1, (h - 10) / 18);
      r += (150 - r) * k; g += (146 - g) * k; b += (138 - b) * k;
      if (h > 24) { r = 240; g = 244; b = 248; }
    }
    // hill shading from the slope facing north-west light
    const sx = terrainHeight(x + 2, z) - h;
    const sz = terrainHeight(x, z + 2) - h;
    const light = Math.max(0.65, Math.min(1.25, 1 - (sx + sz) * 0.12));
    r *= light; g *= light; b *= light;
  }
  out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
}

function drawGround(ctx: CanvasRenderingContext2D, res: number, cx: number, cz: number, range: number) {
  const img = ctx.createImageData(res, res);
  const step = (range * 2) / res;
  for (let py = 0; py < res; py++)
    for (let px = 0; px < res; px++)
      groundColor(cx - range + px * step, cz - range + py * step, img.data, (py * res + px) * 4);
  return img;
}

function drawMarkers(ctx: CanvasRenderingContext2D, W: number, s: MapState, cx: number, cz: number, range: number, lang: Lang, labels: boolean) {
  const toX = (x: number) => ((x - cx) / (range * 2) + 0.5) * W;
  const toY = (z: number) => ((z - cz) / (range * 2) + 0.5) * W;
  const dot = (x: number, z: number, r: number, fill: string, stroke = "#fff") => {
    ctx.beginPath();
    ctx.arc(toX(x), toY(z), r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.35);
    ctx.strokeStyle = stroke;
    ctx.stroke();
  };
  const text = (t: string, x: number, z: number, dy: number) => {
    if (!labels) return;
    ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(t, toX(x), toY(z) + dy);
    ctx.fillStyle = "#fff";
    ctx.fillText(t, toX(x), toY(z) + dy);
  };
  // markers shrink as the map zooms out, names only when there is room
  const zoomK = Math.max(0.3, Math.min(1, 320 / range));
  const unit = (W / 180) * (labels ? zoomK * 0.7 : 1);
  const showNames = labels && range <= 700;
  const plain = (t: string, x: number, z: number, dy: number) => showNames && text(t, x, z, dy);
  if (range <= 1300) for (const a of s.animals) dot(a.x, a.z, 2.2 * unit, "#c48a4a", "rgba(255,255,255,0.8)");
  for (const v of villagesIn(cx - range, cz - range, cx + range, cz + range)) {
    dot(v.x, v.z, 4 * unit, "#e0833a");
    plain(villageName(v.x, v.z), v.x, v.z, -12);
  }
  for (const d of dungeonsIn(cx - range, cz - range, cx + range, cz + range)) {
    dot(d.x, d.z, 4.2 * unit, d.kind === "cave" ? "#4fb9e6" : d.kind === "hall" ? "#8a6ad0" : "#d0514a", "#10241b");
    plain(dungeonName(d, lang), d.x, d.z, -12);
  }
  dot(VILLAGE0.x, VILLAGE0.z, 4 * unit, "#e0833a");
  text(pick(lang, "Desa Padang", "Meadow Village"), VILLAGE0.x, VILLAGE0.z, -9 * unit);
  dot(HOME.x, HOME.z, 4.5 * unit, "#3fa34d");
  text(pick(lang, "Rumah pohon", "Tree house"), HOME.x, HOME.z, 16 * unit);
  const siteName: Record<string, [string, string]> = { cave: ["Gua Kristal", "Crystal Cave"], hall: ["Aula Gunung", "Mountain Hall"], arena: ["Arena Latihan", "Training Arena"] };
  for (const site of SITES) {
    dot(site.x, site.z, 4.5 * unit, site.kind === "cave" ? "#4fb9e6" : site.kind === "hall" ? "#8a6ad0" : "#d0514a");
    text(pick(lang, siteName[site.kind][0], siteName[site.kind][1]), site.x, site.z, -9 * unit);
  }
  if (s.guide) {
    ctx.save();
    ctx.translate(toX(s.guide.x), toY(s.guide.z));
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#ffd447";
    ctx.strokeStyle = "#5a4000";
    ctx.lineWidth = 1.5;
    ctx.fillRect(-4 * unit, -4 * unit, 8 * unit, 8 * unit);
    ctx.strokeRect(-4 * unit, -4 * unit, 8 * unit, 8 * unit);
    ctx.restore();
  }
  for (const f of s.friends) {
    dot(f.x, f.z, 3.6 * unit, "#3f7ede");
    text(f.name, f.x, f.z, -8 * unit);
  }
  // the player: arrow pointing where the camera looks
  ctx.save();
  ctx.translate(toX(s.x), toY(s.z));
  ctx.rotate(-s.camYaw + Math.PI);
  ctx.beginPath();
  ctx.moveTo(0, 7 * unit);
  ctx.lineTo(5 * unit, -5 * unit);
  ctx.lineTo(0, -2.5 * unit);
  ctx.lineTo(-5 * unit, -5 * unit);
  ctx.closePath();
  ctx.fillStyle = s.mounted ? "#ff8a3a" : "#ffffff";
  ctx.strokeStyle = "#10241b";
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export default function MiniMap({ lang, getState, bigOpen, setBigOpen }: { lang: Lang; getState: () => MapState | null; bigOpen: boolean; setBigOpen: (v: boolean) => void }) {
  const mini = useRef<HTMLCanvasElement>(null);
  const big = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [mapZoom, setMapZoom] = useState(2);
  const [pan, setPan] = useState<{ x: number; z: number } | null>(null);
  const drag = useRef<{ px: number; py: number; x: number; z: number } | null>(null);
  const groundCache = useRef<{ key: string; img: ImageData } | null>(null);

  // corner minimap: terrain is re-sampled only after moving ~8% of its range
  useEffect(() => {
    const cv = mini.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const RES = 96;
    const off = document.createElement("canvas");
    off.width = off.height = RES;
    const octx = off.getContext("2d")!;
    let anchor = { x: Infinity, z: Infinity, range: 0 };
    const t = setInterval(() => {
      const s = getState();
      if (!s || s.zone !== "world") return;
      const range = MINI_ZOOMS[zoom];
      const pad = range * 1.3;
      if (Math.hypot(s.x - anchor.x, s.z - anchor.z) > range * 0.08 || anchor.range !== pad) {
        anchor = { x: s.x, z: s.z, range: pad };
        octx.putImageData(drawGround(octx, RES, s.x, s.z, pad), 0, 0);
      }
      const W = cv.width;
      ctx.clearRect(0, 0, W, W);
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
      ctx.clip();
      // draw the cached ground shifted by how far the player moved since
      const scale = W / (range * 2);
      const size = pad * 2 * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, W / 2 - (s.x - anchor.x) * scale - size / 2, W / 2 - (s.z - anchor.z) * scale - size / 2, size, size);
      drawMarkers(ctx, W, s, s.x, s.z, range, lang, false);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "700 14px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText("N", W / 2, 18);
    }, 120);
    return () => clearInterval(t);
  }, [getState, zoom, lang]);

  const drawBig = useCallback(() => {
    const cv = big.current;
    const s = getState();
    if (!cv || !s) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const range = MAP_ZOOMS[mapZoom];
    // snap the centre to a grid so walking with the map open doesn't
    // re-sample the whole terrain every refresh
    const snap = range * 0.1;
    const c = pan ?? { x: Math.round(s.x / snap) * snap, z: Math.round(s.z / snap) * snap };
    const RES = 220;
    const key = `${Math.round(c.x)}|${Math.round(c.z)}|${range}`;
    const off = document.createElement("canvas");
    off.width = off.height = RES;
    const octx = off.getContext("2d")!;
    if (groundCache.current?.key !== key) groundCache.current = { key, img: drawGround(octx, RES, c.x, c.z, range) };
    octx.putImageData(groundCache.current.img, 0, 0);
    const W = cv.width;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, W, W);
    drawMarkers(ctx, W, s, c.x, c.z, range, lang, true);
    // scale bar
    const barM = range >= 1200 ? 500 : range >= 300 ? 100 : 50;
    const barPx = (barM / (range * 2)) * W;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(16, W - 38, barPx + 20, 24);
    ctx.fillStyle = "#fff";
    ctx.fillRect(26, W - 24, barPx, 4);
    ctx.font = "600 12px ui-sans-serif, system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${barM} m`, 26, W - 28);
  }, [getState, mapZoom, pan, lang]);

  useEffect(() => {
    if (!bigOpen) return;
    drawBig();
    const t = setInterval(drawBig, 400);
    return () => clearInterval(t);
  }, [bigOpen, drawBig]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const k = e.key.toLowerCase();
      if (k === "m") setBigOpen(!bigOpen);
      if (bigOpen && (k === "+" || k === "=")) setMapZoom((z) => Math.max(0, z - 1));
      if (bigOpen && (k === "-" || k === "_")) setMapZoom((z) => Math.min(MAP_ZOOMS.length - 1, z + 1));
      if (bigOpen && k === "escape") setBigOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bigOpen, setBigOpen]);

  const zbtn = "grid h-8 w-8 place-items-center rounded-full bg-black/55 text-lg font-bold text-white backdrop-blur active:scale-90";

  return (
    <>
      <div className="pointer-events-auto absolute right-2 top-14 z-[6] flex flex-col items-end gap-1 sm:right-4 sm:top-16" data-testid="minimap">
        <button onClick={() => setBigOpen(true)} aria-label={pick(lang, "Buka peta dunia", "Open world map")} className="rounded-full shadow-xl">
          <canvas ref={mini} width={180} height={180} className="h-28 w-28 rounded-full sm:h-36 sm:w-36" />
        </button>
        <div className="flex gap-1">
          <button className={zbtn} onClick={() => setZoom((z) => Math.max(0, z - 1))} aria-label={pick(lang, "Perbesar peta mini", "Zoom minimap in")} data-testid="minimap-zoom-in">+</button>
          <button className={zbtn} onClick={() => setZoom((z) => Math.min(MINI_ZOOMS.length - 1, z + 1))} aria-label={pick(lang, "Perkecil peta mini", "Zoom minimap out")} data-testid="minimap-zoom-out">−</button>
        </div>
      </div>
      {bigOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" data-testid="world-map">
          <div className="menu-pop flex max-h-full w-full max-w-3xl flex-col gap-3 rounded-3xl bg-[#10241b] p-3 text-white shadow-2xl sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">{pick(lang, "Peta dunia", "World map")}</h2>
              <span className="text-xs text-white/70">{pick(lang, `Radius ${MAP_ZOOMS[mapZoom]} m · seret untuk menggeser`, `${MAP_ZOOMS[mapZoom]} m radius · drag to pan`)}</span>
              <div className="ml-auto flex gap-1">
                <button className={zbtn} onClick={() => setMapZoom((z) => Math.max(0, z - 1))} aria-label={pick(lang, "Perbesar", "Zoom in")} data-testid="map-zoom-in">+</button>
                <button className={zbtn} onClick={() => setMapZoom((z) => Math.min(MAP_ZOOMS.length - 1, z + 1))} aria-label={pick(lang, "Perkecil", "Zoom out")} data-testid="map-zoom-out">−</button>
                <button className="rounded-full bg-white/15 px-3 text-xs font-semibold" onClick={() => setPan(null)}>{pick(lang, "Ke posisiku", "Center on me")}</button>
                <button className="rounded-full bg-emerald-500 px-4 text-xs font-bold" onClick={() => setBigOpen(false)} data-testid="map-close">{pick(lang, "Tutup", "Close")}</button>
              </div>
            </div>
            <canvas
              ref={big}
              width={720}
              height={720}
              className="aspect-square w-full max-w-full cursor-grab touch-none rounded-2xl active:cursor-grabbing"
              style={{ maxHeight: "calc(100dvh - 9rem)", width: "auto" }}
              onWheel={(e) => setMapZoom((z) => Math.max(0, Math.min(MAP_ZOOMS.length - 1, z + (e.deltaY > 0 ? 1 : -1))))}
              onPointerDown={(e) => {
                const s = getState();
                if (!s) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                const c = pan ?? { x: s.x, z: s.z };
                drag.current = { px: e.clientX, py: e.clientY, x: c.x, z: c.z };
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const mPerPx = (MAP_ZOOMS[mapZoom] * 2) / rect.width;
                setPan({ x: d.x - (e.clientX - d.px) * mPerPx, z: d.z - (e.clientY - d.py) * mPerPx });
              }}
              onPointerUp={() => (drag.current = null)}
            />
            <div className="flex flex-wrap gap-3 text-[11px] text-white/80">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-white align-middle" />{pick(lang, "Kamu", "You")}</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#3f7ede] align-middle" />{pick(lang, "Teman", "Friends")}</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#e0833a] align-middle" />{pick(lang, "Desa", "Villages")}</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#4fb9e6] align-middle" />{pick(lang, "Gua / aula / arena", "Cave / hall / arena")}</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rotate-45 bg-[#ffd447] align-middle" />{pick(lang, "Tujuan misi", "Quest target")}</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#c48a4a] align-middle" />{pick(lang, "Hewan", "Animals")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
