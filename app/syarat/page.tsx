import Link from "next/link";

export const metadata = { title: "Syarat dan ketentuan — Meadowfar" };

export default function SyaratPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-emerald-950">
      <h1 className="text-3xl font-bold">Syarat dan ketentuan</h1>
      <p className="mt-2 text-sm text-emerald-700">Berlaku sejak 15 Juli 2026</p>
      <ol className="mt-8 list-decimal space-y-4 pl-5 leading-relaxed">
        <li>
          Meadowfar adalah permainan gratis untuk anak-anak. Tidak ada iklan,
          tidak ada pembelian di dalam permainan, dan tidak ada fitur obrolan
          antar pemain.
        </li>
        <li>
          Akun dipakai hanya untuk menyimpan kemajuan bermain: level, skor,
          tokoh, dan pencapaian. Satu orang boleh membuat satu akun untuk tiap
          anak dalam keluarganya.
        </li>
        <li>
          Pendaftaran anak di bawah 13 tahun sebaiknya dilakukan atau
          didampingi orang tua atau wali.
        </li>
        <li>
          Dilarang memakai nama pengguna yang kasar, menyinggung, atau memuat
          data pribadi seperti alamat rumah atau nomor telepon.
        </li>
        <li>
          Kami dapat menutup akun yang melanggar aturan di atas. Kamu juga
          boleh meminta akunmu dihapus kapan saja.
        </li>
        <li>
          Permainan disediakan apa adanya. Kami berusaha menjaganya tetap
          berjalan, tetapi tidak menjanjikan layanan bebas gangguan.
        </li>
      </ol>
      <Link href="/daftar" className="mt-10 inline-block font-semibold text-emerald-700 underline">
        Kembali ke pendaftaran
      </Link>
    </main>
  );
}
