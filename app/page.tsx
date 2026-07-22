"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { detectLang, saveLang, pick, type Lang } from "@/lib/i18n";

const T = {
  badge: {
    id: "Dunia terbuka untuk anak, langsung dari peramban",
    en: "An open world for kids, straight from the browser",
  },
  tagline: {
    id: "Padang rumput yang membentang tanpa tepi, pohon yang tumbuh di tempat berbeda setiap kali kaki melangkah lebih jauh, dan misi kecil yang tidak pernah kehabisan. Tidak ada unduhan, tidak ada iklan, tidak ada akhir cerita.",
    en: "A meadow that stretches without edges, trees that grow in new places every time you wander farther, and little quests that never run out. No downloads, no ads, no end to the story.",
  },
  play: { id: "Mulai menjelajah", en: "Start exploring" },
  makeAccount: { id: "Buat akun", en: "Create an account" },
  accountTail: {
    id: "supaya level dan tokoh yang terbuka tersimpan, atau",
    en: "so your levels and unlocked characters are saved, or",
  },
  login: { id: "masuk", en: "log in" },
  loginTail: { id: "kalau sudah punya.", en: "if you already have one." },
  scroll: { id: "gulir ke bawah", en: "scroll down" },
  marquee: {
    id: "Dunia tanpa batas peta • Misi baru terus lahir • Aman untuk usia empat tahun ke atas • Jalan pakai keyboard atau sentuhan • Gratis selamanya • ",
    en: "A world with no map edges • New quests always appearing • Safe for ages four and up • Move with keyboard or touch • Free forever • ",
  },
  featuresTitle: {
    id: "Dibuat supaya anak betah, bukan supaya orang tua repot",
    en: "Built to keep kids happy, not to keep parents busy",
  },
  f1t: { id: "Peta yang tidak pernah habis", en: "A map that never ends" },
  f1b: {
    id: "Setiap langkah ke arah baru menumbuhkan bukit, pohon, dan batu yang belum pernah dilihat sebelumnya. Anak boleh berjalan berjam-jam tanpa menabrak dinding tak terlihat.",
    en: "Every step in a new direction grows hills, trees, and rocks never seen before. Kids can walk for hours without ever hitting an invisible wall.",
  },
  f2t: { id: "Misi lahir terus-menerus", en: "Quests appear endlessly" },
  f2b: {
    id: "Selesai mengumpulkan bintang emas, muncul permintaan mencari buah beri. Selesai itu, kristal biru menunggu. Permainan menyusun sendiri tugas berikutnya, jadi tidak ada kata tamat.",
    en: "Finish collecting golden stars and a berry hunt appears. Finish that and blue crystals await. The game writes its own next task, so there is no 'game over'.",
  },
  f3t: { id: "Tanpa hal yang membuat khawatir", en: "Nothing to worry about" },
  f3b: {
    id: "Tidak ada obrolan dengan orang asing, tidak ada pembelian di dalam permainan, tidak ada kejutan menakutkan. Hanya padang cerah dan rasa penasaran.",
    en: "No chatting with strangers, no in-game purchases, no scary surprises. Just a bright meadow and a sense of wonder.",
  },
  howTitle: { id: "Cara mainnya sederhana sekali", en: "Playing is wonderfully simple" },
  s1t: { id: "Buka tautannya", en: "Open the link" },
  s1b: {
    id: "Berjalan di HP, tablet, atau laptop. Tidak perlu memasang apa pun.",
    en: "Runs on a phone, tablet, or laptop. Nothing to install.",
  },
  s2t: { id: "Pilih tokoh", en: "Pick a character" },
  s2b: {
    id: "Anak perempuan atau anak laki-laki, keduanya sama-sama cepat larinya.",
    en: "A girl or a boy explorer — both run just as fast.",
  },
  s3t: { id: "Jalan ke mana saja", en: "Walk anywhere" },
  s3b: {
    id: "Tombol panah, WASD, atau tuas sentuh di pojok layar. Kumpulkan benda berkilau yang diminta di pojok kiri atas.",
    en: "Arrow keys, WASD, or the touch stick in the corner. Collect the shiny things asked for in the top-left.",
  },
  ctaTitle: {
    id: "Sore ini anakmu bisa langsung berpetualang",
    en: "Your child can start adventuring this afternoon",
  },
  ctaBtn: { id: "Buka Meadowfar sekarang", en: "Open Meadowfar now" },
  footer: {
    id: "Meadowfar dibuat dengan geometri asli tanpa aset berhak cipta. Kode terbuka di GitHub.",
    en: "Meadowfar is built from original geometry with no copyrighted assets. Open source on GitHub.",
  },
};

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setShown(true),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

function TiltCard({ title, body }: { title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="h-full rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm transition-transform duration-150 will-change-transform"
    >
      <h3 className="mb-3 text-xl font-semibold text-emerald-900">{title}</h3>
      <p className="leading-relaxed text-emerald-800/80">{body}</p>
    </div>
  );
}

export default function Home() {
  const [scroll, setScroll] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(detectLang()), []);
  const t = (k: keyof typeof T) => pick(lang, T[k].id, T[k].en);

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 text-emerald-950">
      <button
        onClick={() => {
          const next: Lang = lang === "id" ? "en" : "id";
          setLang(next);
          saveLang(next);
        }}
        className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-300 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 backdrop-blur"
      >
        {lang === "id" ? "English" : "Bahasa Indonesia"}
      </button>

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ transform: `translateY(${scroll * 0.25}px)` }}
        >
          <div className="absolute left-[8%] top-[18%] h-40 w-40 animate-float rounded-full bg-sky-300/40 blur-2xl" />
          <div className="absolute right-[12%] top-[30%] h-56 w-56 animate-float-slow rounded-full bg-emerald-300/40 blur-2xl" />
          <div className="absolute bottom-[15%] left-[30%] h-48 w-48 animate-float rounded-full bg-amber-200/50 blur-2xl" />
        </div>
        <Reveal>
          <p className="mb-4 inline-block rounded-full border border-emerald-300 bg-white/70 px-4 py-1 text-sm font-medium tracking-wide text-emerald-700">
            {t("badge")}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">Meadowfar</h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-emerald-800/80">{t("tagline")}</p>
        </Reveal>
        <Reveal delay={360}>
          <Link
            href="/play"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-emerald-600 px-10 py-5 text-xl font-semibold text-white shadow-xl shadow-emerald-600/30 transition hover:scale-105 hover:bg-emerald-500 active:scale-95"
          >
            {t("play")}
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </Reveal>
        <Reveal delay={480}>
          <p className="mt-6 text-sm text-emerald-800/70">
            <Link href="/daftar" className="font-semibold underline">
              {t("makeAccount")}
            </Link>{" "}
            {t("accountTail")}{" "}
            <Link href="/masuk" className="font-semibold underline">
              {t("login")}
            </Link>{" "}
            {t("loginTail")}
          </p>
        </Reveal>
        <div className="absolute bottom-8 animate-bounce text-sm text-emerald-700/60">{t("scroll")}</div>
      </section>

      <div className="overflow-hidden border-y border-emerald-200 bg-white/60 py-4">
        <div className="flex animate-marquee whitespace-nowrap text-lg font-medium text-emerald-700">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="mx-4">
              {t("marquee")}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">{t("featuresTitle")}</h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <TiltCard title={t("f1t")} body={t("f1b")} />
          </Reveal>
          <Reveal delay={120}>
            <TiltCard title={t("f2t")} body={t("f2b")} />
          </Reveal>
          <Reveal delay={240}>
            <TiltCard title={t("f3t")} body={t("f3b")} />
          </Reveal>
        </div>
      </section>

      <section className="bg-emerald-900 py-24 text-emerald-50">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">{t("howTitle")}</h2>
          </Reveal>
          <div className="space-y-8">
            {[
              [t("s1t"), t("s1b")],
              [t("s2t"), t("s2b")],
              [t("s3t"), t("s3b")],
            ].map(([title, body], i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="flex items-start gap-6 rounded-2xl bg-emerald-800/60 p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-emerald-950">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="mt-1 text-emerald-100/70">{body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center px-6 py-28 text-center">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-bold md:text-5xl">{t("ctaTitle")}</h2>
        </Reveal>
        <Reveal delay={150}>
          <Link
            href="/play"
            className="mt-10 inline-block rounded-full bg-amber-400 px-12 py-5 text-xl font-bold text-amber-950 shadow-xl shadow-amber-400/40 transition hover:scale-105 active:scale-95"
          >
            {t("ctaBtn")}
          </Link>
        </Reveal>
        <p className="mt-16 text-sm text-emerald-700/60">{t("footer")}</p>
      </section>
    </main>
  );
}
