const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
const gameLogic = require("../wwwroot/game-logic.js");
const snakeLogic = require("../wwwroot/snake-logic.js");

function createGame(initialLeaderboard) {
  const values = new Map([
    ["websnake.playerName", "Ada"],
    ["websnake.leaderboard", JSON.stringify(initialLeaderboard)]
  ]);
  const elements = new Map();
  const context = new Proxy({}, { get: () => () => {} });
  let tick;
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
      append: () => {}
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
      SnakeLogic: { ...snakeLogic, moveSnake: () => ({ collided: true }) },
      WebSnakeGame: gameLogic
    },
    WebSnakeGame: gameLogic,
    requestAnimationFrame: () => {},
    setInterval: (callback) => { tick = callback; },
    clearInterval: () => {}
  });

  return {
    values,
    failLeaderboardRead: () => { failLeaderboardRead = true; },
    finishRun() {
      elements.get("#start-game").click();
      tick();
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

test("finishing a run retains session standings when stored standings cannot be read", () => {
  const game = createGame([{ name: "Grace", score: 8 }]);
  game.failLeaderboardRead();

  game.finishRun();

  assert.deepEqual(JSON.parse(game.values.get("websnake.leaderboard")), [
    { name: "Grace", score: 8 }, { name: "Ada", score: 0 }
  ]);
});
