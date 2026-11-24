const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5067";
const screenshotDirectory = process.env.SCREENSHOT_DIR ||
    "/tmp/dghsf-agent-worker/d5e266221a084394b219d94201ff1a33/screenshots";
const demoDirectory = process.env.DEMO_DIR ||
    "/tmp/dghsf-agent-worker/d5e266221a084394b219d94201ff1a33/demos";
const overlayPath = process.env.DEMO_OVERLAY_PATH ||
    path.join(__dirname, "demo-overlay.js");

async function moveAndClick(page, locator) {
    const box = await locator.boundingBox();
    if (!box) {
        throw new Error("Cannot click an element without a bounding box.");
    }

    await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
        { steps: 15 });
    await locator.click();
    await page.waitForTimeout(900);
}

async function registerAndStart(page) {
    const playerName = page.locator("#player-name");
    await playerName.pressSequentially("Neon Viper", { delay: 50 });
    await page.evaluate(text => window.dghsfCaption?.(text), "Register the player");
    await moveAndClick(page, page.locator(".register-button"));
    await page.evaluate(text => window.dghsfCaption?.(text), "Start the 25 by 25 game");
    await moveAndClick(page, page.locator(".start-button"));
}

async function captureScreenshot(browser) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 }
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await registerAndStart(page);
    await page.locator(".console-card").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
        path: path.join(screenshotDirectory, "snake-25x25-running.png")
    });
    await context.close();
}

async function prepareContext(browser) {
    const setupContext = await browser.newContext();
    const setupPage = await setupContext.newPage();
    await setupPage.goto(baseUrl, { waitUntil: "networkidle" });
    const storageState = await setupContext.storageState();
    await setupContext.close();
    return storageState;
}

async function captureDemo(browser) {
    const storageState = await prepareContext(browser);
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        storageState,
        recordVideo: {
            dir: demoDirectory,
            size: { width: 1280, height: 720 }
        }
    });
    await context.addInitScript({ path: overlayPath });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await registerAndStart(page);
    await page.locator(".console-card").scrollIntoViewIfNeeded();
    await page.evaluate(text => window.dghsfCaption(text), "Steer the snake around the board");
    await moveAndClick(page, page.getByRole("button", { name: "Move down" }));
    await moveAndClick(page, page.getByRole("button", { name: "Move left" }));
    await page.evaluate(text => window.dghsfCaption(text), "Edge crossings wrap to the opposite side");
    await page.waitForTimeout(1700);

    const recordedPath = await page.video().path();
    await context.close();
    await fs.copyFile(
        recordedPath,
        path.join(demoDirectory, "snake-movement-demo.webm"));
}

async function main() {
    await fs.mkdir(screenshotDirectory, { recursive: true });
    await fs.mkdir(demoDirectory, { recursive: true });

    const browser = await chromium.launch({ headless: true });
    try {
        await captureScreenshot(browser);
        await captureDemo(browser);
    } finally {
        await browser.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
