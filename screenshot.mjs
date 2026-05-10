import { createRequire } from "module";
import { mkdir } from "fs/promises";
import { existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const puppeteer = require("C:/Users/tp/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer");

const url   = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";

const screenshotDir = join(__dirname, "temporary screenshots");
await mkdir(screenshotDir, { recursive: true });

const existing = existsSync(screenshotDir)
  ? readdirSync(screenshotDir).filter(f => f.endsWith(".png")).length
  : 0;
const N = existing + 1;
const filename = label ? `screenshot-${N}-${label}.png` : `screenshot-${N}.png`;
const outPath = join(screenshotDir, filename);

const chromePath = "C:/Users/tp/.cache/puppeteer/chrome/win64-148.0.7778.97/chrome-win64/chrome.exe";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

// Scroll through page to trigger IntersectionObserver animations
await page.evaluate(async () => {
  await new Promise((resolve) => {
    let pos = 0;
    const step = 400;
    const timer = setInterval(() => {
      window.scrollBy(0, step);
      pos += step;
      if (pos >= document.body.scrollHeight) {
        clearInterval(timer);
        window.scrollTo(0, 0);
        resolve();
      }
    }, 60);
  });
});
await new Promise(r => setTimeout(r, 1800));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
