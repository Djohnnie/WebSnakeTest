const { chromium } = require("playwright");
const { copyFileSync, mkdirSync, renameSync } = require("node:fs");
const { dirname, join } = require("node:path");

const root = dirname(__dirname);
const url = process.argv[2] || "http://127.0.0.1:5000";
const screenshotPath = process.argv[3] || "/tmp/websnake-slow-effect.png";
const demoDirectory = process.argv[4] || "/tmp/websnake-demos";
const overlayPath = join(demoDirectory, "demo-overlay.js");
const spawnScreenshotPath = join(dirname(screenshotPath), "slow-power-up.png");

function deterministicRun() {
  localStorage.setItem("websnake.playerName", "Maya");
  const values = [0, 206.1 / 396, 0, 206.1 / 396];
  Math.random = () => values.shift() ?? 0;
}

function pausedGameClock() {
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
}

async function clickCentered(page, locator) {
  const box = await locator.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
  await page.waitForTimeout(500);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function main() {
  mkdirSync(dirname(screenshotPath), { recursive: true });
  mkdirSync(demoDirectory, { recursive: true });
  copyFileSync(join(root, "scripts", "demo-overlay.js"), overlayPath);

  const browser = await chromium.launch({ headless: true });
  try {
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    await setupPage.goto(url, { waitUntil: "networkidle" });
    await setupPage.evaluate(() => localStorage.setItem("websnake.playerName", "Maya"));
    const storageState = await setupContext.storageState();
    await setupContext.close();

    const screenshotContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      storageState
    });
    const screenshotPage = await screenshotContext.newPage();
    await screenshotPage.addInitScript(deterministicRun);
    await screenshotPage.addInitScript(pausedGameClock);
    await screenshotPage.goto(url, { waitUntil: "networkidle" });
    await screenshotPage.locator("#start-game").click();
    await screenshotPage.locator("#board-overlay").waitFor({ state: "hidden" });
    await screenshotPage.screenshot({ path: spawnScreenshotPath, fullPage: false });
    await screenshotPage.evaluate(() => window.advanceGameClock(140));
    await screenshotPage.locator("#slow-indicator").waitFor({ state: "visible" });
    await screenshotPage.screenshot({ path: screenshotPath, fullPage: false });
    await screenshotContext.close();

    const demoContext = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      storageState,
      recordVideo: {
        dir: demoDirectory,
        size: { width: 1280, height: 720 }
      }
    });
    const demoPage = await demoContext.newPage();
    await demoPage.addInitScript(deterministicRun);
    await demoPage.addInitScript({ path: overlayPath });
    await demoPage.goto(url, { waitUntil: "networkidle" });
    await demoPage.evaluate((text) => window.dghsfCaption(text), "Start the run");
    await clickCentered(demoPage, demoPage.locator("#start-game"));
    await demoPage.locator("#slow-indicator").waitFor({ state: "visible" });
    await demoPage.evaluate((text) => window.dghsfCaption(text), "The power-up halves speed for five seconds");
    await demoPage.keyboard.press("ArrowUp");
    await demoPage.waitForTimeout(420);

    const route = ["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"];
    let routeIndex = 0;
    while (await demoPage.locator("#slow-indicator").isVisible()) {
      await demoPage.keyboard.press(route[routeIndex % route.length]);
      routeIndex += 1;
      await demoPage.waitForTimeout(350);
    }
    await demoPage.evaluate((text) => window.dghsfCaption(text), "The boost expires automatically");
    await demoPage.waitForTimeout(900);
    await demoPage.evaluate((text) => window.dghsfCaption(text), "");

    const videoPath = await demoPage.video().path();
    await demoContext.close();
    renameSync(videoPath, join(demoDirectory, "slow-effect-demo.webm"));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
