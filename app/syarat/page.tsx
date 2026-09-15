import LegalDoc, { type LegalContent } from "@/components/landing/LegalDoc";
import type { Lang } from "@/lib/i18n";

export const metadata = { title: "Terms and conditions | Meadowfar" };

const DOC: Record<Lang, LegalContent> = {
  en: {
    kicker: "Legal",
    title: "Terms and conditions",
    updated: "Last updated September 2026. First published July 15, 2026.",
    intro: "The short version: be kind, keep personal details private, and have fun.",
    sections: [
      {
        h: "A free game for children",
        p: "Meadowfar is free. There are no ads, no real-money purchases and no loot boxes. Coins used in the shop are earned by playing.",
      },
      {
        h: "Accounts",
        p: "Accounts exist only to save play progress: levels, scores, characters, outfits and achievements. One person may create one account for each child in their family.",
      },
      {
        h: "Children under 13",
        p: "Children under 13 should be registered by, or together with, a parent or guardian.",
      },
      {
        h: "Playing together",
        p: "Shared rooms are private and peer-to-peer. Only people with the 6-character room code can join, and they see only your avatar's position, outfit and emotes. There is no text chat. Share room codes only with people you know.",
      },
      {
        h: "Devnet test purchases",
        p: "Parent accounts may try a test purchase on the Solana devnet. Devnet tokens are test tokens with no monetary value and cannot be exchanged for money. This feature is for parents only; children never need a wallet.",
      },
      {
        h: "Usernames",
        p: "Usernames must not be rude, offensive, or contain personal details such as a home address or phone number.",
      },
      {
        h: "Closing accounts",
        p: "We may close accounts that break the rules above. You may also ask for your account to be deleted at any time.",
      },
      {
        h: "No guarantees",
        p: "The game is provided as is. We work to keep it running, but we cannot promise an uninterrupted service.",
      },
    ],
    back: "Back to sign-up",
  },
  id: {
    kicker: "Legal",
    title: "Syarat dan ketentuan",
    updated: "Diperbarui September 2026. Pertama terbit 15 Juli 2026.",
    intro: "Versi singkatnya: bersikap baik, jaga data pribadi, dan bersenang-senanglah.",
    sections: [
      {
        h: "Permainan gratis untuk anak",
        p: "Meadowfar gratis. Tidak ada iklan, tidak ada pembelian dengan uang sungguhan, dan tidak ada loot box. Koin untuk toko didapat dari bermain.",
      },
      {
        h: "Akun",
        p: "Akun dipakai hanya untuk menyimpan kemajuan bermain: level, skor, tokoh, pakaian, dan prestasi. Satu orang boleh membuat satu akun untuk tiap anak dalam keluarganya.",
      },
      {
        h: "Anak di bawah 13 tahun",
        p: "Pendaftaran anak di bawah 13 tahun sebaiknya dilakukan atau didampingi orang tua atau wali.",
      },
      {
        h: "Bermain bersama",
        p: "Ruang bermain bersama bersifat privat dan peer-to-peer. Hanya pemegang kode ruang 6 karakter yang bisa bergabung, dan mereka hanya melihat posisi avatar, pakaian, dan emote kamu. Tidak ada obrolan teks. Bagikan kode ruang hanya kepada orang yang kamu kenal.",
      },
      {
        h: "Pembelian uji devnet",
        p: "Akun orang tua boleh mencoba pembelian uji di Solana devnet. Token devnet adalah token uji tanpa nilai uang dan tidak bisa ditukar dengan uang. Fitur ini khusus orang tua; anak tidak pernah perlu dompet.",
      },
      {
        h: "Nama pengguna",
        p: "Dilarang memakai nama pengguna yang kasar, menyinggung, atau memuat data pribadi seperti alamat rumah atau nomor telepon.",
      },
      {
        h: "Penutupan akun",
        p: "Kami dapat menutup akun yang melanggar aturan di atas. Kamu juga boleh meminta akunmu dihapus kapan saja.",
      },
      {
        h: "Tanpa jaminan",
        p: "Permainan disediakan apa adanya. Kami berusaha menjaganya tetap berjalan, tetapi tidak bisa menjanjikan layanan bebas gangguan.",
      },
    ],
    back: "Kembali ke pendaftaran",
  },
};

export default function SyaratPage() {
  return <LegalDoc doc={DOC} />;
}
