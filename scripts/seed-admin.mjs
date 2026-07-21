// One-time seeder for the QA test account with maxed progress.
// Credentials come from env (.env.local) — never hardcoded, never committed.
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const username = process.env.ADMIN_SEED_USERNAME;
const password = process.env.ADMIN_SEED_PASSWORD;
if (!username || !password || !process.env.DATABASE_URL) {
  console.error("ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD / DATABASE_URL wajib diatur");
  process.exit(1);
}

// Mirror of maxProgress() in lib/progression.ts (kept in sync manually).
const maxProgress = {
  xp: 49 * 49 * 60,
  bestScore: 99990,
  itemsCollected: 9999,
  missionsDone: 999,
  jumps: 9999,
  distance: 999999,
  heroes: ["girl", "boy", "knight", "explorer", "wizard", "robot"],
  skills: ["sprint", "doublejump", "magnet", "glide", "rocket"],
  tools: ["net", "lantern", "wand", "kite", "crown"],
  achievements: [
    "first-item", "items-25", "items-100", "items-500",
    "quest-1", "quest-10", "quest-50", "jump-100",
    "walk-1000", "walk-10000", "level-5", "level-10",
    "story-1", "story-6", "story-12",
    "biome-desert", "biome-snow", "night-owl",
    "race-1", "race-10", "treasure-1", "delivery-1", "home-1", "starquest-3",
  ],
  lastHero: "wizard",
  storyChapter: 12,
  pet: "bird",
  racesWon: 99,
  treasuresFound: 99,
  deliveries: 99,
  starQuests: 12,
  decors: [
    "flag", "pot", "lights", "swing",
    "chime", "telescope", "gnome", "banner",
  ],
  placedDecors: [
    "flag", "pot", "lights", "swing",
    "chime", "telescope", "gnome", "banner",
  ],
};

const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  username_lower TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  agreed_terms_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;
await sql`CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

const hash = await bcrypt.hash(password, 10);
const rows = await sql`
  INSERT INTO users (username, username_lower, email, password_hash)
  VALUES (${username}, ${username.toLowerCase()}, ${username.toLowerCase() + "@seed.meadowfar"}, ${hash})
  ON CONFLICT (username_lower)
  DO UPDATE SET password_hash = EXCLUDED.password_hash
  RETURNING id`;
await sql`
  INSERT INTO progress (user_id, data, updated_at)
  VALUES (${rows[0].id}, ${JSON.stringify(maxProgress)}::jsonb, now())
  ON CONFLICT (user_id)
  DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
console.log(`Akun uji '${username}' siap dengan progres maksimum (user id ${rows[0].id}).`);
