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
      const rolls = [0, 206.1 / 396, 0, 206.1 / 396];
      Math.random = () => rolls.shift() ?? 0;

      let now = 1000;
      let nextTimer = 1;
      const timers = new Map();
      Date.now = () => now;
      window.setTimeout = (callback, delay = 0, ...args) => {
        const id = nextTimer;
        nextTimer += 1;
        timers.set(id, {
          callback: () => callback(...args),
          due: now + Math.max(0, Number(delay) || 0)
        });
        return id;
      };
      window.clearTimeout = (id) => timers.delete(id);
      window.advanceGameClock = (milliseconds) => {
        const target = now + milliseconds;
        while (true) {
          const next = [...timers.entries()]
            .filter(([, timer]) => timer.due <= target)
            .sort((first, second) => first[1].due - second[1].due || first[0] - second[0])[0];
          if (!next) break;
          const [id, timer] = next;
          timers.delete(id);
          now = timer.due;
          timer.callback();
        }
        now = target;
      };
    });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /start game/i }).click();
    await page.locator("#board-overlay").waitFor({ state: "hidden" });
    await page.screenshot({ path: output, fullPage: false });

    if (!slowedOutput) return;
    await page.evaluate(() => window.advanceGameClock(140));
    await page.locator("#game-status").waitFor({ state: "visible" });
    await page.waitForFunction(() =>
      document.querySelector("#game-status")?.textContent.includes("SLOWED")
    );
    await page.screenshot({ path: slowedOutput, fullPage: false });
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
