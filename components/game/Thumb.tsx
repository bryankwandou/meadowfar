"use client";

import { useEffect, useState } from "react";
import { cosmeticThumb, heroThumb, itemThumb } from "@/lib/game/thumbs";
import type { HeroId } from "@/lib/progression";

// Rendered 3D icon for a wardrobe piece or an inventory item.
export default function Thumb({ kind, id, hero, alt, className = "h-16 w-16" }: { kind: "cosmetic" | "item" | "hero"; id: string; hero?: HeroId; alt: string; className?: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    const done = (u: string) => queueMicrotask(() => live && setUrl(u));
    if (kind === "hero") heroThumb(id as HeroId, done);
    else if (kind === "cosmetic") cosmeticThumb(hero ?? "girl", id, done);
    else itemThumb(id, done);
    return () => {
      live = false;
    };
  }, [kind, id, hero]);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`${className} object-contain`} draggable={false} />
  ) : (
    <span className={`${className} block animate-pulse rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50`} aria-label={alt} />
  );
}
