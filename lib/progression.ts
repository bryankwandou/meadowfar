// Shared progression rules — used by the game client, the API, and the seed script.

export type HeroId = "girl" | "boy" | "knight" | "explorer" | "wizard" | "robot";

export interface HeroDef {
  id: HeroId;
  nama: string;
  level: number; // level needed to unlock
  cloth: number;
  hair: number;
  skin: number;
}

export const HEROES: HeroDef[] = [
  { id: "girl", nama: "Anak perempuan", level: 1, cloth: 0xe0559b, hair: 0x6b3f22, skin: 0xf1c6a0 },
  { id: "boy", nama: "Anak laki-laki", level: 1, cloth: 0x3f7ede, hair: 0x2b2b2b, skin: 0xf1c6a0 },
  { id: "knight", nama: "Satria padang", level: 3, cloth: 0x8a94a6, hair: 0x4a3a2a, skin: 0xf1c6a0 },
  { id: "explorer", nama: "Penjelajah rimba", level: 5, cloth: 0xc98a3b, hair: 0x1f1f1f, skin: 0xd9a06b },
  { id: "wizard", nama: "Penyihir bintang", level: 8, cloth: 0x7b4fd0, hair: 0xe8e8e8, skin: 0xf1c6a0 },
  { id: "robot", nama: "Robot sahabat", level: 12, cloth: 0x58c6c0, hair: 0x9aa0a6, skin: 0xbfc7cf },
];

export interface SkillDef {
  id: string;
  nama: string;
  level: number;
  keterangan: string;
}

export const SKILLS: SkillDef[] = [
  { id: "sprint", nama: "Lari kilat", level: 2, keterangan: "Tahan Shift untuk berlari lebih cepat" },
  { id: "doublejump", nama: "Lompat ganda", level: 4, keterangan: "Tekan lompat sekali lagi di udara" },
  { id: "magnet", nama: "Magnet bintang", level: 6, keterangan: "Item terdekat tertarik sendiri kepadamu" },
  { id: "glide", nama: "Meluncur angin", level: 9, keterangan: "Tahan lompat saat jatuh untuk melayang pelan" },
  { id: "rocket", nama: "Sepatu roket", level: 14, keterangan: "Lompatan jauh lebih tinggi" },
];

export interface ToolDef {
  id: string;
  nama: string;
  level: number;
  bonus: number; // extra score per collected item
}

// Kid-safe gear tiers — progression like weapon upgrades in big games, but friendly.
export const TOOLS: ToolDef[] = [
  { id: "net", nama: "Jaring kupu-kupu", level: 1, bonus: 0 },
  { id: "lantern", nama: "Lentera kunang", level: 3, bonus: 2 },
  { id: "wand", nama: "Tongkat bintang", level: 7, bonus: 5 },
  { id: "kite", nama: "Layang-layang emas", level: 11, bonus: 8 },
  { id: "crown", nama: "Mahkota padang", level: 16, bonus: 12 },
];

export interface AchievementDef {
  id: string;
  nama: string;
  keterangan: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-item", nama: "Temuan pertama", keterangan: "Ambil item pertamamu" },
  { id: "items-25", nama: "Pengumpul rajin", keterangan: "Kumpulkan 25 item" },
  { id: "items-100", nama: "Pemburu harta", keterangan: "Kumpulkan 100 item" },
  { id: "items-500", nama: "Legenda padang", keterangan: "Kumpulkan 500 item" },
  { id: "quest-1", nama: "Misi perdana", keterangan: "Selesaikan misi pertama" },
  { id: "quest-10", nama: "Sepuluh petualangan", keterangan: "Selesaikan 10 misi" },
  { id: "quest-50", nama: "Penjelajah sejati", keterangan: "Selesaikan 50 misi" },
  { id: "jump-100", nama: "Kaki pegas", keterangan: "Melompat 100 kali" },
  { id: "walk-1000", nama: "Seribu langkah", keterangan: "Berjalan sejauh 1.000 meter" },
  { id: "walk-10000", nama: "Pengembara jauh", keterangan: "Berjalan sejauh 10.000 meter" },
  { id: "level-5", nama: "Bintang lima", keterangan: "Capai level 5" },
  { id: "level-10", nama: "Bintang sepuluh", keterangan: "Capai level 10" },
];

export interface Progress {
  xp: number;
  bestScore: number;
  itemsCollected: number;
  missionsDone: number;
  jumps: number;
  distance: number;
  heroes: HeroId[];
  skills: string[];
  tools: string[];
  achievements: string[];
  lastHero: HeroId | null;
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(xp / 60)) + 1);
}
export function xpForLevel(level: number) {
  return (level - 1) * (level - 1) * 60;
}

export function defaultProgress(): Progress {
  return {
    xp: 0,
    bestScore: 0,
    itemsCollected: 0,
    missionsDone: 0,
    jumps: 0,
    distance: 0,
    heroes: ["girl", "boy"],
    skills: [],
    tools: ["net"],
    achievements: [],
    lastHero: null,
  };
}

export function maxProgress(): Progress {
  return {
    xp: xpForLevel(50),
    bestScore: 99990,
    itemsCollected: 9999,
    missionsDone: 999,
    jumps: 9999,
    distance: 999999,
    heroes: HEROES.map((h) => h.id),
    skills: SKILLS.map((s) => s.id),
    tools: TOOLS.map((t) => t.id),
    achievements: ACHIEVEMENTS.map((a) => a.id),
    lastHero: "wizard",
  };
}

// Recompute unlock lists from level so leveling up grants everything due.
export function applyUnlocks(p: Progress): Progress {
  const lv = levelFromXp(p.xp);
  const heroes = new Set(p.heroes);
  HEROES.forEach((h) => lv >= h.level && heroes.add(h.id));
  const skills = new Set(p.skills);
  SKILLS.forEach((s) => lv >= s.level && skills.add(s.id));
  const tools = new Set(p.tools);
  TOOLS.forEach((t) => lv >= t.level && tools.add(t.id));
  return { ...p, heroes: [...heroes], skills: [...skills], tools: [...tools] };
}

export function sanitizeProgress(raw: unknown): Progress {
  const d = defaultProgress();
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Record<string, unknown>;
  const num = (v: unknown, cap: number) =>
    typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(v, cap)) : 0;
  const arr = (v: unknown, allowed: string[]) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && allowed.includes(x))
      : [];
  return applyUnlocks({
    xp: num(r.xp, 10_000_000),
    bestScore: num(r.bestScore, 10_000_000),
    itemsCollected: num(r.itemsCollected, 10_000_000),
    missionsDone: num(r.missionsDone, 1_000_000),
    jumps: num(r.jumps, 10_000_000),
    distance: num(r.distance, 100_000_000),
    heroes: [
      ...new Set([...d.heroes, ...arr(r.heroes, HEROES.map((h) => h.id))]),
    ] as HeroId[],
    skills: arr(r.skills, SKILLS.map((s) => s.id)),
    tools: [...new Set([...d.tools, ...arr(r.tools, TOOLS.map((t) => t.id))])],
    achievements: arr(r.achievements, ACHIEVEMENTS.map((a) => a.id)),
    lastHero:
      typeof r.lastHero === "string" && HEROES.some((h) => h.id === r.lastHero)
        ? (r.lastHero as HeroId)
        : null,
  });
}
