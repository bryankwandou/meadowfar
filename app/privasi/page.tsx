import LegalDoc, { type LegalContent } from "@/components/landing/LegalDoc";
import type { Lang } from "@/lib/i18n";

export const metadata = { title: "Privacy policy | Meadowfar" };

const DOC: Record<Lang, LegalContent> = {
  en: {
    kicker: "Legal",
    title: "Privacy policy",
    updated: "Last updated September 2026. First published July 15, 2026.",
    intro:
      "Meadowfar is made for children, so we collect as little as possible and explain it in plain words.",
    sections: [
      {
        h: "What we store",
        p: "Only three things: a username, an email address, and play-progress data (level, score, characters, outfits, coins and achievements). Passwords are stored as one-way hashes, so nobody can read them, including us.",
      },
      {
        h: "Playing together",
        p: "Shared rooms are peer-to-peer: devices connect directly using WebRTC. While you are in a room, your device shares only your avatar's position, outfit and the emotes you choose, and only with people who have your 6-character room code. There is no text chat.",
      },
      {
        h: "Devnet test purchases",
        p: "Parent accounts can optionally try a purchase on the Solana devnet. Devnet is a test network and its tokens have no monetary value. Children never need a wallet.",
      },
      {
        h: "What we never do",
        p: "We do not sell or share data with anyone, show ads, track location, or collect anything beyond what is listed above.",
      },
      {
        h: "Where data lives",
        p: "Data is stored in a managed database (Neon Postgres) over encrypted connections. Guest progress stays in the browser on that device.",
      },
      {
        h: "Your rights",
        p: "Parents or account owners can ask for a copy of their data, or for it to be deleted, at any time through the contact page in the project repository.",
      },
    ],
    back: "Back to sign-up",
  },
  id: {
    kicker: "Legal",
    title: "Kebijakan privasi",
    updated: "Diperbarui September 2026. Pertama terbit 15 Juli 2026.",
    intro:
      "Meadowfar dibuat untuk anak-anak, jadi kami mengumpulkan sesedikit mungkin dan menjelaskannya dengan bahasa sederhana.",
    sections: [
      {
        h: "Apa yang kami simpan",
        p: "Hanya tiga hal: nama pengguna, alamat email, dan data kemajuan bermain (level, skor, tokoh, pakaian, koin, dan prestasi). Kata sandi disimpan dalam bentuk acak satu arah (hash) sehingga tidak ada yang bisa membacanya, termasuk kami.",
      },
      {
        h: "Bermain bersama",
        p: "Ruang bermain bersama bersifat peer-to-peer: perangkat terhubung langsung lewat WebRTC. Selama berada di ruang, perangkatmu hanya membagikan posisi avatar, pakaian, dan emote yang kamu pilih, dan hanya kepada orang yang memegang kode ruang 6 karakter milikmu. Tidak ada obrolan teks.",
      },
      {
        h: "Pembelian uji devnet",
        p: "Akun orang tua boleh mencoba pembelian di Solana devnet. Devnet adalah jaringan uji dan tokennya tidak punya nilai uang. Anak tidak pernah perlu dompet.",
      },
      {
        h: "Apa yang tidak kami lakukan",
        p: "Kami tidak menjual atau membagikan data ke pihak lain, tidak memasang iklan, tidak melacak lokasi, dan tidak mengumpulkan data apa pun di luar yang disebut di atas.",
      },
      {
        h: "Di mana data disimpan",
        p: "Data tersimpan di basis data terkelola (Neon Postgres) dengan koneksi terenkripsi. Progres tamu tetap berada di peramban pada perangkat itu.",
      },
      {
        h: "Hak kamu",
        p: "Orang tua atau pemilik akun dapat meminta salinan atau penghapusan data kapan saja melalui halaman kontak di repositori proyek.",
      },
    ],
    back: "Kembali ke pendaftaran",
  },
};

export default function PrivasiPage() {
  return <LegalDoc doc={DOC} />;
}
