const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5067";
const screenshotDirectory = process.env.SCREENSHOT_DIR ||
    "/tmp/websnake-screenshots";
const demoDirectory = process.env.DEMO_DIR ||
    "/tmp/websnake-demos";
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

async function growSnake(page, targetLength) {
    await page.locator(".board-wrap").focus();
    await page.evaluate(targetLength => {
        const boardSize = 25;
        const directions = [
            { key: "ArrowUp", dx: 0, dy: -1 },
            { key: "ArrowRight", dx: 1, dy: 0 },
            { key: "ArrowDown", dx: 0, dy: 1 },
            { key: "ArrowLeft", dx: -1, dy: 0 }
        ];
        const coordinate = element => ({
            x: Math.round(Number.parseFloat(element.style.left) / 4),
            y: Math.round(Number.parseFloat(element.style.top) / 4)
        });

        const pilot = window.setInterval(() => {
            const head = document.querySelector(".snake-head");
            const food = document.querySelector(".food");
            const length = document.querySelectorAll(".snake-segment").length;
            if (!head || !food || length >= targetLength) {
                window.clearInterval(pilot);
                return;
            }

            const start = coordinate(head);
            const target = coordinate(food);
            const occupied = new Set(
                [...document.querySelectorAll(".snake-segment")]
                    .slice(1)
                    .map(element => {
                        const point = coordinate(element);
                        return `${point.x},${point.y}`;
                    }));
            const startKey = `${start.x},${start.y}`;
            const queue = [{ point: start, firstKey: null }];
            const visited = new Set([startKey]);
            let firstKey = null;

            for (let index = 0; index < queue.length; index += 1) {
                const current = queue[index];
                if (current.point.x === target.x && current.point.y === target.y) {
                    firstKey = current.firstKey;
                    break;
                }

                for (const direction of directions) {
                    const point = {
                        x: (current.point.x + direction.dx + boardSize) % boardSize,
                        y: (current.point.y + direction.dy + boardSize) % boardSize
                    };
                    const pointKey = `${point.x},${point.y}`;
                    if (visited.has(pointKey) ||
                        (occupied.has(pointKey) && pointKey !== `${target.x},${target.y}`)) {
                        continue;
                    }

                    visited.add(pointKey);
                    queue.push({ point, firstKey: current.firstKey ?? direction.key });
                }
            }

            if (firstKey) {
                document.querySelector(".board-wrap").dispatchEvent(
                    new KeyboardEvent("keydown", { key: firstKey, bubbles: true }));
            }
        }, 35);
    }, targetLength);
    await page.waitForFunction(
        length => document.querySelectorAll(".snake-segment").length >= length,
        targetLength,
        { timeout: 20000 });
    await page.waitForTimeout(150);
}

async function collideWithSelf(page) {
    await page.evaluate(() => {
        const coordinate = element => ({
            x: Math.round(Number.parseFloat(element.style.left) / 4),
            y: Math.round(Number.parseFloat(element.style.top) / 4)
        });
        const segments = [...document.querySelectorAll(".snake-segment")];
        const [head, neck] = segments.map(coordinate);
        const normalize = value => (value + 25) % 25;
        const dx = normalize(head.x - neck.x);
        const dy = normalize(head.y - neck.y);
        const direction =
            dx === 1 ? "Right" :
            dx === 24 ? "Left" :
            dy === 1 ? "Down" : "Up";
        const clockwise = {
            Up: "Right",
            Right: "Down",
            Down: "Left",
            Left: "Up"
        };
        const opposite = {
            Up: "Down",
            Right: "Left",
            Down: "Up",
            Left: "Right"
        };
        const counterClockwise = {
            Up: "Left",
            Right: "Up",
            Down: "Right",
            Left: "Down"
        };

        window.selfCollisionTurns = [
            clockwise[direction],
            opposite[direction],
            counterClockwise[direction]
        ];
    });

    const turns = await page.evaluate(() => window.selfCollisionTurns);
    await page.locator(".board-wrap").focus();
    for (const turn of turns.slice(0, 2)) {
        const before = await page.locator(".snake-head").evaluate(
            element => [element.style.left, element.style.top]);
        await page.keyboard.press(`Arrow${turn}`);
        await page.waitForFunction(
            previousPosition => {
                const head = document.querySelector(".snake-head");
                return head &&
                    (head.style.left !== previousPosition[0] ||
                     head.style.top !== previousPosition[1]);
            },
            before);
    }

    await page.keyboard.press(`Arrow${turns[2]}`);
    await page.waitForFunction(
        () => document.querySelector(".console-card")?.dataset.gameState === "over",
        null,
        { timeout: 2000 });
    await page.waitForTimeout(700);
}

async function captureScreenshot(browser) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 900 }
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await registerAndStart(page);
    await growSnake(page, 5);
    await collideWithSelf(page);
    await page.locator(".console-card").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({
        path: path.join(screenshotDirectory, "snake-self-collision.png")
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
    await page.evaluate(text => window.dghsfCaption(text), "Grow the snake by chasing blue food");
    await growSnake(page, 5);
    await page.evaluate(text => window.dghsfCaption(text), "Turn across the snake's own trail");
    await collideWithSelf(page);
    await page.evaluate(text => window.dghsfCaption(text), "Self-collision ends the run");
    await page.waitForTimeout(1300);

    const recordedPath = await page.video().path();
    await context.close();
    await fs.copyFile(
        recordedPath,
        path.join(demoDirectory, "snake-self-collision-demo.webm"));
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
