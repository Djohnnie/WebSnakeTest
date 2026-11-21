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
      children: [],
      addEventListener: (type, listener) => { listeners[type] = listener; },
      click: () => listeners.click(),
      getContext: () => context,
      setAttribute: () => {},
      replaceChildren(...children) { this.children = children; },
      append(...children) { this.children.push(...children); },
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

function renderedStandings(game) {
  return game.elements.get("#leaderboard-list").children.map((item) =>
    item.children.map((child) => child.textContent)
  );
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

test("opening the leaderboard refreshes and merges the latest persisted standings", () => {
  const game = createGame([]);
  assert.equal(game.elements.get("#leaderboard-empty").hidden, false);
  game.values.set("websnake.leaderboard", JSON.stringify([
    { name: "Ada", score: 3 }, { name: "ada", score: 7 }, { name: "Grace", score: 8 }
  ]));

  game.elements.get("#open-leaderboard").click();
  assert.equal(game.elements.get("#leaderboard-empty").hidden, true);
  assert.deepEqual(renderedStandings(game), [
    ["01", "Grace", "8 PTS"], ["02", "ada", "7 PTS"]
  ]);
  game.elements.get("#close-leaderboard").click();
  game.values.set("websnake.leaderboard", JSON.stringify([
    { name: "Ada", score: 2 }, { name: "Linus", score: 5 }
  ]));
  game.elements.get("#open-leaderboard").click();
  assert.deepEqual(renderedStandings(game), [
    ["01", "Grace", "8 PTS"], ["02", "ada", "7 PTS"], ["03", "Linus", "5 PTS"]
  ]);
  game.elements.get("#close-leaderboard").click();
  game.values.set("websnake.leaderboard", JSON.stringify([
    ...Array.from({ length: 10 }, (_, index) => ({ name: `Player ${index}`, score: index + 10 })),
    { name: "Ada", score: 2 }, { name: "Invalid", score: -1 }
  ]));

  game.elements.get("#open-leaderboard").click();
  assert.equal(renderedStandings(game).length, 10);
  assert.deepEqual(renderedStandings(game)[0], ["01", "Player 9", "19 PTS"]);
  assert.deepEqual(renderedStandings(game)[9], ["10", "Player 0", "10 PTS"]);
});

test("opening the leaderboard retains session standings when storage is invalid or unavailable", () => {
  const game = createGame([{ name: "Grace", score: 8 }]);
  game.values.set("websnake.leaderboard", "{broken");

  game.elements.get("#open-leaderboard").click();
  assert.deepEqual(renderedStandings(game), [["01", "Grace", "8 PTS"]]);
  game.elements.get("#close-leaderboard").click();
  game.failLeaderboardRead();
  game.elements.get("#open-leaderboard").click();
  assert.deepEqual(renderedStandings(game), [["01", "Grace", "8 PTS"]]);
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
