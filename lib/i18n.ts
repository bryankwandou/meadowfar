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
} as const;
