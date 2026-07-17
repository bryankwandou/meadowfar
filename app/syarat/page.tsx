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
      <hr className="mt-10 border-emerald-200" />
      <h1 className="mt-10 text-3xl font-bold">Terms and conditions</h1>
      <p className="mt-2 text-sm text-emerald-700">Effective since July 15, 2026</p>
      <ol className="mt-8 list-decimal space-y-4 pl-5 leading-relaxed">
        <li>
          Meadowfar is a free game for children. There are no ads, no in-game
          purchases, and no chat between players.
        </li>
        <li>
          Accounts exist only to save play progress: levels, scores,
          characters, and achievements. One person may create one account for
          each child in their family.
        </li>
        <li>
          Children under 13 should be registered by, or together with, a
          parent or guardian.
        </li>
        <li>
          Usernames must not be rude, offensive, or contain personal details
          such as a home address or phone number.
        </li>
        <li>
          We may close accounts that break the rules above. You may also ask
          for your account to be deleted at any time.
        </li>
        <li>
          The game is provided as is. We work to keep it running, but we do
          not promise an uninterrupted service.
        </li>
      </ol>
      <Link href="/daftar" className="mt-10 inline-block font-semibold text-emerald-700 underline">
        Kembali ke pendaftaran / Back to sign-up
      </Link>
    </main>
  );
}
