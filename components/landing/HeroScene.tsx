"use client";

import { useRef } from "react";
import type { Lang } from "@/lib/i18n";

const S = {
  room: { id: "Ruang", en: "Room" },
  players: { id: "pemain", en: "players" },
  wave: { id: "Halo semua!", en: "Hi everyone!" },
  adventure: { id: "Petualangan", en: "Adventure" },
  label: {
    id: "Ilustrasi dunia Meadowfar: padang, rumah pohon, desa, gua kristal, dua penjelajah, dan slime yang melompat.",
    en: "Illustration of the Meadowfar world: a meadow, a tree house, a village, a crystal cave, two explorers, and a bouncing slime.",
  },
};

function Avatar({ x, y, body, hat, cape }: { x: number; y: number; body: string; hat: string; cape?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="30" rx="13" ry="3.5" fill="#000" opacity="0.14" />
      {cape && <path d="M-9 2 L9 2 L13 26 L-13 26Z" fill={cape} />}
      <rect x="-9" y="0" width="18" height="24" rx="8" fill={body} />
      <rect x="-7" y="22" width="5" height="8" rx="2" fill="#3b2a20" />
      <rect x="2" y="22" width="5" height="8" rx="2" fill="#3b2a20" />
      <circle cx="0" cy="-8" r="9" fill="#f5c9a0" />
      <circle cx="-3" cy="-9" r="1.2" fill="#2a2a2a" />
      <circle cx="3" cy="-9" r="1.2" fill="#2a2a2a" />
      <path d="M-11 -13 Q0 -26 11 -13 Z" fill={hat} />
      <rect x="-13" y="-14" width="26" height="3" rx="1.5" fill={hat} />
    </g>
  );
}

export default function HeroScene({ lang }: { lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = (k: keyof typeof S) => S[k][lang];

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    el.style.setProperty("--py", (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--px", "0");
    ref.current?.style.setProperty("--py", "0");
  };
  const layer = (depth: number): React.CSSProperties => ({
    transform: `translate(calc(var(--px, 0) * ${-depth}px), calc(var(--py, 0) * ${-depth * 0.5}px))`,
    transition: "transform 0.4s cubic-bezier(0.2,0.7,0.2,1)",
  });

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-white/60 bg-sky shadow-[0_30px_80px_-30px_rgba(16,36,27,0.45)] ring-1 ring-ink/5"
    >
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img" aria-label={t("label")}>
        <defs>
          <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7cc3e6" />
            <stop offset="0.55" stopColor="#bfe2ef" />
            <stop offset="0.8" stopColor="#fbe6bf" />
          </linearGradient>
          <radialGradient id="hs-sun">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hs-meadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4fae62" />
            <stop offset="1" stopColor="#2f8649" />
          </linearGradient>
        </defs>

        <rect width="800" height="600" fill="url(#hs-sky)" />
        <g style={layer(4)}>
          <circle cx="620" cy="140" r="130" fill="url(#hs-sun)" />
          <circle cx="620" cy="140" r="44" fill="#ffd66b" />
        </g>

        {/* mountains + mountain hall */}
        <g style={layer(8)}>
          <path d="M0 340 L110 215 L190 290 L300 160 L420 300 L520 225 L640 320 L740 205 L800 250 L800 420 L0 420Z" fill="#9dbfd2" />
          <path d="M300 160 L270 196 L290 190 L300 200 L312 188 L330 196Z" fill="#fff" opacity="0.9" />
          <path d="M740 205 L716 232 L732 228 L744 236 L760 228Z" fill="#fff" opacity="0.9" />
          <g transform="translate(276 250)">
            <rect x="0" y="0" width="48" height="30" fill="#c9b79a" />
            <path d="M-6 0 L24 -20 L54 0Z" fill="#8a5a44" />
            <rect x="18" y="12" width="12" height="18" rx="6" fill="#4a3226" />
          </g>
        </g>

        {/* back hills + crystal cave */}
        <g style={layer(14)}>
          <path d="M0 385 Q160 300 320 350 T620 340 T800 330 V600 H0Z" fill="#8fcf8a" />
          <g transform="translate(70 318)">
            <path d="M0 52 Q40 -8 80 52Z" fill="#35574a" />
            <path d="M18 52 Q40 14 62 52Z" fill="#1d3a31" />
            <path className="animate-twinkle" d="M28 52 L33 32 L38 52Z" fill="#9be3ff" />
            <path className="animate-twinkle" style={{ animationDelay: "0.8s" }} d="M40 52 L46 26 L52 52Z" fill="#c7b6ff" />
          </g>
          {[560, 590, 700, 730].map((x, i) => (
            <path key={x} d={`M${x} ${352 - (i % 2) * 6} l14 -40 l14 40z`} fill={i % 2 ? "#3f8f59" : "#2f7a4b"} />
          ))}
        </g>

        {/* mid hills, village house, arena */}
        <g style={layer(22)}>
          <path d="M0 440 Q210 360 430 410 T800 390 V600 H0Z" fill="#62b46f" />
          <g transform="translate(480 352)">
            <rect x="0" y="0" width="66" height="46" rx="3" fill="#f6e7c8" />
            <path d="M-8 2 L33 -28 L74 2Z" fill="#c8553d" />
            <rect x="26" y="20" width="14" height="26" rx="2" fill="#7a4b2a" />
            <rect x="8" y="12" width="12" height="11" rx="2" fill="#ffd66b" />
            <rect x="46" y="12" width="12" height="11" rx="2" fill="#ffd66b" />
          </g>
          <g transform="translate(640 372)">
            <ellipse cx="40" cy="22" rx="46" ry="14" fill="#d9c28f" />
            <ellipse cx="40" cy="18" rx="46" ry="14" fill="none" stroke="#a9794e" strokeWidth="5" />
            <rect x="-6" y="-6" width="4" height="26" fill="#a9794e" />
            <path d="M-2 -6 l16 5 l-16 5z" fill="#e2574c" />
          </g>
        </g>

        {/* tree house */}
        <g style={layer(28)}>
          <rect x="176" y="300" width="22" height="160" fill="#7b5234" />
          <g className="animate-sway">
            <circle cx="150" cy="300" r="46" fill="#2f7d4a" />
            <circle cx="222" cy="292" r="50" fill="#35894f" />
            <circle cx="186" cy="258" r="54" fill="#3f9a5a" />
          </g>
          <rect x="148" y="332" width="80" height="7" rx="2" fill="#6a4329" />
          <rect x="160" y="300" width="56" height="34" rx="3" fill="#e9c48c" />
          <path d="M152 302 L188 276 L224 302Z" fill="#b5483a" />
          <rect x="182" y="312" width="12" height="22" rx="2" fill="#6a4329" />
          <rect x="166" y="310" width="10" height="9" rx="1.5" fill="#ffe08a" />
          <g stroke="#6a4329" strokeWidth="3">
            <line x1="232" y1="339" x2="244" y2="455" />
            <line x1="246" y1="339" x2="258" y2="455" />
            {[360, 385, 410, 435].map((y) => (
              <line key={y} x1={234 + (y - 339) * 0.1} y1={y} x2={248 + (y - 339) * 0.1} y2={y} />
            ))}
          </g>
        </g>

        {/* foreground meadow with explorers and a slime */}
        <g style={layer(40)}>
          <path d="M-20 490 Q250 440 520 478 T820 462 V620 H-20Z" fill="url(#hs-meadow)" />
          {[40, 120, 330, 420, 560, 690, 760].map((x, i) => (
            <path key={x} d={`M${x} ${505 + (i % 3) * 18} q3 -14 6 0 q3 -10 6 0`} fill="none" stroke="#9be08f" strokeWidth="2.5" strokeLinecap="round" />
          ))}
          {[[90, 540, "#fff"], [470, 560, "#ffd66b"], [650, 530, "#f7a8c4"]].map(([x, y, c]) => (
            <g key={`${x}`} transform={`translate(${x} ${y})`}>
              <circle r="4" fill={c as string} />
              <circle r="1.6" fill="#f4b43c" />
            </g>
          ))}
          <g className="animate-walk">
            <Avatar x={330} y={462} body="#3a7bd5" hat="#f4b43c" cape="#e2574c" />
          </g>
          <g className="animate-bob">
            <Avatar x={420} y={470} body="#9b5de5" hat="#0f8a5f" />
          </g>
          <g transform="translate(600 500)">
            <ellipse cx="0" cy="8" rx="22" ry="4" fill="#000" opacity="0.15" />
            <g className="animate-squish">
              <path d="M-22 8 Q-22 -22 0 -22 Q22 -22 22 8Z" fill="#8be07a" />
              <ellipse cx="-7" cy="-6" rx="3" ry="4" fill="#1f3d2a" />
              <ellipse cx="7" cy="-6" rx="3" ry="4" fill="#1f3d2a" />
              <ellipse cx="-12" cy="-14" rx="5" ry="3" fill="#fff" opacity="0.5" />
            </g>
          </g>
          {[[260, 420], [520, 430], [720, 410]].map(([x, y], i) => (
            <circle key={x} className="animate-twinkle" style={{ animationDelay: `${i * 0.7}s` }} cx={x} cy={y} r="3" fill="#fff6b0" />
          ))}
        </g>

        {/* drifting clouds */}
        <g opacity="0.9">
          <g className="animate-drift" style={{ animationDuration: "70s", animationDelay: "-20s" }}>
            <ellipse cx="0" cy="96" rx="56" ry="16" fill="#fff" />
            <ellipse cx="24" cy="86" rx="30" ry="16" fill="#fff" />
          </g>
          <g className="animate-drift" style={{ animationDuration: "95s", animationDelay: "-60s" }}>
            <ellipse cx="0" cy="190" rx="44" ry="12" fill="#fff" opacity="0.8" />
            <ellipse cx="-16" cy="182" rx="22" ry="12" fill="#fff" opacity="0.8" />
          </g>
        </g>
      </svg>

      {/* HUD overlays, styled like the in-game interface */}
      <div className="pointer-events-none absolute inset-0 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 rounded-full bg-ink/75 py-1.5 pl-2 pr-3 text-[11px] font-medium text-white backdrop-blur sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-ring" />
            <span className="font-mono tracking-wider">{t("room")} K7QX2M</span>
            <span className="hidden text-white/60 min-[420px]:inline">4/12 {t("players")}</span>
            <span className="text-emerald-300">38 ms</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1.5 backdrop-blur" aria-hidden="true">
            <span className="mr-1 hidden text-[10px] font-semibold uppercase tracking-wider text-ink-soft sm:inline">{t("adventure")}</span>
            {[0, 1, 2].map((i) => (
              <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                <path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z" fill={i < 2 ? "#e2574c" : "#e8d5cf"} />
              </svg>
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 left-3 flex items-end gap-2 sm:bottom-4 sm:left-4">
          <div className="animate-bob rounded-2xl rounded-bl-md bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-md">
            {t("wave")}
          </div>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-xs font-bold tabular-nums text-ink shadow-sm backdrop-blur sm:bottom-4 sm:right-4">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="#f4b43c" />
            <circle cx="10" cy="10" r="5" fill="none" stroke="#c98a14" strokeWidth="1.5" />
          </svg>
          240
        </div>
      </div>
    </div>
  );
}

/* Small decorative landscape used on the auth and legal pages. */
export function MiniScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f8a5f" />
          <stop offset="1" stopColor="#0a5c40" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#ms-sky)" />
      <circle cx="300" cy="70" r="26" fill="#f4b43c" />
      <circle className="animate-twinkle" cx="80" cy="50" r="2" fill="#fff" />
      <circle className="animate-twinkle" style={{ animationDelay: "1s" }} cx="160" cy="30" r="1.6" fill="#fff" />
      <path d="M0 170 Q100 120 200 150 T400 140 V240 H0Z" fill="#1f7a52" />
      <path d="M0 200 Q120 165 250 190 T400 185 V240 H0Z" fill="#7fd49b" opacity="0.35" />
      <g transform="translate(250 196)">
        <g className="animate-squish">
          <path d="M-14 6 Q-14 -14 0 -14 Q14 -14 14 6Z" fill="#8be07a" />
          <circle cx="-4" cy="-4" r="2" fill="#123" />
          <circle cx="4" cy="-4" r="2" fill="#123" />
        </g>
      </g>
    </svg>
  );
}
