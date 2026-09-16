// Saves the hero picker portraits so face changes can be compared.
//   node scripts/face.mjs [baseUrl] [outName]
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:3217";
const OUT = process.argv[3] || "docs/qa/30-faces.png";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(300000);
await page.addInitScript(() => localStorage.setItem("meadowfar-lang", "en"));
await page.goto(BASE + "/play");
await page.getByTestId("start-mode-casual").click();
await page.getByTestId("hero-girl").waitFor();
await new Promise((r) => setTimeout(r, 15000));
await page.getByTestId("hero-girl").locator("xpath=..").screenshot({ path: OUT });
await browser.close();
