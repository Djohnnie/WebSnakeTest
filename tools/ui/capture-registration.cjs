const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = process.env.WEBSNAKE_URL || 'http://127.0.0.1:5067';
const captureRoot = process.env.CAPTURE_ROOT ||
  '/tmp/dghsf-agent-worker/deb88a81f8c94251b822e546bf80b194';
const screenshotDir = path.join(captureRoot, 'screenshots');
const demoDir = path.join(captureRoot, 'demos');
const overlayPath = path.join(demoDir, 'demo-overlay.js');

async function moveAndClick(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Unable to locate a clickable element');
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
  await page.waitForTimeout(180);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function waitForApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Register to enter' }).waitFor();
}

async function main() {
  await fs.mkdir(screenshotDir, { recursive: true });
  await fs.mkdir(demoDir, { recursive: true });
  await fs.copyFile(path.join(__dirname, 'demo-overlay.js'), overlayPath);

  const browser = await chromium.launch({ headless: true });

  // There is no sign-in in this local-only game. Preserve the setup context's
  // storage state so the same reusable flow can host development identity later.
  const setupContext = await browser.newContext();
  const setupPage = await setupContext.newPage();
  await waitForApp(setupPage);
  const storageState = await setupContext.storageState();
  await setupContext.close();

  const captureContext = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 }
  });
  const capturePage = await captureContext.newPage();
  await waitForApp(capturePage);
  await moveAndClick(capturePage, capturePage.getByRole('button', { name: 'START GAME' }));
  await capturePage.getByRole('alert').waitFor();
  await capturePage.waitForTimeout(500);
  await capturePage.screenshot({
    path: path.join(screenshotDir, 'registration-blocks-start.png')
  });

  await capturePage.getByLabel('Player name').fill('Neon Viper');
  await capturePage.getByRole('button', { name: 'Register' }).click();
  await capturePage.getByText('Registered as Neon Viper').waitFor();
  await capturePage.waitForTimeout(500);
  await capturePage.screenshot({
    path: path.join(screenshotDir, 'player-registered.png')
  });

  await moveAndClick(capturePage, capturePage.getByRole('button', { name: 'START GAME' }));
  await capturePage.getByText('Game live').waitFor();
  await capturePage.waitForTimeout(350);
  await capturePage.screenshot({
    path: path.join(screenshotDir, 'game-associated-with-player.png')
  });
  await captureContext.close();

  const demoContext = await browser.newContext({
    storageState,
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: demoDir,
      size: { width: 1280, height: 720 }
    }
  });
  await demoContext.addInitScript({ path: overlayPath });
  const demoPage = await demoContext.newPage();
  await waitForApp(demoPage);
  await demoPage.waitForTimeout(700);

  await demoPage.evaluate(text => window.dghsfCaption(text), 'A game cannot start without a player name');
  await demoPage.waitForTimeout(500);
  await moveAndClick(demoPage, demoPage.getByRole('button', { name: 'START GAME' }));
  await demoPage.getByRole('alert').waitFor();
  await demoPage.waitForTimeout(900);

  await demoPage.evaluate(text => window.dghsfCaption(text), 'Register a unique callsign');
  const nameInput = demoPage.getByLabel('Player name');
  await moveAndClick(demoPage, nameInput);
  await nameInput.pressSequentially('Neon Viper', { delay: 50 });
  await demoPage.waitForTimeout(600);
  await demoPage.evaluate(text => window.dghsfCaption(text), 'Claim the name for this run');
  await moveAndClick(demoPage, demoPage.getByRole('button', { name: 'Register' }));
  await demoPage.getByText('Registered as Neon Viper').waitFor();
  await demoPage.waitForTimeout(900);

  await demoPage.evaluate(text => window.dghsfCaption(text), 'Start playing as Neon Viper');
  await moveAndClick(demoPage, demoPage.getByRole('button', { name: 'START GAME' }));
  await demoPage.getByText('Game live').waitFor();
  await demoPage.waitForTimeout(900);
  const demoPath = await demoPage.video().path();

  await demoContext.close();
  await browser.close();

  const finalDemoPath = path.join(demoDir, 'register-player.webm');
  await fs.rename(demoPath, finalDemoPath);
  console.log(finalDemoPath);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
