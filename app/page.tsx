"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { detectLang, saveLang, pick, type Lang } from "@/lib/i18n";

const T = {
  badge: {
    id: "Dunia terbuka 3D untuk anak, langsung dari peramban",
    en: "A 3D open world for kids, straight from the browser",
  },
  tagline: {
    id: "Padang rumput tanpa tepi, hutan, gurun, salju, dan danau yang berkilau. Misi kecil yang tak pernah habis, kisah 12 bab, dan tokoh yang tumbuh bersama pemainnya. Tanpa unduhan, tanpa iklan, tanpa kekerasan.",
    en: "Endless meadows, forests, deserts, snow, and shimmering lakes. Little quests that never run out, a 12-chapter story, and characters that grow with the player. No downloads, no ads, no violence.",
  },
  play: { id: "Main sekarang — gratis", en: "Play now — free" },
  makeAccount: { id: "Buat akun", en: "Create an account" },
  accountTail: {
    id: "supaya progres tersimpan, atau",
    en: "so progress is saved, or",
  },
  login: { id: "masuk", en: "log in" },
  loginTail: { id: "kalau sudah punya.", en: "if you already have one." },
  scroll: { id: "gulir ke bawah", en: "scroll down" },

  // ----- statement / manifesto -----
  stmtKicker: { id: "Pernyataan kami", en: "Our statement" },
  stmtBody: {
    id: "Kami percaya anak berhak atas ruang bermain digital yang tenang dan aman — bukan tempat penuh iklan, tekanan bersaing, atau kejutan menakutkan. Meadowfar dibangun sebagai dunia 3D sungguhan yang bisa dipercaya orang tua dan disukai anak: satu klik untuk mulai, mustahil untuk kalah, dan selalu ada hal baru untuk ditemukan.",
    en: "We believe children deserve a calm, safe digital place to play — not one filled with ads, competitive pressure, or scary surprises. Meadowfar is built as a real 3D world that parents can trust and kids love: one click to start, impossible to lose, and always something new to discover.",
  },

  // ----- world stats -----
  statsTitle: { id: "Sebuah dunia, bukan sekadar level", en: "A whole world, not just levels" },
  stBiomes: { id: "Biome untuk dijelajahi", en: "Biomes to explore" },
  stQuestTypes: { id: "Jenis misi bergilir", en: "Rotating quest types" },
  stChapters: { id: "Bab kisah dua bahasa", en: "Bilingual story chapters" },
  stChars: { id: "Tokoh yang bisa dibuka", en: "Unlockable characters" },
  stAch: { id: "Prestasi terukur", en: "Measured achievements" },
  stCost: { id: "Biaya, selamanya", en: "Cost, forever" },

  featuresTitle: {
    id: "Dibuat supaya anak betah, orang tua tenang",
    en: "Built so kids stay happy and parents stay calm",
  },
  f1t: { id: "Peta yang tidak pernah habis", en: "A map that never ends" },
  f1b: {
    id: "Dunia prosedural tumbuh mengikuti langkah anak — bukit, pohon, dan danau baru muncul terus. Berjam-jam menjelajah tanpa menabrak dinding tak terlihat.",
    en: "A procedural world grows as kids walk — new hills, trees, and lakes keep appearing. Hours of exploring without ever hitting an invisible wall.",
  },
  f2t: { id: "Mustahil kalah", en: "Impossible to lose" },
  f2b: {
    id: "Balapan tanpa hukuman, misi yang selalu lahir baru, dan papan keluarga tanpa peringkat. Tidak ada 'game over', tidak ada anak yang dipermalukan.",
    en: "Pressure-free races, quests that always renew, and a family board with no rankings. No 'game over', and no child is ever shamed.",
  },
  f3t: { id: "Grafik 3D sungguhan", en: "Real 3D graphics" },
  f3b: {
    id: "Siklus siang-malam, bayangan dinamis, tone mapping filmic, rumput bergoyang, air beriak, dan mode grafis otomatis agar tetap mulus di laptop sekolah.",
    en: "Day–night cycle, dynamic shadows, filmic tone mapping, waving grass, rippling water, and auto graphics quality to stay smooth on school laptops.",
  },

  // ----- safety / parents -----
  safeTitle: { id: "Aman sejak dirancang", en: "Safe by design" },
  safeSub: {
    id: "Setiap keputusan desain dibuat dengan orang tua di ruangan.",
    en: "Every design decision was made with a parent in the room.",
  },
  safe1: { id: "Tanpa kekerasan & tanpa konten menakutkan", en: "No violence, no scary content" },
  safe2: { id: "Tanpa iklan & tanpa pembelian dalam game", en: "No ads, no in-game purchases" },
  safe3: { id: "Tanpa obrolan dengan orang asing (single-player)", en: "No chat with strangers (single-player)" },
  safe4: { id: "Papan keluarga tanpa peringkat", en: "Family board with no rankings" },
  safe5: { id: "Dasbor orang tua + batas waktu main harian", en: "Parent dashboard + daily play-time limit" },
  safe6: { id: "Pengingat istirahat yang lembut, bukan mengunci", en: "Gentle break reminders, never a lockout" },
  safe7: { id: "Dua bahasa penuh (Indonesia & Inggris)", en: "Fully bilingual (Indonesian & English)" },
  safe8: { id: "Menghormati mode 'kurangi gerak'", en: "Respects 'reduce motion' settings" },

  howTitle: { id: "Cara mainnya sederhana sekali", en: "Playing is wonderfully simple" },
  s1t: { id: "Buka tautannya", en: "Open the link" },
  s1b: {
    id: "Berjalan di HP, tablet, atau laptop. Tidak perlu memasang apa pun.",
    en: "Runs on a phone, tablet, or laptop. Nothing to install.",
  },
  s2t: { id: "Pilih tokoh", en: "Pick a character" },
  s2b: {
    id: "Enam tokoh terbuka seiring naik level, masing-masing dengan aksesori sendiri.",
    en: "Six characters unlock as you level up, each with their own accessory.",
  },
  s3t: { id: "Jalan ke mana saja", en: "Walk anywhere" },
  s3b: {
    id: "Panah, WASD, atau tuas sentuh. Kumpulkan benda berkilau yang diminta di pojok layar.",
    en: "Arrows, WASD, or the touch stick. Collect the shiny things shown in the corner.",
  },

  ctaTitle: {
    id: "Sore ini anakmu bisa langsung berpetualang",
    en: "Your child can start adventuring this afternoon",
  },
  ctaBtn: { id: "Buka Meadowfar sekarang", en: "Open Meadowfar now" },
  studio: {
    id: "Dibuat oleh nayrbryanGaming di Makassar, Indonesia. Geometri asli, tanpa aset berhak cipta. Kode terbuka di GitHub.",
    en: "Made by nayrbryanGaming in Makassar, Indonesia. Original geometry, no copyrighted assets. Open source on GitHub.",
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
      { threshold: 0.15 }
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
    el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
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

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white/70 px-4 py-6 text-center backdrop-blur">
      <div className="text-4xl font-black tabular-nums text-emerald-700 md:text-5xl">{n}</div>
      <div className="mt-2 text-sm font-medium text-emerald-800/70">{label}</div>
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

  const safety = [
    t("safe1"), t("safe2"), t("safe3"), t("safe4"),
    t("safe5"), t("safe6"), t("safe7"), t("safe8"),
  ];

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

      {/* ---------------- hero ---------------- */}
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
          <h1 className="max-w-3xl text-6xl font-black leading-tight tracking-tight md:text-8xl">Meadowfar</h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-emerald-800/80">{t("tagline")}</p>
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

      {/* ---------------- statement / manifesto ---------------- */}
      <section className="border-y border-emerald-200 bg-white/60 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
              {t("stmtKicker")}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-balance text-2xl font-medium leading-relaxed text-emerald-900 md:text-3xl">
              {t("stmtBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- world stats ---------------- */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">{t("statsTitle")}</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Reveal delay={0}><Stat n="6" label={t("stBiomes")} /></Reveal>
          <Reveal delay={60}><Stat n="5" label={t("stQuestTypes")} /></Reveal>
          <Reveal delay={120}><Stat n="12" label={t("stChapters")} /></Reveal>
          <Reveal delay={180}><Stat n="6" label={t("stChars")} /></Reveal>
          <Reveal delay={240}><Stat n="24" label={t("stAch")} /></Reveal>
          <Reveal delay={300}><Stat n="Rp0" label={t("stCost")} /></Reveal>
        </div>
      </section>

      {/* ---------------- features ---------------- */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
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

      {/* ---------------- safety / parents ---------------- */}
      <section className="bg-emerald-900 py-24 text-emerald-50">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal>
            <h2 className="text-center text-3xl font-bold md:text-4xl">{t("safeTitle")}</h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-3 max-w-2xl text-center text-emerald-100/70">{t("safeSub")}</p>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {safety.map((s, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="flex items-center gap-4 rounded-2xl bg-emerald-800/60 p-5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-base font-bold text-emerald-950">
                    ✓
                  </span>
                  <span className="text-emerald-50/90">{s}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- how to play ---------------- */}
      <section className="mx-auto max-w-4xl px-6 py-24">
        <Reveal>
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">{t("howTitle")}</h2>
        </Reveal>
        <div className="space-y-6">
          {[
            [t("s1t"), t("s1b")],
            [t("s2t"), t("s2b")],
            [t("s3t"), t("s3b")],
          ].map(([title, body], i) => (
            <Reveal key={i} delay={i * 120}>
              <div className="flex items-start gap-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-emerald-900">{title}</h3>
                  <p className="mt-1 text-emerald-800/70">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- final CTA ---------------- */}
      <section className="flex flex-col items-center px-6 py-28 text-center">
        <Reveal>
          <h2 className="max-w-2xl text-balance text-3xl font-bold md:text-5xl">{t("ctaTitle")}</h2>
        </Reveal>
        <Reveal delay={150}>
          <Link
            href="/play"
            className="mt-10 inline-block rounded-full bg-amber-400 px-12 py-5 text-xl font-bold text-amber-950 shadow-xl shadow-amber-400/40 transition hover:scale-105 active:scale-95"
          >
            {t("ctaBtn")}
          </Link>
        </Reveal>
        <p className="mt-16 max-w-xl text-sm text-emerald-700/60">{t("studio")}</p>
      </section>
    </main>
  );
}
