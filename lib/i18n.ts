// Tiny bilingual layer. Indonesian is the source language; English for the
// rest of the family. Persisted in localStorage("meadowfar-lang").

export type Lang = "id" | "en";

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("meadowfar-lang");
    if (saved === "id" || saved === "en") return saved;
    return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
  } catch {
    return "en";
  }
}

export function saveLang(l: Lang) {
  try {
    localStorage.setItem("meadowfar-lang", l);
  } catch {}
}

// pick(lang, indonesian, english)
export function pick(l: Lang, id: string, en: string) {
  return l === "id" ? id : en;
}

export const QUEST_NOUN_NAMES: Record<string, { id: string; en: string }> = {
  "bintang emas": { id: "bintang emas", en: "golden stars" },
  "buah beri merah": { id: "buah beri merah", en: "red berries" },
  "kristal biru": { id: "kristal biru", en: "blue crystals" },
  "jamur ungu": { id: "jamur ungu", en: "purple mushrooms" },
  "kunang cahaya": { id: "kunang cahaya", en: "glowing fireflies" },
};

export const UI = {
  loading: { id: "Memuat petualanganmu...", en: "Loading your adventure..." },
  choose: { id: "Pilih penjelajahmu", en: "Choose your explorer" },
  helloUser: {
    id: (u: string, lv: number) => `Halo, ${u}! Level ${lv} — progresmu tersimpan di akun.`,
    en: (u: string, lv: number) => `Hi, ${u}! Level ${lv} — your progress is saved to your account.`,
  },
  guestNote: {
    id: "Bermain sebagai tamu. Progres tersimpan di perangkat ini saja — buat akun agar aman.",
    en: "Playing as a guest. Progress is saved on this device only — create an account to keep it safe.",
  },
  unlockAtLevel: { id: (l: number) => `Terbuka di level ${l}`, en: (l: number) => `Unlocks at level ${l}` },
  register: { id: "Daftar", en: "Sign up" },
  login: { id: "Masuk", en: "Log in" },
  mission: {
    id: (n: number, need: number, noun: string) => `Misi ${n}: kumpulkan ${need} ${noun}`,
    en: (n: number, need: number, noun: string) => `Quest ${n}: collect ${need} ${noun}`,
  },
  collected: { id: "Terkumpul", en: "Collected" },
  scoreLbl: { id: "Skor", en: "Score" },
  bestLbl: { id: "Rekor", en: "Best" },
  storyLbl: {
    id: (c: number, t: number) => `Kisah: bab ${c} / ${t}`,
    en: (c: number, t: number) => `Story: chapter ${c} / ${t}`,
  },
  level: { id: "Level", en: "Level" },
  controls: {
    id: "WASD / panah jalan · Spasi lompat · E bicara",
    en: "WASD / arrows to walk · Space to jump · E to talk",
  },
  sprintHint: { id: "· Shift lari", en: "· Shift to sprint" },
  book: { id: "Buku petualang", en: "Adventure book" },
  music: { id: "Musik", en: "Music" },
  on: { id: "nyala", en: "on" },
  off: { id: "mati", en: "off" },
  talkElder: { id: "Bicara dengan tetua (E)", en: "Talk to the elder (E)" },
  storyHeader: {
    id: (b: number, t: number) => `Kisah bintang — bab ${b} dari ${t}`,
    en: (b: number, t: number) => `The star story — chapter ${b} of ${t}`,
  },
  thanksElder: { id: "Terima kasih, tetua (+50 XP)", en: "Thank you, elder (+50 XP)" },
  later: { id: "Nanti saja", en: "Maybe later" },
  close: { id: "Tutup", en: "Close" },
  bookStats: {
    id: (lv: number, items: number, missions: number, m: number, ch: number, tot: number) =>
      `Level ${lv} · ${items} item · ${missions} misi · ${m} m berjalan · kisah bab ${ch}/${tot}`,
    en: (lv: number, items: number, missions: number, m: number, ch: number, tot: number) =>
      `Level ${lv} · ${items} items · ${missions} quests · ${m} m walked · story chapter ${ch}/${tot}`,
  },
  pets: { id: "Sahabat perjalanan", en: "Travel companions" },
  skills: { id: "Keahlian", en: "Skills" },
  gear: { id: "Perlengkapan", en: "Gear" },
  gearBonus: { id: (b: number) => ` (+${b} skor per item)`, en: (b: number) => ` (+${b} score per item)` },
  achievements: { id: "Prestasi", en: "Achievements" },
  jumpBtn: { id: "Lompat", en: "Jump" },
  missionDone: {
    id: "Misi selesai! Petualangan baru dimulai...",
    en: "Quest complete! A new adventure begins...",
  },
  levelUp: { id: (l: number) => `Naik ke level ${l}!`, en: (l: number) => `Level up! Now level ${l}!` },
  newHero: { id: (n: string) => `Tokoh baru: ${n}`, en: (n: string) => `New character: ${n}` },
  newSkill: { id: (n: string) => `Keahlian baru: ${n}`, en: (n: string) => `New skill: ${n}` },
  newGear: { id: (n: string) => `Perlengkapan baru: ${n}`, en: (n: string) => `New gear: ${n}` },
  newPet: { id: (n: string) => `Sahabat baru mengikutimu: ${n}`, en: (n: string) => `A new friend follows you: ${n}` },
  achievementUnlocked: { id: (n: string) => `Prestasi terbuka: ${n}`, en: (n: string) => `Achievement unlocked: ${n}` },

  // ----- mission types -----
  questKindCollect: { id: "Kumpul", en: "Collect" },
  raceTitle: {
    id: (s: number) => `Balapan! Lewati semua gerbang dalam ${s} detik`,
    en: (s: number) => `Race! Pass every gate within ${s} seconds`,
  },
  raceTimeLeft: { id: (s: number) => `Waktu: ${s} dtk`, en: (s: number) => `Time: ${s}s` },
  raceGates: { id: (a: number, b: number) => `Gerbang ${a}/${b}`, en: (a: number, b: number) => `Gates ${a}/${b}` },
  raceWon: { id: "Balapan menang! Hebat!", en: "Race won! Amazing!" },
  raceLost: { id: "Waktu habis — coba lagi kapan saja!", en: "Time's up — try again anytime!" },
  treasureTitle: {
    id: "Ikuti tanda X — temukan peti harta karun!",
    en: "Follow the X — find the treasure chest!",
  },
  treasureFound: { id: "Peti harta ditemukan! Isinya berkilau!", en: "Treasure chest found! It sparkles!" },
  deliveryTitle: {
    id: "Antar paket ke rumah bertanda di desa",
    en: "Deliver the package to the marked house in the village",
  },
  deliveryDone: { id: "Paket sampai! Terima kasih, kurir!", en: "Package delivered! Thank you, courier!" },
  starShardTitle: {
    id: "Misi tetua: kembalikan pecahan bintang ke desa",
    en: "Elder's quest: return the star shard to the village",
  },
  starShardDone: {
    id: "Pecahan bintang kembali! Langit makin terang.",
    en: "The star shard is home! The sky grows brighter.",
  },
  nextQuest: { id: "Misi berikutnya", en: "Next quest" },
  questTypeBtn: { id: "Ganti jenis misi", en: "Change quest type" },

  // ----- tree house / home -----
  home: { id: "Rumah pohon", en: "Tree house" },
  homeIntro: {
    id: "Rumah pohonmu tumbuh bersamamu. Selesaikan misi untuk membuka hiasan, lalu pasang di sini.",
    en: "Your tree house grows with you. Finish quests to unlock decorations, then place them here.",
  },
  goHome: { id: "Ke rumah pohon", en: "Go to tree house" },
  decorations: { id: "Hiasan", en: "Decorations" },
  place: { id: "Pasang", en: "Place" },
  remove: { id: "Lepas", en: "Remove" },
  locked: { id: "Terkunci", en: "Locked" },
  decorLockedAt: { id: (m: number) => `Buka setelah ${m} misi`, en: (m: number) => `Unlocks after ${m} quests` },
  homePlaced: { id: (n: string) => `${n} terpasang di rumah pohon!`, en: (n: string) => `${n} placed on the tree house!` },

  // ----- leaderboard -----
  leaderboard: { id: "Papan keluarga", en: "Family board" },
  leaderboardSub: {
    id: "Semua penjelajah di keluarga ini. Bukan lomba — setiap petualangan berharga.",
    en: "Every explorer in this family. Not a race — every adventure counts.",
  },
  leaderboardEmpty: { id: "Belum ada penjelajah lain.", en: "No other explorers yet." },
  colExplorer: { id: "Penjelajah", en: "Explorer" },
  colLevel: { id: "Level", en: "Level" },
  colStory: { id: "Kisah", en: "Story" },
  colItems: { id: "Item", en: "Items" },
  you: { id: "kamu", en: "you" },
  backToGame: { id: "Kembali bermain", en: "Back to the game" },
  elderTask: { id: "Permintaan tetua", en: "The elder asks" },

  changeHero: { id: "Ganti tokoh", en: "Change character" },

  // ----- photo mode -----
  photo: { id: "Mode foto", en: "Photo mode" },
  photoHint: {
    id: "Pilih stiker lalu ketuk layar untuk menempelkannya. Tekan tombol kamera bila sudah pas.",
    en: "Pick a sticker, then tap the screen to stick it on. Press the camera button when it looks right.",
  },
  shutter: { id: "Jepret", en: "Snap" },
  clearStickers: { id: "Hapus stiker", en: "Clear stickers" },
  exitPhoto: { id: "Selesai", en: "Done" },
  savePhoto: { id: "Simpan foto", en: "Save photo" },
  retake: { id: "Foto lagi", en: "Take another" },
  photoReady: { id: "Fotomu siap!", en: "Your photo is ready!" },

  // ----- graphics -----
  graphics: { id: "Grafis", en: "Graphics" },
  gfxAuto: { id: "Otomatis", en: "Auto" },
  gfxLow: { id: "Ringan", en: "Smooth" },
  gfxHigh: { id: "Indah", en: "Pretty" },
  gfxNote: {
    id: "Pilih Ringan bila permainan terasa tersendat di perangkat ini.",
    en: "Choose Smooth if the game feels choppy on this device.",
  },
  settings: { id: "Pengaturan", en: "Settings" },

  // ----- parent dashboard -----
  parentTitle: { id: "Dasbor orang tua", en: "Parent dashboard" },
  parentSub: {
    id: "Ringkasan permainan semua anak, dan batas waktu main harian.",
    en: "An overview of every child's play, and their daily play-time limit.",
  },
  parentOnly: {
    id: "Halaman ini hanya untuk akun orang tua.",
    en: "This page is for parent accounts only.",
  },
  colQuests: { id: "Misi", en: "Quests" },
  colLastPlayed: { id: "Terakhir main", en: "Last played" },
  colLimit: { id: "Batas harian", en: "Daily limit" },
  noLimit: { id: "Tanpa batas", en: "No limit" },
  minutes: { id: (m: number) => `${m} menit`, en: (m: number) => `${m} min` },
  saveLimit: { id: "Simpan", en: "Save" },
  saved: { id: "Tersimpan", en: "Saved" },
  restTitle: { id: "Waktunya istirahat", en: "Time for a break" },
  restBody: {
    id: "Kamu sudah bermain cukup lama hari ini. Istirahat dulu ya — padang ini menunggumu besok.",
    en: "You have played for a good while today. Take a rest — the meadow will be here tomorrow.",
  },
  restOk: { id: "Baik!", en: "Okay!" },
} as const;
