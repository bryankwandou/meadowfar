"use client";

// On-screen controller for phones and tablets, portrait and landscape.
// Left half: a floating stick that appears under the thumb (push up = walk
// forward, never inverted). Right half: drag anywhere to turn the camera.
// Buttons use pointer events so several fingers work at the same time.

import { useEffect, useRef, useState } from "react";
import type { Input } from "@/lib/game/input";
import { pick, type Lang } from "@/lib/i18n";

const R = 58; // stick travel radius in px

interface Props {
  input: Input | null;
  lang: Lang;
  adventure: boolean;
  canTalk: boolean;
}

export default function TouchControls({ input, lang, adventure, canTalk }: Props) {
  const [stick, setStick] = useState<{ x: number; y: number; kx: number; ky: number } | null>(null);
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });
  const [pressed, setPressed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => input?.resetTouch();
  }, [input]);

  if (!input) return null;

  const stickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stickId.current !== null) return;
    stickId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setStick({ x: e.clientX, y: e.clientY, kx: 0, ky: 0 });
  };
  const stickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== stickId.current || !stick) return;
    let dx = e.clientX - stick.x;
    let dy = e.clientY - stick.y;
    const m = Math.hypot(dx, dy);
    if (m > R) {
      dx = (dx / m) * R;
      dy = (dy / m) * R;
    }
    input.setStick(dx / R, -dy / R); // finger up (negative screen y) = forward
    setStick({ ...stick, kx: dx, ky: dy });
  };
  const stickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== stickId.current) return;
    stickId.current = null;
    input.setStick(0, 0);
    setStick(null);
  };

  const lookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookId.current !== null) return;
    lookId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    lookLast.current = { x: e.clientX, y: e.clientY };
  };
  const lookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== lookId.current) return;
    input.addLook(e.clientX - lookLast.current.x, e.clientY - lookLast.current.y);
    lookLast.current = { x: e.clientX, y: e.clientY };
  };
  const lookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerId === lookId.current) lookId.current = null;
  };

  const hold = (key: "jump" | "sprint") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      input.press(key, true);
      setPressed((p) => ({ ...p, [key]: true }));
    },
    onPointerUp: () => {
      input.press(key, false);
      setPressed((p) => ({ ...p, [key]: false }));
    },
    onPointerCancel: () => {
      input.press(key, false);
      setPressed((p) => ({ ...p, [key]: false }));
    },
  });
  const tap = (key: "interact" | "attack" | "toggleView" | "useItem") => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      input.press(key, true);
      setPressed((p) => ({ ...p, [key]: true }));
      setTimeout(() => setPressed((p) => ({ ...p, [key]: false })), 140);
    },
  });

  const btn = (on: boolean) =>
    `pointer-events-auto flex select-none items-center justify-center rounded-full border-2 font-bold text-white shadow-lg backdrop-blur-md transition-transform duration-100 ${
      on ? "scale-90 border-white bg-white/45" : "border-white/60 bg-black/30"
    }`;

  return (
    <div className="touch-ui pointer-events-none absolute inset-0 z-[5] select-none" data-testid="touch-controls">
      {/* left: move stick zone */}
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[62%] w-1/2 touch-none"
        onPointerDown={stickDown}
        onPointerMove={stickMove}
        onPointerUp={stickUp}
        onPointerCancel={stickUp}
        data-testid="stick-zone"
      >
        {!stick && (
          <div
            className="joy-idle absolute h-32 w-32 rounded-full border-2 border-white/50 bg-white/10"
            style={{ left: "max(1.5rem, env(safe-area-inset-left))", bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 shadow-md" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-white/90 drop-shadow">
              {pick(lang, "Geser untuk jalan", "Drag to move")}
            </span>
          </div>
        )}
      </div>
      {stick && (
        <div
          className="pointer-events-none fixed h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 bg-white/15 backdrop-blur-sm"
          style={{ left: stick.x, top: stick.y }}
          data-testid="stick-base"
        >
          <div
            className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full bg-white/85 shadow-xl"
            style={{ transform: `translate(calc(-50% + ${stick.kx}px), calc(-50% + ${stick.ky}px)) scale(1.08)` }}
            data-testid="stick-knob"
          />
        </div>
      )}
      {/* right: camera drag zone (sits under the buttons) */}
      <div
        className="pointer-events-auto absolute right-0 top-[18%] h-[82%] w-1/2 touch-none"
        onPointerDown={lookDown}
        onPointerMove={lookMove}
        onPointerUp={lookUp}
        onPointerCancel={lookUp}
        data-testid="look-zone"
      />
      {/* action buttons, thumb arc bottom-right */}
      <div
        className="absolute"
        style={{ right: "max(1rem, env(safe-area-inset-right))", bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative h-52 w-52">
          <button aria-label={pick(lang, "Lompat", "Jump")} className={`${btn(!!pressed.jump)} absolute bottom-2 right-2 h-20 w-20 bg-amber-400/70 text-sm`} {...hold("jump")} data-testid="btn-jump">
            {pick(lang, "Lompat", "Jump")}
          </button>
          <button aria-label={pick(lang, "Lari", "Run")} className={`${btn(!!pressed.sprint)} absolute bottom-24 right-4 h-14 w-14 text-xs`} {...hold("sprint")} data-testid="btn-run">
            {pick(lang, "Lari", "Run")}
          </button>
          <button aria-label={pick(lang, "Gelembung", "Bubble")} className={`${btn(!!pressed.attack)} absolute bottom-4 right-24 h-14 w-14 text-[11px] ${adventure ? "bg-sky-500/60" : ""}`} {...tap("attack")} data-testid="btn-bubble">
            {pick(lang, "Tiup", "Bubble")}
          </button>
          <button aria-label={pick(lang, "Pakai item", "Use item")} className={`${btn(!!pressed.useItem)} absolute bottom-20 right-24 h-12 w-12 text-[10px]`} {...tap("useItem")} data-testid="btn-item">
            {pick(lang, "Item", "Item")}
          </button>
          <button aria-label={pick(lang, "Ganti kamera", "Switch camera")} className={`${btn(!!pressed.toggleView)} absolute bottom-36 right-20 h-11 w-11 text-[10px]`} {...tap("toggleView")} data-testid="btn-view">
            {pick(lang, "Kamera", "View")}
          </button>
        </div>
      </div>
      {canTalk && (
        <button
          className={`${btn(!!pressed.interact)} absolute bottom-40 left-1/2 h-14 -translate-x-1/2 bg-violet-500/80 px-6 text-sm`}
          {...tap("interact")}
          data-testid="btn-talk"
        >
          {pick(lang, "Bicara / Masuk", "Talk / Enter")}
        </button>
      )}
    </div>
  );
}
