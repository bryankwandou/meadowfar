<div align="center">

# 🌿 Meadowfar

**A gentle 3D open world for kids — playable instantly in the browser.**
**Dunia terbuka 3D yang ramah anak — langsung dimainkan di peramban.**

[▶ Play now](https://meadowfar.vercel.app) · No download · No ads · No violence · Free forever

</div>

---

## Statement

Children deserve a calm, safe digital place to play — not one filled with ads, competitive
pressure, or scary surprises. **Meadowfar** is built as a *real* 3D world that parents can trust
and kids love: one click to start, impossible to lose, and always something new to discover.

Every design decision was made with a parent in the room. There is no chat with strangers, no
purchases, no rankings to shame a child, and a parent dashboard with a daily play-time limit.

> Anak berhak atas ruang bermain digital yang tenang dan aman. Meadowfar dibangun sebagai dunia 3D
> sungguhan yang bisa dipercaya orang tua dan disukai anak — satu klik untuk mulai, mustahil untuk
> kalah, dan selalu ada hal baru untuk ditemukan.

## Why it's safe (for reviewers & parents)

| ✔ | Safety property |
|---|---|
| ✔ | No violence, no scary content |
| ✔ | No ads, **no real-money purchases**, no loot boxes — the wardrobe shop uses coins earned by playing |
| ✔ | Parent-only Solana **devnet** test purchase (devnet SOL has no monetary value; verified on-chain by the server) |
| ✔ | Play together in private rooms by code — **no text chat**, only positions, outfits and fixed emotes |
| ✔ | Family board with **no rankings** (no child is shamed) |
| ✔ | Parent dashboard + **daily play-time limit**, gated by `is_parent` |
| ✔ | Gentle "time for a break" reminder — reminds, never locks out |
| ✔ | Fully bilingual: English & Bahasa Indonesia |
| ✔ | Respects `prefers-reduced-motion` for motion-sensitive kids |
| ✔ | Original geometry only — **zero copyrighted assets** |
| ✔ | Passwords hashed with bcrypt; sessions are signed HttpOnly cookies |

## What's inside

- **Infinite procedural world** — hills, forests, deserts, snowfields, and lakes grow chunk by
  chunk as you walk. No invisible walls.
- **6 biomes**, a **day–night cycle** (sun, moon, stars, fireflies, lanterns), and follower pets
  (puppy, fox, bird).
- **5 rotating quest types** — collect, gate races, treasure hunts, deliveries, star-shard errands
  — all **pressure-free** (no fail states).
- **12-chapter bilingual story** with the village elder, each chapter tied to a quest.
- **6 unlockable characters**, 5 real gameplay skills (sprint, double-jump, item magnet, glide,
  rocket boots), 5 gear tiers, and **24 measured achievements**.
- **A decorable tree house**, a **photo mode** with stickers, and a **family board**.

## Built like a real 3D game

- **Three.js / WebGL** renderer with **ACES filmic tone mapping**, sRGB output, dynamic soft
  shadows (PCF), waving-grass instancing, and a rippling-water vertex shader.
- **Game feel**: joint-pivoted walk/run animation, squash-&-stretch jumps, sprint FOV rush,
  collection sparkle bursts, floating score pops, and a swim pose on water.
- **Automatic graphics quality** (Auto / Smooth / Pretty) — detects CPU cores & screen width so it
  stays smooth on modest school laptops and phones.
- Touch joystick for phones/tablets; WASD / arrow keys on desktop.

## Tech stack

- **Next.js** (App Router) + **React** + **TypeScript** (strict)
- **Three.js** for the 3D world (all geometry generated from code)
- **Tailwind CSS** for UI
- **Neon Postgres** (`@neondatabase/serverless`) for accounts & progress (JSONB), with server-side
  sanitization against impossible/cheat payloads
- Deployed on **Vercel**

## Run locally

```bash
npm install
npm run dev       # dev server
# or a production build:
npm run build && npm run start
```

Open <http://localhost:3000> for the landing page, and `/play` to enter the world.

Accounts/progress need a Postgres connection string in `.env.local` (`DATABASE_URL`). Without it,
the game still runs in **guest mode** (progress saved to `localStorage`). Secrets live only in
`.env.local` (gitignored) and Vercel env — never in the repo.

## Quality

- Passes **TypeScript strict** and a clean `next build` on every change.
- Verified in a **real Chrome + WebGL** run: world renders, controls respond, **0 console errors**.
- Production deploy verified after every phase.

## Studio

Made by **nayrbryanGaming** — an indie studio in **Makassar, Indonesia** (est. 2017), focused on
kid-safe, family-friendly experiences.
[X/Twitter](https://x.com/nayrbryanGaming) · [TikTok](https://www.tiktok.com/@nayrbryangaming) · [Telegram](https://t.me/nayrbryangaming)
