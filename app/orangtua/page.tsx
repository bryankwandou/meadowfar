"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pick, UI } from "@/lib/i18n";
import { useLang } from "@/components/landing/useLang";
import { SiteFooter, SiteNav } from "@/components/landing/SiteChrome";

interface Child {
  id: number;
  username: string;
  isParent: boolean;
  dailyLimitMin: number;
  level: number;
  story: number;
  items: number;
  quests: number;
  races: number;
  achievements: number;
  lastPlayed: string | null;
}

const T = {
  kicker: { id: "Orang tua", en: "Parents" },
  parent: { id: "orang tua", en: "parent" },
  loading: { id: "Memuat data anak...", en: "Loading your children..." },
  devnetT: { id: "Tentang pembelian uji devnet", en: "About devnet test purchases" },
  devnetB: {
    id: "Akun orang tua bisa mencoba pembelian uji Solana devnet dari toko di dalam permainan. Token devnet tidak punya nilai uang sungguhan, dan anak tidak pernah perlu dompet.",
    en: "Parent accounts can try a Solana devnet test purchase from the in-game shop. Devnet tokens have no real-money value, and kids never need a wallet.",
  },
  limitNote: {
    id: "Saat batas tercapai, anak melihat pengingat istirahat yang lembut.",
    en: "When the limit is reached, your child sees a gentle break reminder.",
  },
};

export default function OrangTuaPage() {
  const [lang, setLang] = useLang();
  const [rows, setRows] = useState<Child[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const t = (k: keyof typeof T) => T[k][lang];

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/parent");
      if (r.status === 403 || r.status === 401) {
        setDenied(true);
        return;
      }
      const d = await r.json();
      setNow(Date.now());
      setRows(d.children);
    }
    load();
  }, []);

  async function setLimit(id: number, minutes: number) {
    await fetch("/api/parent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, minutes }),
    });
    setRows((rs) => (rs ? rs.map((c) => (c.id === id ? { ...c, dailyLimitMin: minutes } : c)) : rs));
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1600);
  }

  const when = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const mins = Math.max(0, Math.floor((now - d.getTime()) / 60000));
    if (mins < 60) return lang === "id" ? `${mins} menit lalu` : `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return lang === "id" ? `${hrs} jam lalu` : `${hrs} h ago`;
    const days = Math.floor(hrs / 24);
    return lang === "id" ? `${days} hari lalu` : `${days} d ago`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <SiteNav lang={lang} setLang={setLang} sections={false} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.16em] text-leaf">{t("kicker")}</p>
        <h1 className="animate-rise mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {pick(lang, UI.parentTitle.id, UI.parentTitle.en)}
        </h1>
        <p className="animate-rise mt-3 max-w-xl text-ink-soft">{pick(lang, UI.parentSub.id, UI.parentSub.en)}</p>

        {denied ? (
          <div className="animate-rise mt-10 rounded-3xl border border-line bg-paper p-8 text-center">
            <p>{pick(lang, UI.parentOnly.id, UI.parentOnly.en)}</p>
            <Link href="/masuk" className="mt-5 inline-block rounded-full bg-leaf px-6 py-2.5 font-semibold text-white transition hover:bg-leaf-deep">
              {pick(lang, UI.login.id, UI.login.en)}
            </Link>
          </div>
        ) : !rows ? (
          <div className="mt-10 space-y-3" aria-busy="true" aria-label={t("loading")}>
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl bg-line/60" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-10 space-y-4">
              {rows.map((c, i) => (
                <section
                  key={c.id}
                  aria-label={c.username}
                  className="animate-rise rounded-3xl border border-line bg-paper p-5 sm:p-7"
                  style={{ "--d": `${i * 70}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-3 text-lg font-semibold">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf/10 text-leaf">
                        {c.username.charAt(0).toUpperCase()}
                      </span>
                      {c.username}
                      {c.isParent && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                          {t("parent")}
                        </span>
                      )}
                    </h2>
                    <span className="text-sm text-ink-soft">
                      {pick(lang, UI.colLastPlayed.id, UI.colLastPlayed.en)}: {when(c.lastPlayed)}
                    </span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Stat label={pick(lang, UI.colLevel.id, UI.colLevel.en)} value={c.level} />
                    <Stat label={pick(lang, UI.colStory.id, UI.colStory.en)} value={`${c.story}/12`} />
                    <Stat label={pick(lang, UI.colQuests.id, UI.colQuests.en)} value={c.quests} />
                    <Stat label={pick(lang, UI.colItems.id, UI.colItems.en)} value={c.items} />
                    <Stat label={pick(lang, UI.achievements.id, UI.achievements.en)} value={c.achievements} />
                  </dl>
                  <div className="mt-5 border-t border-line pt-5">
                    <div role="group" aria-label={pick(lang, UI.colLimit.id, UI.colLimit.en)} className="flex flex-wrap items-center gap-2">
                      <span className="mr-1 text-sm font-medium">{pick(lang, UI.colLimit.id, UI.colLimit.en)}</span>
                      {[0, 30, 45, 60, 90].map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={c.dailyLimitMin === m}
                          onClick={() => setLimit(c.id, m)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                            c.dailyLimitMin === m
                              ? "border-leaf bg-leaf text-white"
                              : "border-line text-ink hover:border-ink/30"
                          }`}
                        >
                          {m === 0
                            ? pick(lang, UI.noLimit.id, UI.noLimit.en)
                            : (lang === "id" ? UI.minutes.id : UI.minutes.en)(m)}
                        </button>
                      ))}
                      <span aria-live="polite" className="text-sm font-semibold text-leaf">
                        {savedId === c.id ? pick(lang, UI.saved.id, UI.saved.en) : ""}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-ink-soft">{t("limitNote")}</p>
                  </div>
                </section>
              ))}
            </div>
            <aside className="mt-6 rounded-3xl border border-line bg-[#efeadc]/70 p-5 sm:p-7">
              <h2 className="font-semibold">{t("devnetT")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t("devnetB")}</p>
            </aside>
          </>
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-background px-3 py-2.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
