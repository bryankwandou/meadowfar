"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/landing/useLang";
import AuthShell, { inputClass, primaryBtn } from "@/components/landing/AuthShell";

const T = {
  title: { id: "Selamat datang kembali", en: "Welcome back" },
  sub: { id: "Lanjutkan petualangan dari titik terakhirmu.", en: "Pick up your adventure right where you left off." },
  user: { id: "Nama pengguna atau email", en: "Username or email" },
  password: { id: "Kata sandi", en: "Password" },
  submit: { id: "Masuk", en: "Log in" },
  checking: { id: "Memeriksa...", en: "Checking..." },
  noAccount: { id: "Belum punya akun?", en: "No account yet?" },
  registerFirst: { id: "Daftar dulu", en: "Sign up first" },
  google: { id: "Masuk dengan Google (segera hadir)", en: "Sign in with Google (coming soon)" },
  connErr: { id: "Tidak bisa terhubung ke server", en: "Could not reach the server" },
  genericErr: { id: "Terjadi kendala, coba lagi", en: "Something went wrong, try again" },
  guest: { id: "Atau main sebagai tamu", en: "Or play as a guest" },
  asideTitle: { id: "Rumah pohonmu sudah menunggu.", en: "Your tree house is waiting." },
  a1: { id: "Level, koin, dan pakaian tetap tersimpan", en: "Levels, coins and outfits are right where you left them" },
  a2: { id: "Main bareng teman lewat kode ruang", en: "Play with friends using a room code" },
  a3: { id: "Kisah 12 bab berlanjut dari bab terakhir", en: "The 12-chapter story continues from your last chapter" },
};

export default function MasukPage() {
  const router = useRouter();
  const [lang, setLang] = useLang();
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

  return (
    <AuthShell lang={lang} setLang={setLang} asideTitle={t("asideTitle")} asidePoints={[t("a1"), t("a2"), t("a3")]}>
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("sub")}</p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <label className="block text-sm font-medium text-ink">
          {t("user")}
          <input
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          {t("password")}
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button disabled={busy} className={primaryBtn}>
          {busy ? t("checking") : t("submit")}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3 text-center text-sm text-ink-soft">
        <p>
          {t("noAccount")}{" "}
          <Link href="/daftar" className="font-semibold text-leaf underline underline-offset-2">
            {t("registerFirst")}
          </Link>
        </p>
        <Link href="/play" className="rounded-xl border border-line bg-paper px-4 py-2.5 font-semibold text-ink transition hover:border-ink/30">
          {t("guest")}
        </Link>
        <button disabled className="cursor-not-allowed rounded-xl border border-line px-4 py-2.5 text-ink-soft/70">
          {t("google")}
        </button>
      </div>
    </AuthShell>
  );
}
