"use client";

// Controller diagrams for the landing page. Colour groups:
// green = movement, amber = actions, blue = camera.
const MOVE = "#0f8a5f";
const ACT = "#f4b43c";
const CAM = "#3a8fd0";

function Key({ x, y, w = 44, label, fill }: { x: number; y: number; w?: number; label: string; fill?: string }) {
  const lit = Boolean(fill);
  return (
    <g>
      <rect x={x} y={y + 4} width={w} height="44" rx="9" fill={lit ? "#0b1a13" : "#cfc8b5"} opacity={lit ? 0.35 : 1} />
      <rect x={x} y={y} width={w} height="44" rx="9" fill={fill ?? "#fffdf7"} stroke={lit ? "none" : "#d8d1bf"} />
      <text
        x={x + w / 2}
        y={y + 27}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fontFamily="ui-sans-serif, system-ui"
        fill={lit && fill !== ACT ? "#fff" : "#10241b"}
      >
        {label}
      </text>
    </g>
  );
}

export function KeyboardDiagram() {
  return (
    <svg viewBox="0 0 560 250" className="h-auto w-full" aria-hidden="true">
      <Key x={70} y={20} label="W" fill={MOVE} />
      <Key x={20} y={70} label="A" fill={MOVE} />
      <Key x={70} y={70} label="S" fill={MOVE} />
      <Key x={120} y={70} label="D" fill={MOVE} />
      <Key x={120} y={20} label="E" fill={ACT} />
      <Key x={170} y={20} label="R" />
      <Key x={170} y={70} label="F" />
      <Key x={20} y={20} label="Q" />
      <Key x={0} y={120} w={84} label="Shift" fill={MOVE} />
      <Key x={90} y={120} label="Z" />
      <Key x={140} y={120} label="X" />
      <Key x={190} y={120} label="C" />
      <Key x={240} y={120} label="V" fill={CAM} />
      <Key x={60} y={172} w={230} label="Space" fill={ACT} />
      {/* arrow keys */}
      <Key x={362} y={120} label="&#8593;" fill={MOVE} />
      <Key x={312} y={172} label="&#8592;" fill={MOVE} />
      <Key x={362} y={172} label="&#8595;" fill={MOVE} />
      <Key x={412} y={172} label="&#8594;" fill={MOVE} />
      {/* mouse */}
      <g transform="translate(478 20)">
        <rect x="0" y="0" width="62" height="96" rx="31" fill="#fffdf7" stroke="#d8d1bf" strokeWidth="2" />
        <line x1="31" y1="0" x2="31" y2="40" stroke="#d8d1bf" strokeWidth="2" />
        <rect x="27" y="14" width="8" height="16" rx="4" fill={CAM} />
        <path d="M31 -12 v-6 M18 -8 l-4 -5 M44 -8 l4 -5" stroke={CAM} strokeWidth="2.5" strokeLinecap="round" className="animate-twinkle" />
      </g>
    </svg>
  );
}

export function GamepadDiagram() {
  return (
    <svg viewBox="0 0 560 300" className="h-auto w-full" aria-hidden="true">
      <path
        d="M150 60 H410 C470 60 505 100 520 160 L540 235 C552 280 505 300 475 270 L430 222 H130 L85 270 C55 300 8 280 20 235 L40 160 C55 100 90 60 150 60Z"
        fill="#fffdf7"
        stroke="#d8d1bf"
        strokeWidth="3"
      />
      <rect x="130" y="40" width="80" height="18" rx="9" fill="#e3ddcc" />
      <rect x="350" y="40" width="80" height="18" rx="9" fill="#e3ddcc" />
      {/* left stick */}
      <circle cx="150" cy="130" r="36" fill="#efeadb" />
      <g className="animate-stick">
        <circle cx="150" cy="130" r="24" fill={MOVE} />
        <circle cx="150" cy="130" r="14" fill="#11a06f" />
      </g>
      {/* d-pad */}
      <path d="M210 180 h18 v-18 h18 v18 h18 v18 h-18 v18 h-18 v-18 h-18z" fill="#cfc8b5" />
      {/* right stick */}
      <circle cx="340" cy="190" r="32" fill="#efeadb" />
      <circle cx="340" cy="190" r="21" fill={CAM} />
      <circle cx="340" cy="190" r="12" fill="#5aa6e0" />
      {/* face buttons */}
      <circle cx="430" cy="100" r="15" fill="#e3ddcc" />
      <circle cx="400" cy="130" r="15" fill="#e3ddcc" />
      <circle cx="460" cy="130" r="15" fill="#e3ddcc" />
      <circle cx="430" cy="160" r="15" fill={ACT} />
      <text x="430" y="165" textAnchor="middle" fontSize="13" fontWeight="700" fill="#10241b" fontFamily="ui-sans-serif, system-ui">A</text>
      <circle cx="255" cy="110" r="7" fill="#cfc8b5" />
      <circle cx="305" cy="110" r="7" fill="#cfc8b5" />
    </svg>
  );
}

export function TouchDiagram() {
  return (
    <svg viewBox="0 0 560 290" className="h-auto w-full" aria-hidden="true">
      <rect x="10" y="20" width="540" height="250" rx="36" fill="#10241b" />
      <rect x="28" y="36" width="504" height="218" rx="22" fill="#8fcf8a" />
      <path d="M28 150 Q160 110 300 140 T532 130 V254 H28Z" fill="#5fb46e" />
      <path d="M28 200 Q200 170 380 196 T532 190 V254 H28Z" fill="#3f9a57" />
      {/* move stick */}
      <circle cx="110" cy="190" r="44" fill="#fff" opacity="0.35" stroke="#fff" strokeWidth="2" />
      <g className="animate-stick">
        <circle cx="110" cy="190" r="20" fill={MOVE} stroke="#fff" strokeWidth="3" />
      </g>
      {/* jump + camera buttons */}
      <circle cx="462" cy="196" r="30" fill={ACT} stroke="#fff" strokeWidth="3" />
      <path d="M462 184 l10 12 h-6 v10 h-8 v-10 h-6z" fill="#10241b" />
      <circle cx="486" cy="80" r="20" fill={CAM} stroke="#fff" strokeWidth="3" />
      <text x="486" y="85" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" fontFamily="ui-sans-serif, system-ui">V</text>
      {/* drag-to-look hint */}
      <g className="animate-twinkle">
        <path d="M300 96 h90" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9" />
        <path d="M384 88 l10 8 l-10 8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="300" cy="96" r="12" fill="#fff" opacity="0.8" />
      </g>
    </svg>
  );
}

export const CONTROL_COLORS = { MOVE, ACT, CAM };
