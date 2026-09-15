"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pick, UI } from "@/lib/i18n";
import { HEROES } from "@/lib/progression";
import { useLang } from "@/components/landing/useLang";
import { SiteFooter, SiteNav } from "@/components/landing/SiteChrome";

interface Explorer {
  username: string;
  level: number;
  story: number;
  items: number;
  hero: string | null;
  me: boolean;
}

const T = {
  kicker: { id: "Keluarga", en: "Family" },
  needLogin: { id: "Masuk dulu untuk melihat papan keluarga.", en: "Log in first to see the family board." },
  loading: { id: "Memuat penjelajah...", en: "Loading explorers..." },
  chapter: { id: "Bab", en: "Chapter" },
};

export default function KeluargaPage() {
  const [lang, setLang] = useLang();
  const [rows, setRows] = useState<Explorer[] | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const t = (k: keyof typeof T) => T[k][lang];

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => {
        if (r.status === 401) {
          setNeedLogin(true);
          return null;
        }
        return r.json();
      })
      .then((d) => d && setRows(d.explorers))
      .catch(() => setRows([]));
  }, []);

  const heroName = (id: string | null) => {
    const h = HEROES.find((x) => x.id === id);
    return h ? (lang === "id" ? h.nama : h.namaEn) : "-";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <SiteNav lang={lang} setLang={setLang} sections={false} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.16em] text-leaf">{t("kicker")}</p>
        <h1 className="animate-rise mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {pick(lang, UI.leaderboard.id, UI.leaderboard.en)}
        </h1>
        <p className="animate-rise mt-3 max-w-xl text-ink-soft">{pick(lang, UI.leaderboardSub.id, UI.leaderboardSub.en)}</p>

        {needLogin ? (
          <div className="animate-rise mt-10 rounded-3xl border border-line bg-paper p-8 text-center">
            <p className="text-ink">{t("needLogin")}</p>
            <Link href="/masuk" className="mt-5 inline-block rounded-full bg-leaf px-6 py-2.5 font-semibold text-white transition hover:bg-leaf-deep">
              {pick(lang, UI.login.id, UI.login.en)}
            </Link>
          </div>
        ) : !rows ? (
          <div className="mt-10 space-y-3" aria-busy="true" aria-label={t("loading")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center text-ink-soft">
            {pick(lang, UI.leaderboardEmpty.id, UI.leaderboardEmpty.en)}
          </p>
        ) : (
          <ul className="mt-10 space-y-3">
            {rows.map((r, i) => (
              <li
                key={r.username}
                className={`animate-rise flex flex-wrap items-center gap-4 rounded-2xl border p-4 sm:p-5 ${
                  r.me ? "border-sun bg-[#fff6e0]" : "border-line bg-paper"
                }`}
                style={{ "--d": `${i * 60}ms` } as React.CSSProperties}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf/10 text-lg font-semibold text-leaf">
                  {r.username.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {r.username}
                    {r.me && (
                      <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-xs font-semibold text-ink">
                        {pick(lang, UI.you.id, UI.you.en)}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink-soft">{heroName(r.hero)}</p>
                </div>
                <dl className="flex gap-2 text-center">
                  {[
                    [pick(lang, UI.colLevel.id, UI.colLevel.en), r.level],
                    [pick(lang, UI.colStory.id, UI.colStory.en), `${r.story}/12`],
                    [pick(lang, UI.colItems.id, UI.colItems.en), r.items],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="min-w-16 rounded-xl bg-background px-3 py-1.5">
                      <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{k}</dt>
                      <dd className="font-semibold tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/play"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold transition hover:border-ink/30"
        >
          <span aria-hidden="true">&larr;</span> {pick(lang, UI.backToGame.id, UI.backToGame.en)}
        </Link>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
