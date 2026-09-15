// Shared progression rules — used by the game client, the API, and the seed script.

import {
  COSMETICS,
  DEFAULT_EQUIP,
  DEVNET_COSMETICS,
  ITEMS,
  SLOTS,
  STARTER_COSMETICS,
  type Slot,
} from "@/lib/catalog";

export type HeroId = "girl" | "boy" | "knight" | "explorer" | "wizard" | "robot";

export interface HeroDef {
  id: HeroId;
  nama: string;
  namaEn: string;
  level: number; // level needed to unlock
  cloth: number;
  hair: number;
  skin: number;
}

export const HEROES: HeroDef[] = [
  { id: "girl", nama: "Anak perempuan", namaEn: "Girl explorer", level: 1, cloth: 0xe0559b, hair: 0x6b3f22, skin: 0xf1c6a0 },
  { id: "boy", nama: "Anak laki-laki", namaEn: "Boy explorer", level: 1, cloth: 0x3f7ede, hair: 0x2b2b2b, skin: 0xf1c6a0 },
  { id: "knight", nama: "Satria padang", namaEn: "Meadow knight", level: 3, cloth: 0x8a94a6, hair: 0x4a3a2a, skin: 0xf1c6a0 },
  { id: "explorer", nama: "Penjelajah rimba", namaEn: "Jungle ranger", level: 5, cloth: 0xc98a3b, hair: 0x1f1f1f, skin: 0xd9a06b },
  { id: "wizard", nama: "Penyihir bintang", namaEn: "Star wizard", level: 8, cloth: 0x7b4fd0, hair: 0xe8e8e8, skin: 0xf1c6a0 },
  { id: "robot", nama: "Robot sahabat", namaEn: "Buddy robot", level: 12, cloth: 0x58c6c0, hair: 0x9aa0a6, skin: 0xbfc7cf },
];

export interface SkillDef {
  id: string;
  nama: string;
  namaEn: string;
  level: number;
  keterangan: string;
  keteranganEn: string;
}

export const SKILLS: SkillDef[] = [
  { id: "sprint", nama: "Lari kilat", namaEn: "Swift sprint", level: 2, keterangan: "Tahan Shift / B / tombol Lari untuk berlari lebih cepat", keteranganEn: "Hold Shift, gamepad B or the Run button to go faster" },
  { id: "doublejump", nama: "Lompat ganda", namaEn: "Double jump", level: 4, keterangan: "Tekan lompat sekali lagi di udara", keteranganEn: "Press jump once more in mid-air" },
  { id: "magnet", nama: "Magnet bintang", namaEn: "Star magnet", level: 6, keterangan: "Item terdekat tertarik sendiri kepadamu", keteranganEn: "Nearby items float toward you on their own" },
  { id: "glide", nama: "Meluncur angin", namaEn: "Wind glide", level: 9, keterangan: "Tahan lompat saat jatuh untuk melayang pelan", keteranganEn: "Hold jump while falling to drift down slowly" },
  { id: "rocket", nama: "Sepatu roket", namaEn: "Rocket boots", level: 14, keterangan: "Lompatan jauh lebih tinggi", keteranganEn: "Jump much higher" },
];

export interface ToolDef {
  id: string;
  nama: string;
  namaEn: string;
  level: number;
  bonus: number; // extra score per collected item
}

// Kid-safe gear tiers — progression like weapon upgrades in big games, but friendly.
export const TOOLS: ToolDef[] = [
  { id: "net", nama: "Jaring kupu-kupu", namaEn: "Butterfly net", level: 1, bonus: 0 },
  { id: "lantern", nama: "Lentera kunang", namaEn: "Firefly lantern", level: 3, bonus: 2 },
  { id: "wand", nama: "Tongkat bintang", namaEn: "Star wand", level: 7, bonus: 5 },
  { id: "kite", nama: "Layang-layang emas", namaEn: "Golden kite", level: 11, bonus: 8 },
  { id: "crown", nama: "Mahkota padang", namaEn: "Meadow crown", level: 16, bonus: 12 },
];

export interface PetDef {
  id: string;
  nama: string;
  namaEn: string;
  level: number;
}

// Companions that follow the player around — unlocked by level.
export const PETS: PetDef[] = [
  { id: "puppy", nama: "Anak anjing", namaEn: "Puppy", level: 3 },
  { id: "fox", nama: "Rubah oranye", namaEn: "Orange fox", level: 7 },
  { id: "bird", nama: "Burung biru", namaEn: "Bluebird", level: 10 },
];

export interface DecorDef {
  id: string;
  nama: string;
  namaEn: string;
  missions: number; // quests finished to earn this decoration
}

// Tree-house decorations earned by finishing quests, placed by the player.
export const DECORS: DecorDef[] = [
  { id: "flag", nama: "Bendera warna-warni", namaEn: "Rainbow flag", missions: 1 },
  { id: "pot", nama: "Pot bunga", namaEn: "Flower pots", missions: 3 },
  { id: "lights", nama: "Untaian lampu", namaEn: "String lights", missions: 6 },
  { id: "swing", nama: "Ayunan tali", namaEn: "Rope swing", missions: 10 },
  { id: "chime", nama: "Lonceng angin", namaEn: "Wind chime", missions: 15 },
  { id: "telescope", nama: "Teropong bintang", namaEn: "Star telescope", missions: 22 },
  { id: "gnome", nama: "Kurcaci taman", namaEn: "Garden gnome", missions: 30 },
  { id: "banner", nama: "Panji juara", namaEn: "Champion banner", missions: 40 },
];

export interface AchievementDef {
  id: string;
  nama: string;
  namaEn: string;
  keterangan: string;
  keteranganEn: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-item", nama: "Temuan pertama", namaEn: "First find", keterangan: "Ambil item pertamamu", keteranganEn: "Pick up your first item" },
  { id: "items-25", nama: "Pengumpul rajin", namaEn: "Keen collector", keterangan: "Kumpulkan 25 item", keteranganEn: "Collect 25 items" },
  { id: "items-100", nama: "Pemburu harta", namaEn: "Treasure hunter", keterangan: "Kumpulkan 100 item", keteranganEn: "Collect 100 items" },
  { id: "items-500", nama: "Legenda padang", namaEn: "Meadow legend", keterangan: "Kumpulkan 500 item", keteranganEn: "Collect 500 items" },
  { id: "quest-1", nama: "Misi perdana", namaEn: "First quest", keterangan: "Selesaikan misi pertama", keteranganEn: "Finish your first quest" },
  { id: "quest-10", nama: "Sepuluh petualangan", namaEn: "Ten adventures", keterangan: "Selesaikan 10 misi", keteranganEn: "Finish 10 quests" },
  { id: "quest-50", nama: "Penjelajah sejati", namaEn: "True explorer", keterangan: "Selesaikan 50 misi", keteranganEn: "Finish 50 quests" },
  { id: "jump-100", nama: "Kaki pegas", namaEn: "Springy legs", keterangan: "Melompat 100 kali", keteranganEn: "Jump 100 times" },
  { id: "walk-1000", nama: "Seribu langkah", namaEn: "A thousand steps", keterangan: "Berjalan sejauh 1.000 meter", keteranganEn: "Walk 1,000 meters" },
  { id: "walk-10000", nama: "Pengembara jauh", namaEn: "Far wanderer", keterangan: "Berjalan sejauh 10.000 meter", keteranganEn: "Walk 10,000 meters" },
  { id: "level-5", nama: "Bintang lima", namaEn: "Five stars", keterangan: "Capai level 5", keteranganEn: "Reach level 5" },
  { id: "level-10", nama: "Bintang sepuluh", namaEn: "Ten stars", keterangan: "Capai level 10", keteranganEn: "Reach level 10" },
  { id: "story-1", nama: "Awal kisah", namaEn: "The story begins", keterangan: "Dengarkan bab pertama dari tetua desa", keteranganEn: "Hear the first chapter from a village elder" },
  { id: "story-6", nama: "Setengah perjalanan", namaEn: "Halfway there", keterangan: "Capai bab 6 kisah bintang", keteranganEn: "Reach chapter 6 of the star story" },
  { id: "story-12", nama: "Penjaga bintang", namaEn: "Keeper of the stars", keterangan: "Tamatkan 12 bab kisah bintang", keteranganEn: "Finish all 12 chapters of the star story" },
  { id: "biome-desert", nama: "Penakluk pasir", namaEn: "Sand conqueror", keterangan: "Injak gurun pasir untuk pertama kali", keteranganEn: "Set foot in the desert for the first time" },
  { id: "biome-snow", nama: "Penjelajah salju", namaEn: "Snow explorer", keterangan: "Injak padang salju untuk pertama kali", keteranganEn: "Set foot in the snowfield for the first time" },
  { id: "night-owl", nama: "Sahabat malam", namaEn: "Night owl", keterangan: "Bertualang saat langit malam tiba", keteranganEn: "Keep adventuring after night falls" },
  { id: "race-1", nama: "Pelari kilat", namaEn: "Lightning runner", keterangan: "Menangkan balapan waktu pertamamu", keteranganEn: "Win your first timed race" },
  { id: "race-10", nama: "Juara lintasan", namaEn: "Track champion", keterangan: "Menangkan 10 balapan waktu", keteranganEn: "Win 10 timed races" },
  { id: "treasure-1", nama: "Pemburu peti", namaEn: "Chest hunter", keterangan: "Temukan peti harta karun pertamamu", keteranganEn: "Find your first treasure chest" },
  { id: "delivery-1", nama: "Kurir padang", namaEn: "Meadow courier", keterangan: "Antarkan paket pertamamu sampai tujuan", keteranganEn: "Deliver your first package" },
  { id: "home-1", nama: "Rumahku istanaku", namaEn: "Home sweet home", keterangan: "Pasang hiasan pertama di rumah pohonmu", keteranganEn: "Place your first decoration on your tree house" },
  { id: "starquest-3", nama: "Pemulih bintang", namaEn: "Star mender", keterangan: "Selesaikan 3 misi pecahan bintang dari tetua", keteranganEn: "Finish 3 star-shard quests from the elders" },
  { id: "inside-1", nama: "Tamu yang sopan", namaEn: "Polite guest", keterangan: "Masuk ke dalam rumah desa", keteranganEn: "Step inside a village house" },
  { id: "cave-1", nama: "Penjelajah gua", namaEn: "Cave explorer", keterangan: "Masuki gua kristal", keteranganEn: "Enter the crystal cave" },
  { id: "hall-1", nama: "Pendaki aula", namaEn: "Hall climber", keterangan: "Capai balkon aula gunung", keteranganEn: "Reach the balcony of the mountain hall" },
  { id: "arena-1", nama: "Juara gelembung", namaEn: "Bubble champion", keterangan: "Letuskan 10 slime di arena latihan", keteranganEn: "Pop 10 slimes in the training arena" },
  { id: "together-1", nama: "Main bareng", namaEn: "Better together", keterangan: "Bermain bersama teman di satu ruang", keteranganEn: "Play with a friend in the same room" },
  { id: "style-1", nama: "Gaya baru", namaEn: "Fresh style", keterangan: "Beli pakaian pertama dari lemari", keteranganEn: "Buy your first outfit piece from the wardrobe" },
  { id: "ride-1", nama: "Penunggang", namaEn: "Rider", keterangan: "Tunggangi hewan liar", keteranganEn: "Ride a wild animal" },
  { id: "ride-5", nama: "Sahabat semua hewan", namaEn: "Friend of every creature", keterangan: "Tunggangi 5 jenis hewan berbeda", keteranganEn: "Ride five different kinds of animal" },
  { id: "craft-1", nama: "Juru masak kecil", namaEn: "Little cook", keterangan: "Gabungkan bahan menjadi item baru", keteranganEn: "Combine ingredients into a new item" },
  { id: "forage-50", nama: "Pengumpul ulung", namaEn: "Keen forager", keterangan: "Petik 50 bahan dari alam", keteranganEn: "Gather 50 ingredients in the wild" },
  { id: "story-24", nama: "Dua penjaga", namaEn: "Two keepers", keterangan: "Selesaikan babak kedua kisah Sela", keteranganEn: "Finish the second act, the story of Sela" },
];

export type GameMode = "casual" | "adventure";

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
  storyChapter: number; // 0..24, chapters of "Bintang yang Hilang" heard so far
  pet: string | null; // active companion id
  racesWon: number; // timed races finished in time
  treasuresFound: number; // treasure chests opened
  deliveries: number; // courier packages delivered
  starQuests: number; // elder star-shard follow-up quests finished
  decors: string[]; // decoration ids the player has earned
  placedDecors: string[]; // decoration ids placed on the tree house
  coins: number; // earned by playing, spent in the wardrobe shop
  owned: string[]; // cosmetic ids bought with coins
  devnet: string[]; // cosmetic ids granted by a verified devnet transfer (server-owned)
  equip: Record<Slot, string>;
  inventory: Record<string, number>;
  mode: GameMode;
  slimesPopped: number;
  gemsFound: number;
}

// Which decorations are earned given how many quests have been finished.
export function earnedDecors(missionsDone: number): string[] {
  return DECORS.filter((d) => missionsDone >= d.missions).map((d) => d.id);
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
    storyChapter: 0,
    pet: null,
    racesWon: 0,
    treasuresFound: 0,
    deliveries: 0,
    starQuests: 0,
    decors: [],
    placedDecors: [],
    coins: 60, // enough for a first small treat so the shop makes sense on day one
    owned: [...STARTER_COSMETICS],
    devnet: [],
    equip: { ...DEFAULT_EQUIP },
    inventory: { apple: 2 },
    mode: "casual",
    slimesPopped: 0,
    gemsFound: 0,
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
    storyChapter: 24,
    pet: "bird",
    racesWon: 99,
    treasuresFound: 99,
    deliveries: 99,
    starQuests: 12,
    decors: DECORS.map((d) => d.id),
    placedDecors: DECORS.map((d) => d.id),
    coins: 9999,
    owned: COSMETICS.filter((c) => !c.devnetLamports).map((c) => c.id),
    devnet: [],
    equip: { ...DEFAULT_EQUIP, hat: "hat-star", cape: "cape-starry", shoes: "shoes-glow" },
    inventory: { apple: 20, pie: 5, candy: 5, gem: 12, shell: 8, berry: 15, flower: 15, mushroom: 10, tea: 3, soup: 2, charm: 2 },
    mode: "adventure",
    slimesPopped: 250,
    gemsFound: 40,
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
  const coinIds = COSMETICS.filter((c) => !c.devnetLamports).map((c) => c.id);
  const owned = [...new Set([...STARTER_COSMETICS, ...arr(r.owned, coinIds)])];
  const devnet = [...new Set(arr(r.devnet, DEVNET_COSMETICS))];
  const wearable = new Set([...owned, ...devnet]);
  const rawEquip = (r.equip && typeof r.equip === "object" ? r.equip : {}) as Record<string, unknown>;
  const equip = { ...DEFAULT_EQUIP };
  SLOTS.forEach((slot) => {
    const v = rawEquip[slot];
    const def = COSMETICS.find((c) => c.id === v);
    if (typeof v === "string" && def && def.slot === slot && wearable.has(v)) equip[slot] = v;
  });
  const rawInv = (r.inventory && typeof r.inventory === "object" ? r.inventory : {}) as Record<string, unknown>;
  const inventory: Record<string, number> = {};
  ITEMS.forEach((it) => {
    const n = Math.floor(num(rawInv[it.id], 999));
    if (n > 0) inventory[it.id] = n;
  });
  // A save written before coins existed should still get the starter purse.
  const coins = typeof r.coins === "number" ? Math.floor(num(r.coins, 1_000_000)) : d.coins;
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
    storyChapter: Math.min(24, Math.floor(num(r.storyChapter, 24))),
    pet:
      typeof r.pet === "string" && PETS.some((p) => p.id === r.pet)
        ? r.pet
        : null,
    racesWon: num(r.racesWon, 1_000_000),
    treasuresFound: num(r.treasuresFound, 1_000_000),
    deliveries: num(r.deliveries, 1_000_000),
    starQuests: Math.min(12, Math.floor(num(r.starQuests, 12))),
    decors: [
      ...new Set([
        ...earnedDecors(num(r.missionsDone, 1_000_000)),
        ...arr(r.decors, DECORS.map((d) => d.id)),
      ]),
    ],
    placedDecors: arr(r.placedDecors, DECORS.map((d) => d.id)),
    coins,
    owned,
    devnet,
    equip,
    inventory: r.inventory && typeof r.inventory === "object" ? inventory : d.inventory,
    mode: r.mode === "adventure" ? "adventure" : "casual",
    slimesPopped: Math.floor(num(r.slimesPopped, 10_000_000)),
    gemsFound: Math.floor(num(r.gemsFound, 10_000_000)),
  });
}
