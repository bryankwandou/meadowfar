"use client";

import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import { useLang } from "./useLang";
import { SiteFooter, SiteNav } from "./SiteChrome";

export interface LegalContent {
  kicker: string;
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; p: string }[];
  back: string;
}

export default function LegalDoc({ doc }: { doc: Record<Lang, LegalContent> }) {
  const [lang, setLang] = useLang();
  const d = doc[lang];
  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <SiteNav lang={lang} setLang={setLang} sections={false} />
      <main className="flex-1">
        <div className="border-b border-line bg-paper">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="animate-rise text-xs font-semibold uppercase tracking-[0.16em] text-leaf">{d.kicker}</p>
            <h1 className="animate-rise mt-3 text-3xl font-semibold tracking-tight sm:text-5xl" style={{ "--d": "80ms" } as React.CSSProperties}>
              {d.title}
            </h1>
            <p className="animate-rise mt-3 text-sm text-ink-soft" style={{ "--d": "140ms" } as React.CSSProperties}>{d.updated}</p>
            <p className="animate-rise mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft" style={{ "--d": "200ms" } as React.CSSProperties}>
              {d.intro}
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <ol className="space-y-4">
            {d.sections.map((s, i) => (
              <li key={i} className="grid gap-3 rounded-2xl border border-line bg-paper p-5 sm:grid-cols-[3rem_1fr] sm:p-7">
                <span className="font-mono text-sm text-leaf">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{s.h}</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.p}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/daftar"
            className="mt-10 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30"
          >
            <span aria-hidden="true">&larr;</span> {d.back}
          </Link>
        </div>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
