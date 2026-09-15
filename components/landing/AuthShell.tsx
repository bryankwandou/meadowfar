"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { MiniScene } from "./HeroScene";
import { LangToggle } from "./SiteChrome";
import Logo from "./Logo";

// Two-panel layout for sign up / log in. The form lives in `children`.
export default function AuthShell({
  lang,
  setLang,
  asideTitle,
  asidePoints,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  asideTitle: string;
  asidePoints: string[];
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-background text-ink lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-leaf-deep text-white lg:block">
        <MiniScene className="absolute inset-0 h-full w-full" />
        <div className="relative flex h-full flex-col p-10 xl:p-14">
          <Link href="/" aria-label="Meadowfar" className="self-start rounded-lg">
            <Logo tone="dark" size="lg" />
          </Link>
          <div className="mt-auto mb-24 max-w-md">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">{asideTitle}</h2>
            <ul className="mt-6 space-y-3">
              {asidePoints.map((p) => (
                <li key={p} className="flex gap-3 text-white/85">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true">
                    <circle cx="10" cy="10" r="10" fill="#f4b43c" />
                    <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="#10241b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Meadowfar" className="rounded-lg lg:invisible">
            <Logo />
          </Link>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="animate-rise w-full max-w-md">{children}</div>
        </div>
      </div>
    </main>
  );
}

export const inputClass =
  "mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/50 outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/15";

export const primaryBtn =
  "w-full rounded-xl bg-leaf px-6 py-3.5 font-semibold text-white shadow-sm shadow-leaf/30 transition hover:bg-leaf-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50";
