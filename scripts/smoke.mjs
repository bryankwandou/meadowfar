// Quick render smoke test: loads /play on the High preset, waits for the
// world, saves a screenshot and fails on any WebGL shader/program error.
//   node scripts/smoke.mjs [baseUrl]
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:3217";
fs.mkdirSync("docs/qa", { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(240000);
const errors = [];
page.on("console", (m) => {
  const t = m.text();
  if (m.type() === "error" || /shader|program|GLSL/i.test(t)) errors.push(t.slice(0, 400));
});
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 400)));
await page.addInitScript(() => {
  localStorage.setItem("meadowfar-lang", "en");
  localStorage.setItem("meadowfar-gfx2", JSON.stringify({ preset: "superhigh", scale: 1, shadows: 2, view: 4, grass: 1, bloom: true, aa: true, wildlife: 1, fov: 62, brightness: 1, contrast: 1, saturation: 1, showFps: true, maxFps: 0 }));
});
await page.goto(BASE + "/play");
await page.getByTestId("start-mode-casual").click();
await page.getByTestId("hero-girl").click();
await page.waitForFunction(() => typeof window.__meadowfar === "function");
await new Promise((r) => setTimeout(r, 12000));
const s = await page.evaluate(() => {
  const { teleport, setYaw, enter, exit, rideNearest, dismount, ...rest } = window.__meadowfar();
  return rest;
});
await page.screenshot({ path: "docs/qa/20-render-superhigh.png" });
// tilt the camera up to check the sky and cloud layer
await page.evaluate(() => window.__meadowfar().setPitch(-0.95));
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: "docs/qa/23-sky.png" });
await page.evaluate(() => window.__meadowfar().setPitch(0.32));
// look for a procedural dungeon and walk the camera to it
const d = await page.evaluate(() => {
  for (let r = 1; r < 12; r++)
    for (let a = 0; a < 8; a++) {
      const x = Math.cos(a) * r * 192, z = Math.sin(a) * r * 192;
      window.__probe = { x, z };
    }
  return null;
});
console.log(JSON.stringify({ state: s, dungeonProbe: d, errors }, null, 2));
await browser.close();
process.exit(errors.some((e) => /shader|program|GLSL|pageerror/i.test(e)) ? 1 : 0);
