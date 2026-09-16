// Two-player proof: hosts a room in one browser, joins from another, and
// reports whether each side sees the other move, plus the measured ping.
//   node scripts/mp.mjs [baseUrl]
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://localhost:3217";
const OUT = "docs/qa";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, pass, note = "") => {
  results.push({ name, pass, note });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? "  — " + note : ""}`);
};

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
async function open(ctx, hero) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(180000);
  p.on("pageerror", (e) => console.log("pageerror:", String(e).slice(0, 200)));
  await p.addInitScript(() => {
    localStorage.setItem("meadowfar-lang", "en");
    localStorage.setItem("meadowfar-gfx2", JSON.stringify({ preset: "supersmooth", scale: 0.6, shadows: 0, view: 2, grass: 0, bloom: false, aa: false, wildlife: 0, fov: 62, brightness: 1, contrast: 1, saturation: 1, showFps: true, maxFps: 0 }));
  });
  await p.goto(BASE + "/play");
  await p.getByTestId("start-mode-casual").click();
  await p.getByTestId(`hero-${hero}`).click();
  await p.waitForFunction(() => typeof window.__meadowfar === "function");
  return p;
}
const state = (p) => p.evaluate(() => {
  const { teleport, setYaw, enter, exit, rideNearest, dismount, ...rest } = window.__meadowfar();
  return rest;
});

const ctxA = await browser.newContext({ viewport: { width: 900, height: 560 } });
const ctxB = await browser.newContext({ viewport: { width: 900, height: 560 } });
const A = await open(ctxA, "girl");
const B = await open(ctxB, "boy");
console.log("both clients loaded");

await A.getByTestId("hud-menu").click();
await A.getByTestId("tab-together").click();
await A.getByTestId("room-host").click();
await A.getByTestId("room-code").waitFor({ timeout: 120000 });
const code = (await A.getByTestId("room-code").innerText()).trim();
check("host creates a room code", /\w{3,}/.test(code), `code=${code}`);

await B.getByTestId("hud-menu").click();
await B.getByTestId("tab-together").click();
await B.getByTestId("room-code-input").fill(code);
await B.getByTestId("room-join").click();

let joined = false;
for (let i = 0; i < 120 && !joined; i++) {
  await sleep(1000);
  joined = (await B.getByTestId("room-count").innerText().catch(() => "")).startsWith("2");
}
check("two players join the same room", joined, `code=${code}`);

await A.getByTestId("menu-close").click();
await B.getByTestId("menu-close").click();
await sleep(6000);
let sa = await state(A), sb = await state(B);
check("each player sees the other avatar", sa.remotes === 1 && sb.remotes === 1, `A sees ${sa.remotes}, B sees ${sb.remotes}`);

const ping = await B.getByTestId("hud-room").innerText().catch(() => "");
check("round-trip ping is shown", /\d+\s*ms/.test(ping), ping.replace(/\s+/g, " ").trim());

// B walks; A must see B's avatar move
const before = await A.evaluate(() => window.__meadowfar().remotePos ?? null);
await B.evaluate(() => window.__meadowfar().setYaw(0));
await B.keyboard.down("w");
await sleep(4000);
await B.keyboard.up("w");
await sleep(1500);
const after = await A.evaluate(() => window.__meadowfar().remotePos ?? null);
const moved = before && after ? Math.hypot(after.x - before.x, after.z - before.z) : null;
check("the other player's movement is visible live", moved === null ? false : moved > 1.5,
      moved === null ? "remotePos not exposed by the debug hook" : `moved ${moved.toFixed(2)} m`);

await A.screenshot({ path: `${OUT}/13-together-host-view.png` });
await B.screenshot({ path: `${OUT}/14-together-guest-view.png` });
console.log(JSON.stringify({ code, ping, results }, null, 2));
await browser.close();
process.exit(results.every((r) => r.pass) ? 0 : 1);
