"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { detectLang, saveLang, pick, UI, type Lang } from "@/lib/i18n";

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

export default function OrangTuaPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [rows, setRows] = useState<Child[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    setLang(detectLang());
    load();
  }, []);

  async function load() {
    const r = await fetch("/api/parent");
    if (r.status === 403 || r.status === 401) {
      setDenied(true);
      return;
    }
    const d = await r.json();
    setRows(d.children);
  }

  async function setLimit(id: number, minutes: number) {
    await fetch("/api/parent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, minutes }),
    });
    setRows((rs) =>
      rs ? rs.map((c) => (c.id === id ? { ...c, dailyLimitMin: minutes } : c)) : rs
    );
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1600);
  }

  const when = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 60) return lang === "id" ? `${mins} menit lalu` : `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return lang === "id" ? `${hrs} jam lalu` : `${hrs} h ago`;
    const days = Math.floor(hrs / 24);
    return lang === "id" ? `${days} hari lalu` : `${days} d ago`;
  };

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-sky-100 to-emerald-100 px-6 py-12 text-emerald-950">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">{pick(lang, UI.parentTitle.id, UI.parentTitle.en)}</h1>
        <button
          onClick={() => {
            const next: Lang = lang === "id" ? "en" : "id";
            setLang(next);
            saveLang(next);
          }}
          className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700"
        >
          {lang === "id" ? "EN" : "ID"}
        </button>
      </div>
      <p className="mt-2 text-sm text-emerald-700">
        {pick(lang, UI.parentSub.id, UI.parentSub.en)}
      </p>

      {denied ? (
        <div className="mt-10 rounded-2xl bg-white/80 p-6 text-center">
          <p>{pick(lang, UI.parentOnly.id, UI.parentOnly.en)}</p>
          <Link href="/masuk" className="mt-3 inline-block font-semibold text-emerald-700 underline">
            {pick(lang, UI.login.id, UI.login.en)}
          </Link>
        </div>
      ) : !rows ? (
        <p className="mt-10 text-center text-emerald-600">…</p>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white/85 p-5 shadow">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold">
                  {c.username}
                  {c.isParent && (
                    <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      {pick(lang, "orang tua", "parent")}
                    </span>
                  )}
                </h2>
                <span className="text-xs text-emerald-600">
                  {pick(lang, UI.colLastPlayed.id, UI.colLastPlayed.en)}: {when(c.lastPlayed)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                <Stat label={pick(lang, UI.colLevel.id, UI.colLevel.en)} value={c.level} />
                <Stat label={pick(lang, UI.colStory.id, UI.colStory.en)} value={`${c.story}/12`} />
                <Stat label={pick(lang, UI.colQuests.id, UI.colQuests.en)} value={c.quests} />
                <Stat label={pick(lang, UI.colItems.id, UI.colItems.en)} value={c.items} />
                <Stat
                  label={pick(lang, UI.achievements.id, UI.achievements.en)}
                  value={c.achievements}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {pick(lang, UI.colLimit.id, UI.colLimit.en)}:
                </span>
                {[0, 30, 45, 60, 90].map((m) => (
                  <button
                    key={m}
                    onClick={() => setLimit(c.id, m)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold ${
                      c.dailyLimitMin === m
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-300 text-emerald-800"
                    }`}
                  >
                    {m === 0
                      ? pick(lang, UI.noLimit.id, UI.noLimit.en)
                      : (lang === "id" ? UI.minutes.id : UI.minutes.en)(m)}
                  </button>
                ))}
                {savedId === c.id && (
                  <span className="text-xs font-semibold text-emerald-600">
                    {pick(lang, UI.saved.id, UI.saved.en)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link href="/play" className="mt-8 inline-block font-semibold text-emerald-700 underline">
        {pick(lang, UI.backToGame.id, UI.backToGame.en)}
      </Link>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-emerald-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-emerald-600">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
