"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { detectLang, saveLang, pick, UI, type Lang } from "@/lib/i18n";
import { HEROES } from "@/lib/progression";

interface Explorer {
  username: string;
  level: number;
  story: number;
  items: number;
  hero: string | null;
  me: boolean;
}

export default function KeluargaPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [rows, setRows] = useState<Explorer[] | null>(null);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    setLang(detectLang());
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
    return h ? (lang === "id" ? h.nama : h.namaEn) : "—";
  };

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-gradient-to-b from-sky-100 to-emerald-100 px-6 py-12 text-emerald-950">
      <div className="flex items-start justify-between">
        <h1 className="text-3xl font-bold">{pick(lang, UI.leaderboard.id, UI.leaderboard.en)}</h1>
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
        {pick(lang, UI.leaderboardSub.id, UI.leaderboardSub.en)}
      </p>

      {needLogin ? (
        <div className="mt-10 rounded-2xl bg-white/80 p-6 text-center">
          <p>{pick(lang, "Masuk dulu untuk melihat papan keluarga.", "Log in first to see the family board.")}</p>
          <Link href="/masuk" className="mt-3 inline-block font-semibold text-emerald-700 underline">
            {pick(lang, UI.login.id, UI.login.en)}
          </Link>
        </div>
      ) : !rows ? (
        <p className="mt-10 text-center text-emerald-600">…</p>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-center text-emerald-600">
          {pick(lang, UI.leaderboardEmpty.id, UI.leaderboardEmpty.en)}
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl bg-white/80 shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-600 text-white">
              <tr>
                <th className="px-4 py-3">{pick(lang, UI.colExplorer.id, UI.colExplorer.en)}</th>
                <th className="px-4 py-3">{pick(lang, UI.colLevel.id, UI.colLevel.en)}</th>
                <th className="px-4 py-3">{pick(lang, UI.colStory.id, UI.colStory.en)}</th>
                <th className="px-4 py-3">{pick(lang, UI.colItems.id, UI.colItems.en)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.username}
                  className={r.me ? "bg-amber-100 font-semibold" : "odd:bg-emerald-50/50"}
                >
                  <td className="px-4 py-3">
                    {r.username}
                    {r.me && (
                      <span className="ml-1 text-xs text-amber-700">
                        ({pick(lang, UI.you.id, UI.you.en)})
                      </span>
                    )}
                    <span className="block text-xs font-normal text-emerald-600">
                      {heroName(r.hero)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.level}</td>
                  <td className="px-4 py-3">{r.story}/12</td>
                  <td className="px-4 py-3">{r.items}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Link href="/play" className="mt-8 inline-block font-semibold text-emerald-700 underline">
        {pick(lang, UI.backToGame.id, UI.backToGame.en)}
      </Link>
    </main>
  );
}
