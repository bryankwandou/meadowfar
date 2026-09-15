"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/landing/useLang";
import AuthShell, { inputClass, primaryBtn } from "@/components/landing/AuthShell";

const T = {
  title: { id: "Buat akun penjelajah", en: "Create an explorer account" },
  sub: {
    id: "Progres, level, dan tokoh yang terbuka akan tersimpan di akun ini.",
    en: "Progress, levels and unlocked characters are saved to this account.",
  },
  username: { id: "Nama pengguna", en: "Username" },
  usernamePh: { id: "contoh: kakaBintang", en: "for example: starKid" },
  usernameHint: {
    id: "Jangan pakai nama asli lengkap, alamat, atau nomor telepon.",
    en: "Avoid full real names, addresses or phone numbers.",
  },
  email: { id: "Email", en: "Email" },
  password: { id: "Kata sandi", en: "Password" },
  passwordPh: { id: "Minimal 8 karakter", en: "At least 8 characters" },
  confirm: { id: "Ulangi kata sandi", en: "Repeat password" },
  confirmPh: { id: "Ketik ulang kata sandi", en: "Type the password again" },
  agreeTerms: { id: "Saya menyetujui", en: "I agree to the" },
  terms: { id: "syarat dan ketentuan", en: "terms and conditions" },
  privacy: { id: "kebijakan privasi", en: "privacy policy" },
  submit: { id: "Daftar dan mulai bermain", en: "Sign up and start playing" },
  submitting: { id: "Membuat akun...", en: "Creating account..." },
  haveAccount: { id: "Sudah punya akun?", en: "Already have an account?" },
  loginHere: { id: "Masuk di sini", en: "Log in here" },
  google: { id: "Masuk dengan Google (segera hadir)", en: "Sign in with Google (coming soon)" },
  connErr: { id: "Tidak bisa terhubung ke server", en: "Could not reach the server" },
  genericErr: { id: "Terjadi kendala, coba lagi", en: "Something went wrong, try again" },
  asideTitle: { id: "Satu akun, semua petualangan tersimpan.", en: "One account, every adventure kept safe." },
  a1: { id: "Progres ikut ke perangkat mana pun", en: "Progress follows you to any device" },
  a2: { id: "Papan keluarga tanpa peringkat", en: "A family board with no rankings" },
  a3: { id: "Dasbor orang tua dengan batas waktu main", en: "A parent dashboard with play-time limits" },
  a4: { id: "Tanpa iklan dan tanpa pembelian uang sungguhan", en: "No ads and no real-money purchases" },
};

export default function DaftarPage() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const t = (k: keyof typeof T) => T[k][lang];

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    agreeTerms: false,
    agreePrivacy: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  const label = "block text-sm font-medium text-ink";
  const check = "mt-0.5 h-5 w-5 shrink-0 rounded accent-[#0f8a5f]";

  return (
    <AuthShell
      lang={lang}
      setLang={setLang}
      asideTitle={t("asideTitle")}
      asidePoints={[t("a1"), t("a2"), t("a3"), t("a4")]}
    >
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("sub")}</p>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <label className={label}>
          {t("username")}
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder={t("usernamePh")}
            autoComplete="username"
            aria-describedby="username-hint"
            required
          />
          <span id="username-hint" className="mt-1.5 block text-xs font-normal text-ink-soft">
            {t("usernameHint")}
          </span>
        </label>
        <label className={label}>
          {t("email")}
          <input
            className={inputClass}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={label}>
            {t("password")}
            <input
              className={inputClass}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t("passwordPh")}
              autoComplete="new-password"
              required
            />
          </label>
          <label className={label}>
            {t("confirm")}
            <input
              className={inputClass}
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder={t("confirmPh")}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
        <div className="space-y-3 rounded-2xl border border-line bg-paper p-4">
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className={check}
              checked={form.agreeTerms}
              onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
            />
            <span>
              {t("agreeTerms")}{" "}
              <Link href="/syarat" className="font-semibold text-leaf underline underline-offset-2" target="_blank">
                {t("terms")}
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className={check}
              checked={form.agreePrivacy}
              onChange={(e) => setForm({ ...form, agreePrivacy: e.target.checked })}
            />
            <span>
              {t("agreeTerms")}{" "}
              <Link href="/privasi" className="font-semibold text-leaf underline underline-offset-2" target="_blank">
                {t("privacy")}
              </Link>
            </span>
          </label>
        </div>
        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <button disabled={busy || !form.agreeTerms || !form.agreePrivacy} className={primaryBtn}>
          {busy ? t("submitting") : t("submit")}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3 text-center text-sm text-ink-soft">
        <p>
          {t("haveAccount")}{" "}
          <Link href="/masuk" className="font-semibold text-leaf underline underline-offset-2">
            {t("loginHere")}
          </Link>
        </p>
        <button disabled className="cursor-not-allowed rounded-xl border border-line px-4 py-2.5 text-ink-soft/70">
          {t("google")}
        </button>
      </div>
    </AuthShell>
  );
}
