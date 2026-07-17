"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { detectLang, saveLang, type Lang } from "@/lib/i18n";

const T = {
  title: { id: "Masuk kembali", en: "Welcome back" },
  sub: { id: "Lanjutkan petualangan dari titik terakhirmu.", en: "Continue your adventure right where you left off." },
  user: { id: "Nama pengguna atau email", en: "Username or email" },
  password: { id: "Kata sandi", en: "Password" },
  submit: { id: "Masuk", en: "Log in" },
  checking: { id: "Memeriksa...", en: "Checking..." },
  noAccount: { id: "Belum punya akun?", en: "No account yet?" },
  registerFirst: { id: "Daftar dulu", en: "Sign up first" },
  google: { id: "Masuk dengan Google — segera hadir", en: "Sign in with Google — coming soon" },
  connErr: { id: "Tidak bisa terhubung ke server", en: "Could not reach the server" },
  genericErr: { id: "Terjadi kendala, coba lagi", en: "Something went wrong, try again" },
};

export default function MasukPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(detectLang()), []);
  const t = (k: keyof typeof T) => T[k][lang];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("genericErr"));
        return;
      }
      router.push("/play");
    } catch {
      setError(t("connErr"));
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-emerald-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white/90 p-8 shadow-xl backdrop-blur">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-emerald-950">{t("title")}</h1>
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
        <p className="mt-1 text-sm text-emerald-700">{t("sub")}</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-emerald-900">
            {t("user")}
            <input
              className={input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            {t("password")}
            <input
              className={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <button
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? t("checking") : t("submit")}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-emerald-700">
          <p>
            {t("noAccount")}{" "}
            <Link href="/daftar" className="font-semibold underline">
              {t("registerFirst")}
            </Link>
          </p>
          <button
            disabled
            className="cursor-not-allowed rounded-xl border border-emerald-200 px-4 py-2 text-emerald-400"
          >
            {t("google")}
          </button>
        </div>
      </div>
    </main>
  );
}
