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
      <hr className="mt-10 border-emerald-200" />
      <h1 className="mt-10 text-3xl font-bold">Privacy policy</h1>
      <p className="mt-2 text-sm text-emerald-700">Effective since July 15, 2026</p>
      <div className="mt-8 space-y-6 leading-relaxed">
        <section>
          <h2 className="font-semibold">What we store</h2>
          <p>
            Only three things: a username, an email address, and play-progress
            data (level, score, characters, achievements). Passwords are stored
            as one-way hashes, so nobody can read them — including us.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">What we never do</h2>
          <p>
            We do not sell or share data with anyone, show ads, track location,
            or collect anything beyond what is listed above.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Where data lives</h2>
          <p>
            Data is stored in a managed database (Neon Postgres) over encrypted
            connections.
          </p>
        </section>
        <section>
          <h2 className="font-semibold">Your rights</h2>
          <p>
            Parents or account owners can request a copy or deletion of their
            data at any time through the project repository&apos;s contact page.
          </p>
        </section>
      </div>
      <Link href="/daftar" className="mt-10 inline-block font-semibold text-emerald-700 underline">
        Kembali ke pendaftaran / Back to sign-up
      </Link>
    </main>
  );
}
