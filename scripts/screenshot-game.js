const { chromium } = require("playwright");
const { mkdirSync } = require("node:fs");
const { dirname } = require("node:path");

const url = process.argv[2] || "http://localhost:5000";
const output = process.argv[3] || "screenshots/game.png";
const slowedOutput = process.argv[4];
mkdirSync(dirname(output), { recursive: true });
if (slowedOutput) mkdirSync(dirname(slowedOutput), { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => {
      localStorage.setItem("websnake.playerName", "Maya");
      const rolls = [0, 206.5 / 396, 0, 206.5 / 396];
      Math.random = () => rolls.shift() ?? 0;
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /start game/i }).click();
    await page.locator("#board-overlay").waitFor({ state: "hidden" });
    await page.screenshot({ path: output, fullPage: false });
    if (!slowedOutput) return;
    await page.waitForFunction(() => document.querySelector("#game-status")?.textContent.includes("SLOWED"));
    await page.screenshot({ path: slowedOutput, fullPage: false });
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
