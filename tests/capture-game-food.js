const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

async function main() {
  const url = process.argv[2] || "http://127.0.0.1:5000";
  const output = process.argv[3] || "screenshots/game-food.png";
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.addInitScript(() => {
      localStorage.setItem("websnake.playerName", "Arcade Player");
    });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.locator("#start-game").click();
    await page.locator("#board-overlay").waitFor({ state: "hidden" });
    await page.waitForTimeout(150);

    await mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, fullPage: true });
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
