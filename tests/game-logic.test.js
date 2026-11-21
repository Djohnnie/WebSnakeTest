const test = require("node:test");
const assert = require("node:assert/strict");
const {
  chooseFoodPosition,
  choosePowerUpPosition,
  createSlowEffect,
  createSpeedBoost
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
    assert.equal(
      snake.some((segment) => segment.x === food.x && segment.y === food.y),
      false
    );
  }
});

test("no food is created when every cell is occupied", () => {
  const snake = [];
  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 2; x += 1) snake.push({ x, y });
  }

  assert.equal(chooseFoodPosition(2, snake), null);
});

test("power-ups spawn randomly without overlapping the snake or food", () => {
  const snake = [{ x: 0, y: 0 }];
  const food = { x: 1, y: 0 };

  const first = choosePowerUpPosition(2, snake, food, () => 0);
  const last = choosePowerUpPosition(2, snake, food, () => 0.999);

  assert.deepEqual(first, { x: 0, y: 1 });
  assert.deepEqual(last, { x: 1, y: 1 });
  assert.notDeepEqual(first, food);
});

test("a fresh power-up selection replaces the previous board location", () => {
  const snake = [{ x: 0, y: 0 }];
  const food = { x: 1, y: 0 };
  const previous = { x: 0, y: 1 };
  const replacement = choosePowerUpPosition(2, snake, food, () => 0.999);

  assert.notEqual(replacement, previous);
  assert.deepEqual(replacement, { x: 1, y: 1 });
});

test("no power-up is created without another free cell", () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
  const food = { x: 1, y: 1 };

  assert.equal(choosePowerUpPosition(2, snake, food), null);
  assert.equal(choosePowerUpPosition(2, snake, null), null);
});

test("collecting a speed boost keeps the base branch behavior", () => {
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

test("collecting a slow power-up starts a five-second half-speed effect", () => {
  let now = 12000;
  const effect = createSlowEffect(140, 5000, () => now);

  effect.collect();
  assert.equal(effect.isActive(), true);
  assert.equal(effect.getMoveDelay(), 280);
  assert.equal(effect.remainingMilliseconds(), 5000);

  now = 16999;
  assert.equal(effect.isActive(), true);
  assert.equal(effect.getMoveDelay(), 280);

  now = 17000;
  assert.equal(effect.isActive(), false);
  assert.equal(effect.getMoveDelay(), 140);
});

test("a second slow collection refreshes duration without stacking", () => {
  let now = 0;
  const effect = createSlowEffect(140, 5000, () => now);

  effect.collect();
  now = 4000;
  effect.collect();
  assert.equal(effect.getSpeedMultiplier(), 0.5);
  assert.equal(effect.getMoveDelay(), 280);
  assert.equal(effect.remainingMilliseconds(), 5000);

  now = 9000;
  assert.equal(effect.isActive(), false);
  assert.equal(effect.getMoveDelay(), 140);
});

test("movement keeps elapsed time when a slow effect ends", () => {
  let now = 0;
  const effect = createSlowEffect(140, 5000, () => now);

  effect.collect();
  now = 4999;
  assert.equal(effect.getRemainingMoveDelay(4900), 181);

  now = 5000;
  assert.equal(effect.getRemainingMoveDelay(4760), 0);
  assert.equal(effect.getRemainingMoveDelay(4900), 40);
});

test("clearing a slow effect resets active timing and speed", () => {
  let now = 3000;
  const effect = createSlowEffect(140, 5000, () => now);

  effect.collect();
  effect.clear();
  assert.equal(effect.isActive(), false);
  assert.equal(effect.getMoveDelay(), 140);
  assert.equal(effect.remainingMilliseconds(), 0);
});
