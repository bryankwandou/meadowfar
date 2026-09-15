"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import Logo from "./Logo";

const C = {
  features: { id: "Fitur", en: "Features" },
  controls: { id: "Kontrol", en: "Controls" },
  together: { id: "Main bareng", en: "Play together" },
  parents: { id: "Orang tua", en: "Parents" },
  faq: { id: "Tanya jawab", en: "FAQ" },
  play: { id: "Main gratis", en: "Play free" },
  langGroup: { id: "Bahasa", en: "Language" },
  home: { id: "Meadowfar, ke beranda", en: "Meadowfar, go to home page" },
  studioLine: {
    id: "Dibuat oleh nayrbryanGaming, studio kecil di Makassar, Indonesia. Membuat game sejak 2017.",
    en: "Made by nayrbryanGaming, a small studio in Makassar, Indonesia. Making games since 2017.",
  },
  colGame: { id: "Permainan", en: "Game" },
  colFamily: { id: "Keluarga", en: "Family" },
  colLegal: { id: "Legal", en: "Legal" },
  signup: { id: "Daftar", en: "Sign up" },
  login: { id: "Masuk", en: "Log in" },
  board: { id: "Papan keluarga", en: "Family board" },
  dash: { id: "Dasbor orang tua", en: "Parent dashboard" },
  privacy: { id: "Privasi", en: "Privacy" },
  terms: { id: "Syarat", en: "Terms" },
  rights: { id: "Semua aset dibuat sendiri.", en: "All art made in-house." },
};

type K = keyof typeof C;
const tx = (lang: Lang, k: K) => C[k][lang];

export { LogoMark } from "./Logo";

export function LangToggle({
  lang,
  setLang,
  tone = "light",
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  tone?: "light" | "dark";
}) {
  const base =
    tone === "light"
      ? "border-line bg-paper/80 text-ink-soft"
      : "border-white/15 bg-white/5 text-white/70";
  const on = tone === "light" ? "bg-ink text-white" : "bg-white text-ink";
  return (
    <div role="group" aria-label={tx(lang, "langGroup")} className={`flex rounded-full border p-0.5 text-xs font-semibold ${base}`}>
      {(["en", "id"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`min-w-9 rounded-full px-2.5 py-1.5 uppercase transition-colors ${
            lang === l ? on : "hover:text-current"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function SiteNav({
  lang,
  setLang,
  sections = true,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  sections?: boolean;
}) {
  const links: [string, K][] = [
    ["/#features", "features"],
    ["/#controls", "controls"],
    ["/#together", "together"],
    ["/#parents", "parents"],
    ["/#faq", "faq"],
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label={tx(lang, "home")} className="flex items-center gap-2.5 rounded-lg">
          <Logo />
        </Link>
        {sections && (
          <ul className="ml-6 hidden items-center gap-1 lg:flex">
            {links.map(([href, k]) => (
              <li key={k}>
                <a
                  href={href}
                  className="rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  {tx(lang, k)}
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="ml-auto flex items-center gap-2">
          <LangToggle lang={lang} setLang={setLang} />
          <Link
            href="/play"
            className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-leaf/30 transition hover:bg-leaf-deep active:scale-[0.97]"
          >
            {tx(lang, "play")}
          </Link>
        </div>
      </nav>
    </header>
  );
}

const SOCIAL = [
  {
    name: "X",
    href: "https://x.com/nayrbryanGaming",
    d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@nayrbryangaming",
    d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
  },
  {
    name: "Telegram",
    href: "https://t.me/nayrbryangaming",
    d: "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z",
  },
];

export function SiteFooter({ lang }: { lang: Lang }) {
  const cols: { h: K; items: [string, K][] }[] = [
    { h: "colGame", items: [["/play", "play"], ["/daftar", "signup"], ["/masuk", "login"]] },
    { h: "colFamily", items: [["/keluarga", "board"], ["/orangtua", "dash"]] },
    { h: "colLegal", items: [["/privasi", "privacy"], ["/syarat", "terms"]] },
  ];
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_2fr]">
        <div>
          <Logo tone="dark" size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{tx(lang, "studioLine")}</p>
          <ul className="mt-6 flex gap-2">
            {SOCIAL.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`nayrbryanGaming on ${s.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:-translate-y-0.5 hover:border-white/40 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d={s.d} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <div key={c.h}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{tx(lang, c.h)}</p>
              <ul className="mt-4 space-y-2.5">
                {c.items.map(([href, k]) => (
                  <li key={k}>
                    <Link href={href} className="text-sm text-white/80 transition-colors hover:text-white">
                      {tx(lang, k)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-white/45 sm:px-6">
          <span>&copy; 2017&ndash;2026 nayrbryanGaming &middot; Makassar, Indonesia</span>
          <span>{tx(lang, "rights")}</span>
        </div>
      </div>
    </footer>
  );
}
