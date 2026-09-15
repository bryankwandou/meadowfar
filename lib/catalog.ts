// Wardrobe cosmetics and inventory items. Shared by the game client, the shop
// API and the progress sanitizer, so prices and ids live in exactly one place.

export type Slot = "hat" | "outfit" | "cape" | "shoes" | "back";
export const SLOTS: Slot[] = ["hat", "outfit", "cape", "shoes", "back"];

export interface CosmeticDef {
  id: string;
  slot: Slot;
  nama: string;
  namaEn: string;
  price: number; // in-game coins; 0 = owned from the start
  color: number;
  accent?: number;
  glow?: boolean;
  // Parent-only devnet showcase items. Devnet SOL has no monetary value; the
  // server verifies the transfer on devnet before granting the item.
  devnetLamports?: number;
}

export const COSMETICS: CosmeticDef[] = [
  // hats ("hat-none" keeps the hero's own signature headwear)
  { id: "hat-none", slot: "hat", nama: "Topi bawaan", namaEn: "Signature look", price: 0, color: 0xffffff },
  { id: "hat-cap", slot: "hat", nama: "Topi pet", namaEn: "Sport cap", price: 40, color: 0xe14b4b, accent: 0xffffff },
  { id: "hat-beanie", slot: "hat", nama: "Kupluk hangat", namaEn: "Cozy beanie", price: 60, color: 0x4b8fe1, accent: 0xffd447 },
  { id: "hat-flowers", slot: "hat", nama: "Mahkota bunga", namaEn: "Flower crown", price: 90, color: 0x6fc25f, accent: 0xff8fb3 },
  { id: "hat-bunny", slot: "hat", nama: "Telinga kelinci", namaEn: "Bunny ears", price: 120, color: 0xfff4f8, accent: 0xffb3c8 },
  { id: "hat-tophat", slot: "hat", nama: "Topi pesulap", namaEn: "Magician top hat", price: 180, color: 0x2a2440, accent: 0xd94b7a },
  { id: "hat-star", slot: "hat", nama: "Helm bintang", namaEn: "Star helmet", price: 260, color: 0xdfe6ef, accent: 0xffd447, glow: true },
  { id: "hat-aurora", slot: "hat", nama: "Mahkota aurora", namaEn: "Aurora crown", price: 0, color: 0x7fe7ff, accent: 0xc38bff, glow: true, devnetLamports: 10_000_000 },
  // outfits
  { id: "outfit-hero", slot: "outfit", nama: "Baju tokoh", namaEn: "Hero colours", price: 0, color: 0xffffff },
  { id: "outfit-overalls", slot: "outfit", nama: "Baju kodok", namaEn: "Denim overalls", price: 50, color: 0x3f6fb5, accent: 0xf3e2b3 },
  { id: "outfit-hoodie", slot: "outfit", nama: "Hoodie jeruk", namaEn: "Orange hoodie", price: 70, color: 0xf08a2e, accent: 0xfff0dc },
  { id: "outfit-raincoat", slot: "outfit", nama: "Jas hujan", namaEn: "Sunny raincoat", price: 90, color: 0xffd447, accent: 0x2e6fb5 },
  { id: "outfit-forest", slot: "outfit", nama: "Rompi penjaga hutan", namaEn: "Ranger vest", price: 130, color: 0x3d7a45, accent: 0xc98a4b },
  { id: "outfit-space", slot: "outfit", nama: "Baju antariksa", namaEn: "Space suit", price: 240, color: 0xeef2f7, accent: 0x3f7ede },
  { id: "outfit-galaxy", slot: "outfit", nama: "Jubah galaksi", namaEn: "Galaxy robe", price: 0, color: 0x2b1f5c, accent: 0x9ff0ff, glow: true, devnetLamports: 20_000_000 },
  // capes
  { id: "cape-none", slot: "cape", nama: "Tanpa jubah", namaEn: "No cape", price: 0, color: 0xffffff },
  { id: "cape-red", slot: "cape", nama: "Jubah merah", namaEn: "Red cape", price: 80, color: 0xd63a3a, accent: 0xffd447 },
  { id: "cape-leaf", slot: "cape", nama: "Jubah daun", namaEn: "Leaf cape", price: 110, color: 0x4fae4a, accent: 0x2e7a35 },
  { id: "cape-starry", slot: "cape", nama: "Jubah berbintang", namaEn: "Starry cape", price: 200, color: 0x24306e, accent: 0xffe27a, glow: true },
  // shoes
  { id: "shoes-basic", slot: "shoes", nama: "Sepatu biasa", namaEn: "Everyday shoes", price: 0, color: 0x5a4636 },
  { id: "shoes-boots", slot: "shoes", nama: "Sepatu bot", namaEn: "Hiking boots", price: 45, color: 0x7a4d2b, accent: 0xd8c9a8 },
  { id: "shoes-rainbow", slot: "shoes", nama: "Sepatu pelangi", namaEn: "Rainbow sneakers", price: 95, color: 0xff6bb5, accent: 0x6bd0ff },
  { id: "shoes-glow", slot: "shoes", nama: "Sepatu nyala", namaEn: "Glow runners", price: 170, color: 0x59ffd0, accent: 0x1b5a4d, glow: true },
  // back
  { id: "back-none", slot: "back", nama: "Punggung kosong", namaEn: "Nothing", price: 0, color: 0xffffff },
  { id: "back-pack", slot: "back", nama: "Ransel petualang", namaEn: "Adventure backpack", price: 55, color: 0xc0563a, accent: 0xf0e3c8 },
  { id: "back-wings", slot: "back", nama: "Sayap kupu-kupu", namaEn: "Butterfly wings", price: 150, color: 0xffa1c6, accent: 0xa1d9ff },
  { id: "back-jet", slot: "back", nama: "Ransel roket mainan", namaEn: "Toy jetpack", price: 220, color: 0xb9c3cf, accent: 0xff7a3a, glow: true },
];

export const DEFAULT_EQUIP: Record<Slot, string> = {
  hat: "hat-none",
  outfit: "outfit-hero",
  cape: "cape-none",
  shoes: "shoes-basic",
  back: "back-none",
};

export const STARTER_COSMETICS = COSMETICS.filter(
  (c) => c.price === 0 && !c.devnetLamports
).map((c) => c.id);

export const DEVNET_COSMETICS = COSMETICS.filter((c) => c.devnetLamports).map((c) => c.id);

export function cosmetic(id: string) {
  return COSMETICS.find((c) => c.id === id);
}

export interface ItemDef {
  id: string;
  nama: string;
  namaEn: string;
  price: number;
  color: number;
  desc: string;
  descEn: string;
  use: "heal1" | "heal2" | "healAll" | "speed" | "shield" | "none";
}

export const ITEMS: ItemDef[] = [
  { id: "apple", nama: "Apel renyah", namaEn: "Crunchy apple", price: 8, color: 0xe14b4b, desc: "Pulihkan 1 hati", descEn: "Restores 1 heart", use: "heal1" },
  { id: "pie", nama: "Pai beri", namaEn: "Berry pie", price: 25, color: 0x9b3fb5, desc: "Pulihkan semua hati", descEn: "Restores every heart", use: "healAll" },
  { id: "candy", nama: "Permen bintang", namaEn: "Star candy", price: 20, color: 0xffd447, desc: "Lari lebih cepat selama 20 detik", descEn: "Run faster for 20 seconds", use: "speed" },
  { id: "gem", nama: "Permata gua", namaEn: "Cave gem", price: 0, color: 0x7fe7ff, desc: "Kenang-kenangan dari gua kristal", descEn: "A keepsake from the crystal cave", use: "none" },
  { id: "shell", nama: "Kerang danau", namaEn: "Lake shell", price: 0, color: 0xffd9c2, desc: "Ditemukan di tepi danau", descEn: "Found at the lake shore", use: "none" },
  { id: "berry", nama: "Beri liar", namaEn: "Wild berries", price: 0, color: 0xc2304a, desc: "Dipetik dari semak beri. Bahan masakan.", descEn: "Picked from berry bushes. A cooking ingredient.", use: "none" },
  { id: "flower", nama: "Bunga padang", namaEn: "Meadow flower", price: 0, color: 0xf2a8c8, desc: "Dipetik di padang rumput. Bahan teh dan permen.", descEn: "Picked in the meadows. Used for tea and candy.", use: "none" },
  { id: "mushroom", nama: "Jamur hutan", namaEn: "Forest mushroom", price: 0, color: 0xc9744a, desc: "Tumbuh di hutan yang teduh. Bahan sup.", descEn: "Grows in shady woods. A soup ingredient.", use: "none" },
  { id: "tea", nama: "Teh bunga", namaEn: "Flower tea", price: 0, color: 0xe7b36a, desc: "Pulihkan 2 hati", descEn: "Restores 2 hearts", use: "heal2" },
  { id: "soup", nama: "Sup jamur", namaEn: "Mushroom soup", price: 0, color: 0xb98a5a, desc: "Pulihkan semua hati", descEn: "Restores every heart", use: "healAll" },
  { id: "charm", nama: "Jimat kristal", namaEn: "Crystal charm", price: 0, color: 0x9fe8ff, desc: "Menahan satu senggolan slime", descEn: "Blocks the next slime bump", use: "shield" },
];

export function item(id: string) {
  return ITEMS.find((i) => i.id === id);
}

// Combine ingredients at any time from the Inventory tab.
export interface Recipe {
  id: string;
  out: string;
  qty: number;
  needs: Record<string, number>;
}
export const RECIPES: Recipe[] = [
  { id: "r-pie", out: "pie", qty: 1, needs: { berry: 3, apple: 1 } },
  { id: "r-tea", out: "tea", qty: 1, needs: { flower: 2, apple: 1 } },
  { id: "r-candy", out: "candy", qty: 2, needs: { flower: 2, berry: 1 } },
  { id: "r-soup", out: "soup", qty: 1, needs: { mushroom: 3, shell: 1 } },
  { id: "r-charm", out: "charm", qty: 1, needs: { gem: 2, shell: 1 } },
];

export function canCraft(r: Recipe, inv: Record<string, number>) {
  return Object.entries(r.needs).every(([k, n]) => (inv[k] ?? 0) >= n);
}

export const MAX_HEARTS = 5;
