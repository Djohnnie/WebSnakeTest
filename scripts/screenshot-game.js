const { chromium } = require("playwright");
const { mkdirSync } = require("node:fs");
const { dirname } = require("node:path");

const url = process.argv[2] || "http://localhost:5000";
const output = process.argv[3] || "screenshots/game.png";
mkdirSync(dirname(output), { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => localStorage.setItem("websnake.playerName", "Maya"));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /start game/i }).click();
    await page.keyboard.press("ArrowUp");
    await page.waitForFunction(() => {
      const board = document.querySelector("#game-board");
      return board?.getAttribute("aria-label")?.includes("row 10");
    });
    await page.screenshot({ path: output, fullPage: false });
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
