import { useId } from "react";

// Meadowfar mark: a sky tile with a sun, a four-point star, two rolling
// hills and a winding path. Five colours: sky, amber, spring green, leaf
// green and path cream. Shapes are kept chunky so it reads at 16px.
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`mf-sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5db8e6" />
          <stop offset="1" stopColor="#ffe3a8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#mf-sky-${id})`} />
      <circle cx="43" cy="21" r="10" fill="#f4a52c" />
      <path d="M17 11l1.6 4.4L23 17l-4.4 1.6L17 23l-1.6-4.4L11 17l4.4-1.6z" fill="#fffbe8" />
      <path d="M0 40C12 30 26 30 38 36s20 4 26-2v30H0z" fill="#8ed389" />
      <path d="M0 48c14-8 30-8 44-2 8 3 14 2 20-1v19H0z" fill="#138a58" />
      <path d="M27 64c0-6 8-8 8-12s-4-5-3-6" fill="none" stroke="#fdf0cf" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

// Wordmark lockup. `tone` switches the text colours for dark backgrounds.
export default function Logo({
  tone = "light",
  size = "md",
}: {
  tone?: "light" | "dark";
  size?: "md" | "lg";
}) {
  const mark = size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "lg" ? "text-xl" : "text-[16px]";
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={`${mark} shrink-0 drop-shadow-sm`} />
      <span className={`${text} font-semibold tracking-[-0.02em] ${tone === "light" ? "text-ink" : "text-white"}`}>
        Meadow<span className={tone === "light" ? "text-leaf" : "text-sun"}>far</span>
      </span>
    </span>
  );
}
