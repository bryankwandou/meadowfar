import Link from "next/link";

export const metadata = { title: "Kebijakan privasi — Meadowfar" };

export default function PrivasiPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-emerald-950">
      <h1 className="text-3xl font-bold">Kebijakan privasi</h1>
      <p className="mt-2 text-sm text-emerald-700">Berlaku sejak 15 Juli 2026</p>
      <div className="mt-8 space-y-6 leading-relaxed">
        <section>
          <h2 className="font-semibold">Apa yang kami simpan</h2>
          <p>
            Hanya tiga hal: nama pengguna, alamat email, dan data kemajuan
            bermain (level, skor, tokoh, pencapaian). Kata sandi disimpan dalam
            bentuk acak satu arah (hash) sehingga tidak ada yang bisa
            membacanya, termasuk kami.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Apa yang tidak kami lakukan</h2>
          <p>
            Kami tidak menjual atau membagikan data ke pihak lain, tidak
            memasang iklan, tidak melacak lokasi, dan tidak mengumpulkan data
            apa pun di luar yang disebut di atas.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Di mana data disimpan</h2>
          <p>
            Data tersimpan di basis data terkelola (Neon Postgres) dengan
            koneksi terenkripsi.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Hak kamu</h2>
          <p>
            Orang tua atau pemilik akun dapat meminta salinan atau penghapusan
            data kapan saja melalui halaman kontak di repositori proyek.
          </p>
        </section>
      </div>
      <Link href="/daftar" className="mt-10 inline-block font-semibold text-emerald-700 underline">
        Kembali ke pendaftaran
      </Link>
    </main>
  );
}
