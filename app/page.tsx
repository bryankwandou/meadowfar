"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
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
    el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${
      -y * 10
    }deg) translateY(-4px)`;
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
  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-amber-50 text-emerald-950">
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
            Dunia terbuka untuk anak, langsung dari peramban
          </p>
        </Reveal>
        <Reveal delay={120}>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
            Meadowfar
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-emerald-800/80">
            Padang rumput yang membentang tanpa tepi, pohon yang tumbuh di
            tempat berbeda setiap kali kaki melangkah lebih jauh, dan misi
            kecil yang tidak pernah kehabisan. Tidak ada unduhan, tidak ada
            iklan, tidak ada akhir cerita.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <Link
            href="/play"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-emerald-600 px-10 py-5 text-xl font-semibold text-white shadow-xl shadow-emerald-600/30 transition hover:scale-105 hover:bg-emerald-500 active:scale-95"
          >
            Mulai menjelajah
            <span className="transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </Reveal>
        <div className="absolute bottom-8 animate-bounce text-sm text-emerald-700/60">
          gulir ke bawah
        </div>
      </section>

      <div className="overflow-hidden border-y border-emerald-200 bg-white/60 py-4">
        <div className="flex animate-marquee whitespace-nowrap text-lg font-medium text-emerald-700">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="mx-4">
              Dunia tanpa batas peta &bull; Misi baru terus lahir &bull; Aman
              untuk usia empat tahun ke atas &bull; Jalan pakai keyboard atau
              sentuhan &bull; Gratis selamanya &bull;
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <Reveal>
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Dibuat supaya anak betah, bukan supaya orang tua repot
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal delay={0}>
            <TiltCard
              title="Peta yang tidak pernah habis"
              body="Setiap langkah ke arah baru menumbuhkan bukit, pohon, dan batu yang belum pernah dilihat sebelumnya. Anak boleh berjalan berjam-jam tanpa menabrak dinding tak terlihat."
            />
          </Reveal>
          <Reveal delay={120}>
            <TiltCard
              title="Misi lahir terus-menerus"
              body="Selesai mengumpulkan bintang emas, muncul permintaan mencari buah beri. Selesai itu, kristal biru menunggu. Permainan menyusun sendiri tugas berikutnya, jadi tidak ada kata tamat."
            />
          </Reveal>
          <Reveal delay={240}>
            <TiltCard
              title="Tanpa hal yang membuat khawatir"
              body="Tidak ada obrolan dengan orang asing, tidak ada pembelian di dalam permainan, tidak ada kejutan menakutkan. Hanya padang cerah dan rasa penasaran."
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-emerald-900 py-24 text-emerald-50">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
              Cara mainnya sederhana sekali
            </h2>
          </Reveal>
          <div className="space-y-8">
            {[
              [
                "Buka tautannya",
                "Berjalan di HP, tablet, atau laptop. Tidak perlu memasang apa pun.",
              ],
              [
                "Pilih tokoh",
                "Anak perempuan atau anak laki-laki, keduanya sama-sama cepat larinya.",
              ],
              [
                "Jalan ke mana saja",
                "Tombol panah, WASD, atau tuas sentuh di pojok layar. Kumpulkan benda berkilau yang diminta di pojok kiri atas.",
              ],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 120}>
                <div className="flex items-start gap-6 rounded-2xl bg-emerald-800/60 p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-400 text-lg font-bold text-emerald-950">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{t}</h3>
                    <p className="mt-1 text-emerald-100/70">{b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center px-6 py-28 text-center">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-bold md:text-5xl">
            Sore ini anakmu bisa langsung berpetualang
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <Link
            href="/play"
            className="mt-10 inline-block rounded-full bg-amber-400 px-12 py-5 text-xl font-bold text-amber-950 shadow-xl shadow-amber-400/40 transition hover:scale-105 active:scale-95"
          >
            Buka Meadowfar sekarang
          </Link>
        </Reveal>
        <p className="mt-16 text-sm text-emerald-700/60">
          Meadowfar dibuat dengan geometri asli tanpa aset berhak cipta. Kode
          terbuka di GitHub.
        </p>
      </section>
    </main>
  );
}
