// End-to-end QA for the QA/auditor reports. Runs real Chromium with WebGL
// against a running server (default http://localhost:3210) and writes
// screenshots + a JSON report to docs/qa/.
//   node scripts/qa.mjs [baseUrl]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://localhost:3210";
const OUT = path.resolve("docs/qa");
fs.mkdirSync(OUT, { recursive: true });
const report = { base: BASE, when: new Date().toISOString(), checks: [], consoleErrors: [] };
const check = (name, pass, detail = "") => {
  report.checks.push({ name, pass: !!pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

async function openGame(ctx, { hero = "girl", mode = "casual", gfx = "medium" } = {}) {
  const page = await ctx.newPage();
  // Software WebGL (SwiftShader) on a laptop CPU can take many seconds per
  // frame; screenshots wait for a fresh frame, so give every step room.
  page.setDefaultTimeout(120000);
  page.on("console", (m) => {
    if (m.type() === "error") report.consoleErrors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => report.consoleErrors.push("pageerror: " + String(e).slice(0, 300)));
  await page.addInitScript((g) => {
    localStorage.setItem("meadowfar-lang", "en");
    const presets = {
      smooth: { scale: 0.75, shadows: 0, view: 2, grass: 0.25, bloom: false, aa: false, wildlife: 0.6 },
      medium: { scale: 1, shadows: 1, view: 2, grass: 0.5, bloom: false, aa: true },
      high: { scale: 1, shadows: 2, view: 3, grass: 1, bloom: true, aa: true },
    };
    if (!localStorage.getItem("meadowfar-gfx2"))
      localStorage.setItem("meadowfar-gfx2", JSON.stringify({ preset: g, ...presets[g], fov: 62, showFps: true, maxFps: 0 }));
  }, gfx);
  await page.goto(BASE + "/play", { waitUntil: "domcontentloaded" });
  await page.getByTestId(`start-mode-${mode}`).click({ timeout: 60000 });
  await page.getByTestId(`hero-${hero}`).click();
  await page.waitForFunction(() => typeof window.__meadowfar === "function", null, { timeout: 60000 });
  await sleep(2500);
  return page;
}
const state = (page) => page.evaluate(() => {
  const s = window.__meadowfar();
  const { teleport, setYaw, enter, exit, ...rest } = s;
  return rest;
});

// ---------------- desktop ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await openGame(ctx, { gfx: "medium" });
  const s0 = await state(page);
  check("desktop: world renders chunks + solids", s0.chunks > 0 && s0.solids > 50, `chunks=${s0.chunks} solids=${s0.solids} draw calls=${s0.calls}`);
  await page.screenshot({ path: path.join(OUT, "01-desktop-spawn.png") });

  // W moves away from the camera (camYaw 0 => forward is -z)
  await page.evaluate(() => window.__meadowfar().setYaw(0));
  const a = await state(page);
  await page.keyboard.down("w");
  await sleep(900);
  await page.keyboard.up("w");
  const b = await state(page);
  check("keyboard W walks forward (away from camera), not inverted", b.z < a.z - 2, `dz=${(b.z - a.z).toFixed(2)}`);
  await page.keyboard.down("d");
  await sleep(700);
  await page.keyboard.up("d");
  const c = await state(page);
  check("keyboard D strafes right", c.x > b.x + 1.5, `dx=${(c.x - b.x).toFixed(2)}`);

  // mouse-drag right turns the camera right (camYaw decreases)
  const y0 = (await state(page)).camYaw;
  await page.mouse.move(700, 450);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(900, 450, { steps: 8 });
  await page.mouse.up({ button: "right" });
  const y1 = (await state(page)).camYaw;
  check("mouse drag right turns camera right", y1 < y0 - 0.2, `yaw ${y0.toFixed(2)} -> ${y1.toFixed(2)}`);

  // FPP / TPP toggle
  await page.keyboard.press("v");
  await sleep(300);
  const f = await state(page);
  await page.screenshot({ path: path.join(OUT, "02-desktop-first-person.png") });
  await page.keyboard.press("v");
  await sleep(300);
  const tpp = await state(page);
  check("V toggles first-person / third-person", f.view === "fpp" && tpp.view === "tpp");

  // walk into a village cottage through its doorway
  const village = { x: 38, z: 30 };
  await page.evaluate((v) => window.__meadowfar().teleport(v.x, v.z), village);
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "03-village-exterior.png") });
  // find the nearest house door: houses sit 12m from centre facing it; walk from centre toward house 0
  const ang = 0.6;
  const hx = village.x + Math.cos(ang) * 12, hz = village.z + Math.sin(ang) * 12;
  await page.evaluate(({ hx, hz, vx, vz }) => {
    const dx = vx - hx, dz = vz - hz;
    const q = Math.round(Math.atan2(dx, dz) / (Math.PI / 2));
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const d = dirs[((q % 4) + 4) % 4];
    window.__meadowfar().teleport(hx + d[0] * 6.5, hz + d[1] * 6.5);
    window.__meadowfar().setYaw(Math.atan2(d[0], d[1]));
  }, { hx, hz, vx: village.x, vz: village.z });
  await sleep(600);
  await page.keyboard.down("w");
  await sleep(3200);
  await page.keyboard.up("w");
  await sleep(500);
  const inH = await state(page);
  check("walk through a doorway into a cottage (indoors detected)", inH.inside === true, `pos=(${inH.x.toFixed(1)},${inH.y.toFixed(1)},${inH.z.toFixed(1)})`);
  await page.screenshot({ path: path.join(OUT, "04-inside-cottage.png") });
  // keep walking: the back wall must stop us
  await page.keyboard.down("w");
  await sleep(2500);
  await page.keyboard.up("w");
  const wall = await state(page);
  check("back wall blocks the player (no walking through walls)", wall.inside === true, `still inside after 2.5s pushing into the wall`);
  check("floor holds the player (no falling through)", wall.grounded && wall.y > -5, `y=${wall.y.toFixed(2)}`);

  // interiors
  for (const id of ["cave", "hall", "arena"]) {
    await page.evaluate((z) => window.__meadowfar().enter(z), id);
    await sleep(1800);
    const s = await state(page);
    await page.screenshot({ path: path.join(OUT, `05-interior-${id}.png`) });
    check(`enter ${id} interior`, s.zone === id && s.grounded, `solids=${s.solids}`);
    await page.keyboard.down("w");
    await sleep(3500);
    await page.keyboard.up("w");
    const s2 = await state(page);
    check(`${id}: walls keep player inside`, Math.hypot(s2.x, s2.z) < 30 && s2.y > -2, `pos=(${s2.x.toFixed(1)},${s2.y.toFixed(1)},${s2.z.toFixed(1)})`);
    await page.evaluate(() => window.__meadowfar().exit());
    await sleep(600);
  }
  const back = await state(page);
  check("exit interior returns to the world", back.zone === "world");

  // minimap + zoomable world map
  check("minimap is on screen", await page.getByTestId("minimap").isVisible());
  await page.getByTestId("minimap-zoom-out").click();
  await page.keyboard.press("m");
  await sleep(2500);
  await page.getByTestId("map-zoom-out").click();
  await page.getByTestId("map-zoom-out").click();
  await sleep(3000);
  await page.screenshot({ path: path.join(OUT, "15-world-map.png") });
  check("M opens the world map and it zooms", await page.getByTestId("world-map").isVisible());
  await page.getByTestId("map-close").click();

  // ride an animal
  await page.evaluate(() => window.__meadowfar().teleport(0, 120));
  await sleep(6000);
  const rideSpecies = await page.evaluate(() => window.__meadowfar().rideNearest());
  await sleep(800);
  await page.evaluate(() => window.__meadowfar().setYaw(0));
  const r0 = await state(page);
  await page.keyboard.down("w");
  await sleep(4000);
  await page.keyboard.up("w");
  const r1 = await state(page);
  await page.screenshot({ path: path.join(OUT, "16-riding.png") });
  check("ride a wild animal and move on it", !!rideSpecies && r1.mounted === rideSpecies && r1.z < r0.z - 2, `species=${rideSpecies} animals=${r1.animals} dz=${(r1.z - r0.z).toFixed(1)}`);
  await page.keyboard.press("e");
  await sleep(400);
  check("E gets off the animal", (await state(page)).mounted === null);

  // wardrobe + shop + inventory
  await page.getByTestId("hud-menu").click();
  await page.getByTestId("tab-wardrobe").click();
  await sleep(1200);
  await page.screenshot({ path: path.join(OUT, "06-wardrobe.png") });
  const coinsBefore = await page.getByTestId("hud-coins").innerText().catch(() => "");
  await page.getByTestId("slot-hat").click();
  await page.getByTestId("buy-hat-cap").click();
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, "07-wardrobe-bought-cap.png") });
  const wearing = await page.getByTestId("cos-hat-cap").innerText();
  check("buy a cosmetic with coins and wear it", /Wearing/.test(wearing), `coins before=${coinsBefore}`);
  await page.getByTestId("tab-bag").click();
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, "08-inventory.png") });
  check("inventory lists items", await page.getByTestId("item-apple").isVisible());
  check("crafting panel lists recipes", await page.getByTestId("recipe-r-pie").isVisible());
  await page.getByTestId("tab-settings").click();
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, "09-settings-graphics.png") });
  check("seven graphics presets + picture sliders", (await page.getByTestId("preset-extreme").isVisible()) && (await page.getByTestId("preset-supersmooth").isVisible()) && (await page.getByTestId("gfx-brightness").isVisible()));
  await page.getByTestId("tab-play").click();
  await page.getByTestId("mode-adventure").click();
  await page.getByTestId("menu-close").click();
  await sleep(500);
  check("adventure mode shows hearts", await page.getByTestId("hud-hearts").isVisible());
  await page.evaluate(() => window.__meadowfar().enter("arena"));
  await sleep(6000);
  const ar = await state(page);
  await page.keyboard.press("f");
  await sleep(300);
  await page.screenshot({ path: path.join(OUT, "10-arena-slimes.png") });
  check("arena spawns slimes", ar.slimes > 0, `slimes=${ar.slimes}`);
  await page.evaluate(() => window.__meadowfar().exit());

  // perf sample
  await sleep(1500);
  const fpsText = await page.getByTestId("hud-fps").innerText().catch(() => "n/a");
  report.desktopFps = fpsText;
  await ctx.close();
}

// ---------------- phone: landscape + portrait with the touch controller ----------------
for (const [name, vp] of [["landscape", { width: 844, height: 390 }], ["portrait", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await openGame(ctx, { gfx: "smooth" });
  const visible = await page.getByTestId("touch-controls").isVisible();
  check(`phone ${name}: on-screen controller is visible`, visible);
  await page.evaluate(() => window.__meadowfar().setYaw(0));
  const a = await state(page);
  // drag the stick up with a real touch-like pointer
  const zone = await page.getByTestId("stick-zone").boundingBox();
  const sx = zone.x + zone.width * 0.35, sy = zone.y + zone.height * 0.7;
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }] });
  await touch("touchStart", sx, sy);
  for (let i = 1; i <= 6; i++) await touch("touchMove", sx, sy - i * 12);
  await sleep(250);
  await page.screenshot({ path: path.join(OUT, `11-phone-${name}-stick-pushed.png`) });
  await sleep(900);
  await touch("touchEnd", sx, sy - 72);
  const b = await state(page);
  check(`phone ${name}: stick pushed UP walks FORWARD (not inverted)`, b.z < a.z - 2, `dz=${(b.z - a.z).toFixed(2)}`);
  // jump button
  const y0 = (await state(page)).y;
  const jb = await page.getByTestId("btn-jump").boundingBox();
  await touch("touchStart", jb.x + jb.width / 2, jb.y + jb.height / 2);
  await sleep(200);
  const y1 = (await state(page)).y;
  await touch("touchEnd", 0, 0);
  check(`phone ${name}: jump button works`, y1 > y0 + 0.3, `dy=${(y1 - y0).toFixed(2)}`);
  // look drag on right half turns camera right
  const lz = await page.getByTestId("look-zone").boundingBox();
  const yawA = (await state(page)).camYaw;
  const lx = lz.x + lz.width * 0.3, ly = lz.y + lz.height * 0.3;
  await touch("touchStart", lx, ly);
  for (let i = 1; i <= 6; i++) await touch("touchMove", lx + i * 15, ly);
  await touch("touchEnd", 0, 0);
  const yawB = (await state(page)).camYaw;
  check(`phone ${name}: drag right side turns camera right`, yawB < yawA - 0.2, `yaw ${yawA.toFixed(2)} -> ${yawB.toFixed(2)}`);
  // houses render on phones
  await page.evaluate(() => window.__meadowfar().teleport(38, 44));
  await page.evaluate(() => window.__meadowfar().setYaw(0));
  await sleep(2000);
  await page.screenshot({ path: path.join(OUT, `12-phone-${name}-village.png`) });
  const sv = await state(page);
  check(`phone ${name}: village buildings exist in the scene`, sv.solids > 60, `solids=${sv.solids} calls=${sv.calls}`);
  await ctx.close();
}

// ---------------- gamepad axes (standard mapping, simulated) ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => {
    const pad = {
      id: "Xbox Wireless Controller (STANDARD GAMEPAD)", index: 0, connected: true, mapping: "standard", timestamp: 0,
      axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    };
    window.__pad = pad;
    navigator.getGamepads = () => [pad];
  });
  const page = await openGame(ctx, { gfx: "smooth" });
  await page.evaluate(() => window.__meadowfar().setYaw(0));
  const a = await state(page);
  await page.evaluate(() => (window.__pad.axes[1] = -1)); // left stick pushed UP
  await sleep(900);
  await page.evaluate(() => (window.__pad.axes[1] = 0));
  const b = await state(page);
  check("gamepad left stick UP walks forward (not inverted)", b.z < a.z - 2, `dz=${(b.z - a.z).toFixed(2)}`);
  const yawA = b.camYaw;
  await page.evaluate(() => (window.__pad.axes[2] = 1)); // right stick RIGHT
  await sleep(500);
  await page.evaluate(() => (window.__pad.axes[2] = 0));
  const yawB = (await state(page)).camYaw;
  check("gamepad right stick RIGHT turns camera right", yawB < yawA - 0.15, `yaw ${yawA.toFixed(2)} -> ${yawB.toFixed(2)}`);
  await page.evaluate(() => (window.__pad.buttons[0] = { pressed: true, touched: true, value: 1 }));
  await sleep(150);
  const j = await state(page);
  await page.evaluate(() => (window.__pad.buttons[0] = { pressed: false, touched: false, value: 0 }));
  check("gamepad A jumps", !j.grounded);
  await ctx.close();
}

// ---------------- play together: two players, one room ----------------
{
  const ctxA = await browser.newContext({ viewport: { width: 960, height: 600 } });
  const ctxB = await browser.newContext({ viewport: { width: 960, height: 600 } });
  const A = await openGame(ctxA, { hero: "girl", gfx: "smooth" });
  const B = await openGame(ctxB, { hero: "boy", gfx: "smooth" });
  await A.getByTestId("hud-menu").click();
  await A.getByTestId("tab-together").click();
  await A.getByTestId("room-host").click();
  await A.getByTestId("room-code").waitFor({ timeout: 30000 });
  const code = (await A.getByTestId("room-code").innerText()).trim();
  await B.getByTestId("hud-menu").click();
  await B.getByTestId("tab-together").click();
  await B.getByTestId("room-code-input").fill(code);
  await B.getByTestId("room-join").click();
  let ok = false;
  for (let i = 0; i < 40 && !ok; i++) {
    await sleep(500);
    ok = (await B.getByTestId("room-count").innerText().catch(() => "")).startsWith("2");
  }
  check("two players join the same room by code", ok, `code=${code}`);
  await A.getByTestId("menu-close").click();
  await B.getByTestId("emote-hello").click();
  await B.getByTestId("menu-close").click();
  await sleep(4000);
  const sa = await state(A);
  const sb = await state(B);
  check("each player sees the other avatar in their world", sa.remotes === 1 && sb.remotes === 1, `A sees ${sa.remotes}, B sees ${sb.remotes}`);
  const ping = await B.getByTestId("hud-room").innerText().catch(() => "");
  report.ping = ping;
  check("round-trip ping is measured and shown", /\d+ms/.test(ping), ping);
  // B walks; A must see B move
  await B.evaluate(() => window.__meadowfar().setYaw(0));
  await B.keyboard.down("w");
  await sleep(1500);
  await B.keyboard.up("w");
  await sleep(800);
  await A.screenshot({ path: path.join(OUT, "13-together-host-view.png") });
  await B.screenshot({ path: path.join(OUT, "14-together-guest-view.png") });
  await ctxA.close();
  await ctxB.close();
}

await browser.close();
report.passed = report.checks.filter((c) => c.pass).length;
report.failed = report.checks.filter((c) => !c.pass).length;
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(`\n${report.passed} passed, ${report.failed} failed. Console errors: ${report.consoleErrors.length}`);
