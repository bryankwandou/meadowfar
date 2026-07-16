"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DaftarPage() {
  const router = useRouter();
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
        setError(data.error || "Terjadi kendala, coba lagi");
        return;
      }
      router.push("/play");
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-emerald-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-100 to-emerald-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-emerald-200 bg-white/90 p-8 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-bold text-emerald-950">Buat akun penjelajah</h1>
        <p className="mt-1 text-sm text-emerald-700">
          Progres, level, dan tokoh yang terbuka akan tersimpan di akun ini.
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-emerald-900">
            Nama pengguna
            <input
              className={input}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="contoh: kakaBintang"
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Email
            <input
              className={input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nama@contoh.com"
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Kata sandi
            <input
              className={input}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimal 8 karakter"
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Ulangi kata sandi
            <input
              className={input}
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Ketik ulang kata sandi"
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
              Saya menyetujui{" "}
              <Link href="/syarat" className="font-semibold underline" target="_blank">
                syarat dan ketentuan
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
              Saya menyetujui{" "}
              <Link href="/privasi" className="font-semibold underline" target="_blank">
                kebijakan privasi
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
            {busy ? "Membuat akun..." : "Daftar dan mulai bermain"}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-emerald-700">
          <p>
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-semibold underline">
              Masuk di sini
            </Link>
          </p>
          <button
            disabled
            className="cursor-not-allowed rounded-xl border border-emerald-200 px-4 py-2 text-emerald-400"
            title="Segera hadir"
          >
            Masuk dengan Google — segera hadir
          </button>
        </div>
      </div>
    </main>
  );
}
