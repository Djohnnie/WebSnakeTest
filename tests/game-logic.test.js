const test = require("node:test");
const assert = require("node:assert/strict");
const {
  chooseFoodPosition,
  parseLeaderboard,
  recordLeaderboardScore
} = require("../wwwroot/game-logic.js");

test("food is placed on a random grid cell", () => {
  const first = chooseFoodPosition(3, [{ x: 1, y: 1 }], () => 0);
  const last = chooseFoodPosition(3, [{ x: 1, y: 1 }], () => 0.999);

  assert.deepEqual(first, { x: 0, y: 0 });
  assert.deepEqual(last, { x: 2, y: 2 });
  assert.notDeepEqual(first, last);
});

test("food never appears on the snake", () => {
  const snake = [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 }
  ];

  for (const value of [0, 0.2, 0.5, 0.999]) {
    const food = chooseFoodPosition(3, snake, () => value);
    assert.equal(snake.some((segment) => segment.x === food.x && segment.y === food.y), false);
  }
});

test("no food is created when every cell is occupied", () => {
  const snake = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 2; x += 1) snake.push({ x, y });
  }

  assert.equal(chooseFoodPosition(2, snake), null);
});

test("leaderboard scores are sorted and limited to each player's best", () => {
  let standings = recordLeaderboardScore([], "Ada", 3);
  standings = recordLeaderboardScore(standings, "Grace", 5);
  standings = recordLeaderboardScore(standings, "Ada", 2);
  standings = recordLeaderboardScore(standings, "ada", 7);
  standings = recordLeaderboardScore(standings, "Linus", 4, 2);

  assert.deepEqual(standings, [
    { name: "ada", score: 7 },
    { name: "Grace", score: 5 }
  ]);
});

test("leaderboard storage is parsed safely and invalid entries are ignored", () => {
  assert.deepEqual(parseLeaderboard(null), []);
  assert.deepEqual(parseLeaderboard("{broken"), []);
  assert.deepEqual(parseLeaderboard(JSON.stringify([
    { name: "Ada", score: 4 },
    { name: " ", score: 8 },
    { name: "Grace", score: -1 },
    { name: "Linus", score: "6" }
  ])), [{ name: "Ada", score: 4 }]);
});
