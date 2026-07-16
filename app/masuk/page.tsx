"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MasukPage() {
  const router = useRouter();
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
        <h1 className="text-2xl font-bold text-emerald-950">Masuk kembali</h1>
        <p className="mt-1 text-sm text-emerald-700">
          Lanjutkan petualangan dari titik terakhirmu.
        </p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-emerald-900">
            Nama pengguna atau email
            <input
              className={input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-medium text-emerald-900">
            Kata sandi
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
            {busy ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center text-sm text-emerald-700">
          <p>
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-semibold underline">
              Daftar dulu
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
