# Deployment record

This file records what is live, when it went live, and how to verify it
independently. Every line below can be checked by a third party without
taking our word for it.

## Current production deployment

| Field | Value |
| --- | --- |
| Live URL | https://meadowfar.vercel.app |
| Deployment URL | https://meadowfar-9qgm2h94w-nayrbryangamings-projects.vercel.app |
| Commit | `34e2a12dcb8c0e4ccc31aed75ba247c69d4d3e58` |
| Commit date | 2026-09-16T19:51:39+08:00 |
| Vercel build log | https://vercel.com/nayrbryangamings-projects/meadowfar/7xazqAqBHvtVjJohdPTuyUGM7EG8 |
| Verified responding | `GET /` 200, `GET /play` 200 |

How to verify:

1. Open the live URL and play. No login is needed; guest play works.
2. `git log -1` in this repository shows the commit above.
3. The Vercel build log shows the same commit being built and deployed.

## What shipped in this deployment

Rendering
- Physically based sky using Rayleigh and Mie scattering, replacing the flat
  gradient dome. Switches to a starry gradient after sunset.
- Drifting procedural cloud layer (one draw call, layered value noise).
- Image-based lighting from a generated environment map, so metals and glossy
  surfaces reflect their surroundings.
- Ground-truth ambient occlusion (GTAO) and SMAA anti-aliasing on the higher
  presets.
- Ground shader with multi-scale noise: soil and grass variation, slope-based
  rock, and micro-relief in the surface normal.
- Grass is now tufts of five tapered, bent blades with per-tuft colour
  variation; meadow flowers bloom in clumps.
- Trees have tapered trunks with root flare, lumpy foliage, and sagging pine
  branches. Every prop gets its own rotation, tilt and squash.

World
- Dungeons (old mines, stone keeps, ruined arenas) generate across the whole
  world, roughly one per four regions, each named and shown on the map.
- The starting valley is kept gentle; mountains rise beyond about 180 m.

Characters
- Physically based skin and fabric (sheen on cloth, clearcoat on glossy parts).
- Blinking, breathing and idle head movement.
- The hero picker shows rendered 3D characters instead of colour circles.

Story
- Act II: chapters 13-24, with the chapter cap and achievements extended.

## Bugs fixed, with root cause

| Symptom | Root cause | Fix |
| --- | --- | --- |
| Whole screen washed out in daylight | The scattering sky is brighter than any glowing object, so the bloom pass veiled every frame | Bloom now runs only at night and indoors |
| Sky rendered black at noon | This three.js version expects `sunPosition` in world units (~450 km), not a unit vector | Pass the scaled position; also lengthened the day to 15 minutes |
| Spawn point on a cliff face, camera inside rock | New terrain put the tree house on a 28 m slope | Flattened the starting valley |
| Grass taller than the character | Tuft scale too large | Reduced to knee height |

## Verification method

Graphics changes are checked by rendering the game in a real browser
(Playwright + Chromium) and reading the screenshot, not by assuming the code
is correct. `scripts/smoke.mjs` loads the game on the Super High preset, fails
on any shader or page error, and saves screenshots to `docs/qa/`.

## Known gaps

- Two-player play is still being verified end to end (`scripts/mp.mjs`).
  Until that test passes, real-time play together is not proven.
- Frame rates in this repository's screenshots come from a software renderer
  (SwiftShader) on a laptop without a dedicated GPU, so they are far below
  what real hardware produces. They are not a performance measurement.
