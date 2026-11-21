const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const gameLogic = require("../wwwroot/game-logic.js");
const snakeLogic = require("../wwwroot/snake-logic.js");

function createGame(initialLeaderboard, moveSnake = () => ({ collided: true })) {
  const values = new Map([
    ["websnake.playerName", "Ada"],
    ["websnake.leaderboard", JSON.stringify(initialLeaderboard)]
  ]);
  const elements = new Map();
  const context = new Proxy({}, { get: () => () => {} });
  const timers = new Map();
  let nextTimer = 0;
  let failLeaderboardRead = false;

  function element() {
    const listeners = {};
    return {
      width: 400,
      dataset: {},
      addEventListener: (type, listener) => { listeners[type] = listener; },
      click: () => listeners.click(),
      getContext: () => context,
      setAttribute: () => {},
      replaceChildren: () => {},
      append: () => {},
      showModal: () => {},
      close: () => listeners.close()
    };
  }

  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll: () => [],
    createElement: element,
    addEventListener: () => {}
  };
  const localStorage = {
    getItem(key) {
      if (key === "websnake.leaderboard" && failLeaderboardRead) throw new Error("storage unavailable");
      return values.get(key) ?? null;
    },
    setItem: (key, value) => values.set(key, value)
  };

  runInNewContext(readFileSync(require.resolve("../wwwroot/game.js"), "utf8"), {
    document,
    localStorage,
    window: {
      SnakeLogic: { ...snakeLogic, moveSnake },
      WebSnakeGame: gameLogic
    },
    WebSnakeGame: gameLogic,
    requestAnimationFrame: () => {},
    setTimeout: (callback, delay) => {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id)
  });

  return {
    values,
    elements,
    timers,
    failLeaderboardRead: () => { failLeaderboardRead = true; },
    tick(delay) {
      const timer = [...timers].find(([, entry]) => entry.delay === delay);
      assert.ok(timer, `expected a ${delay}ms timer`);
      timers.delete(timer[0]);
      timer[1].callback();
    },
    finishRun() {
      elements.get("#start-game").click();
      this.tick(140);
    }
  };
}

test("finishing a run merges newer persisted standings with the session standings", () => {
  const game = createGame([{ name: "Grace", score: 8 }, { name: "Ada", score: 3 }]);
  game.values.set("websnake.leaderboard", JSON.stringify([
    { name: "ada", score: 7 }, { name: "Linus", score: 5 }
  ]));

  game.finishRun();

  assert.deepEqual(JSON.parse(game.values.get("websnake.leaderboard")), [
    { name: "Grace", score: 8 }, { name: "ada", score: 7 }, { name: "Linus", score: 5 }
  ]);
});

test("leaderboard pauses and resumes movement at the active boost speed", () => {
  const game = createGame([], (snake) => ({ collided: false, snake, collectedPowerUp: true }));
  game.elements.get("#start-game").click();
  game.tick(140);
  assert.ok([...game.timers.values()].some((timer) => timer.delay === 70));

  game.elements.get("#open-leaderboard").click();
  assert.equal(game.elements.get("#game-status").textContent, "PAUSED");
  assert.deepEqual([...game.timers.values()].map((timer) => timer.delay), [5000]);

  game.elements.get("#close-leaderboard").click();
  assert.equal(game.elements.get("#game-status").textContent, "SPEED BOOST · 2X");
  assert.ok([...game.timers.values()].some((timer) => timer.delay === 70));
});

test("a boost expiring during leaderboard pause resumes at normal speed", () => {
  const game = createGame([], (snake) => ({ collided: false, snake, collectedPowerUp: true }));
  game.elements.get("#start-game").click();
  game.tick(140);
  game.elements.get("#open-leaderboard").click();

  game.tick(5000);
  assert.equal(game.elements.get("#game-status").textContent, "PAUSED");
  assert.equal(game.timers.size, 0);

  game.elements.get("#close-leaderboard").click();
  assert.equal(game.elements.get("#game-status").textContent, "IN PROGRESS");
  assert.deepEqual([...game.timers.values()].map((timer) => timer.delay), [140]);
});

test("finishing a run retains session standings when stored standings cannot be read", () => {
  const game = createGame([{ name: "Grace", score: 8 }]);
  game.failLeaderboardRead();

  game.finishRun();

  assert.deepEqual(JSON.parse(game.values.get("websnake.leaderboard")), [
    { name: "Grace", score: 8 }, { name: "Ada", score: 0 }
  ]);
});
