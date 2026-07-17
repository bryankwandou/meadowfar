"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { detectLang, saveLang, type Lang } from "@/lib/i18n";

const T = {
  title: { id: "Buat akun penjelajah", en: "Create an explorer account" },
  sub: {
    id: "Progres, level, dan tokoh yang terbuka akan tersimpan di akun ini.",
    en: "Progress, levels, and unlocked characters are saved to this account.",
  },
  username: { id: "Nama pengguna", en: "Username" },
  usernamePh: { id: "contoh: kakaBintang", en: "example: starKid" },
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
  google: { id: "Masuk dengan Google — segera hadir", en: "Sign in with Google — coming soon" },
  connErr: { id: "Tidak bisa terhubung ke server", en: "Could not reach the server" },
  genericErr: { id: "Terjadi kendala, coba lagi", en: "Something went wrong, try again" },
};

export default function DaftarPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => setLang(detectLang()), []);
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
            {t("username")}
            <input
              className={input}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder={t("usernamePh")}
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            {t("email")}
            <input
              className={input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            {t("password")}
            <input
              className={input}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t("passwordPh")}
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            {t("confirm")}
            <input
              className={input}
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder={t("confirmPh")}
              required
            />
          </label>
          <label className="flex items-start gap-3 text-sm text-emerald-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-emerald-600"
              checked={form.agreeTerms}
              onChange={(e) => setForm({ ...form, agreeTerms: e.target.checked })}
            />
            <span>
              {t("agreeTerms")}{" "}
              <Link href="/syarat" className="font-semibold underline" target="_blank">
                {t("terms")}
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-emerald-800">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-emerald-600"
              checked={form.agreePrivacy}
              onChange={(e) => setForm({ ...form, agreePrivacy: e.target.checked })}
            />
            <span>
              {t("agreeTerms")}{" "}
              <Link href="/privasi" className="font-semibold underline" target="_blank">
                {t("privacy")}
              </Link>
            </span>
          </label>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
          <button
            disabled={busy || !form.agreeTerms || !form.agreePrivacy}
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t("submitting") : t("submit")}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-emerald-700">
          <p>
            {t("haveAccount")}{" "}
            <Link href="/masuk" className="font-semibold underline">
              {t("loginHere")}
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
