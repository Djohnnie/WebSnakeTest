const test = require("node:test");
const assert = require("node:assert/strict");
const {
  chooseFoodPosition,
  choosePowerUpPosition,
  createSpeedBoost,
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

test("loaded standings are normalized before selecting the top ten", () => {
  const entries = Array.from({ length: 12 }, (_, score) => ({ name: `Player ${score}`, score }));
  entries.push({ name: " player 0 ", score: 20 }, { name: "", score: 100 });

  assert.deepEqual(parseLeaderboard(JSON.stringify(entries)), [
    { name: "player 0", score: 20 },
    ...entries.slice(3, 12).reverse()
  ]);
});

test("speed power-ups are placed away from the snake and food", () => {
  const snake = [{ x: 1, y: 1 }, { x: 0, y: 1 }];
  const food = { x: 0, y: 0 };

  for (const value of [0, 0.25, 0.5, 0.999]) {
    const powerUp = choosePowerUpPosition(2, snake, food, () => value);
    assert.ok(powerUp);
    assert.equal(powerUp.x === food.x && powerUp.y === food.y, false);
    assert.equal(snake.some((segment) =>
      segment.x === powerUp.x && segment.y === powerUp.y
    ), false);
  }
});

test("no speed power-up is created without another free cell", () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
  const food = { x: 1, y: 1 };

  assert.equal(choosePowerUpPosition(2, snake, food), null);
  assert.equal(choosePowerUpPosition(2, snake, null), null);
});

test("collecting a power-up doubles speed for five seconds", () => {
  let now = 1000;
  const boost = createSpeedBoost(140, 5000, () => now);

  boost.collect();
  assert.equal(boost.getSpeedMultiplier(), 2);
  assert.equal(boost.getMoveDelay(), 70);
  assert.equal(boost.remainingMilliseconds(), 5000);

  now += 5000;
  assert.equal(boost.isActive(), false);
  assert.equal(boost.getSpeedMultiplier(), 1);
  assert.equal(boost.getMoveDelay(), 140);
});

test("repeated collection restarts the duration without stacking", () => {
  let now = 0;
  const boost = createSpeedBoost(140, 5000, () => now);

  boost.collect();
  now = 4000;
  boost.collect();
  assert.equal(boost.getSpeedMultiplier(), 2);
  assert.equal(boost.remainingMilliseconds(), 5000);

  now = 8999;
  assert.equal(boost.isActive(), true);
  now = 9000;
  assert.equal(boost.isActive(), false);
});

test("clearing a boost removes its speed and timer state", () => {
  let now = 250;
  const boost = createSpeedBoost(140, 5000, () => now);

  boost.collect();
  boost.clear();
  assert.equal(boost.isActive(), false);
  assert.equal(boost.getMoveDelay(), 140);
  assert.equal(boost.remainingMilliseconds(), 0);
});
