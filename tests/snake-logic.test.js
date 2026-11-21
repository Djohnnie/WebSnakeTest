const test = require("node:test");
const assert = require("node:assert/strict");
const { directions, moveSnake, queueDirection } = require("../wwwroot/snake-logic.js");

test("the snake moves one cell in the requested direction", () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];

  for (const [name, direction] of Object.entries(directions)) {
    const result = moveSnake(snake, direction, { x: 0, y: 0 }, 20);
    assert.deepEqual(result.head, {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    }, name);
    assert.equal(result.collided, false, name);
    assert.equal(result.snake.length, snake.length, name);
  }
});

test("the snake grows when it moves onto food", () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  const result = moveSnake(snake, directions.right, { x: 6, y: 5 }, 20);

  assert.equal(result.ate, true);
  assert.deepEqual(result.snake, [
    { x: 6, y: 5 },
    { x: 5, y: 5 },
    { x: 4, y: 5 },
    { x: 3, y: 5 }
  ]);
});

test("walls and body collisions end movement", () => {
  const wallResult = moveSnake(
    [{ x: 0, y: 5 }, { x: 1, y: 5 }],
    directions.left,
    { x: 10, y: 10 },
    20
  );
  const bodyResult = moveSnake(
    [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
    directions.left,
    { x: 10, y: 10 },
    20
  );

  assert.equal(wallResult.collided, true);
  assert.equal(bodyResult.collided, true);
});

test("direction input cannot immediately reverse the snake", () => {
  const queue = [];

  assert.equal(queueDirection(queue, directions.right, directions.left), false);
  assert.deepEqual(queue, []);
  assert.equal(queueDirection(queue, directions.right, directions.up), true);
  assert.equal(queueDirection(queue, directions.right, directions.down), false);
  assert.deepEqual(queue, [directions.up]);
});

test("rapid turns are applied in order without reversing a queued turn", () => {
  const queue = [];

  assert.equal(queueDirection(queue, directions.right, directions.up), true);
  assert.equal(queueDirection(queue, directions.right, directions.left), true);
  assert.deepEqual(queue, [directions.up, directions.left]);
  assert.equal(queueDirection(queue, directions.right, directions.down), false);
});

test("moving onto a speed power-up reports its collection", () => {
  const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
  const result = moveSnake(
    snake,
    directions.right,
    { x: 0, y: 0 },
    20,
    { x: 6, y: 5 }
  );

  assert.equal(result.collided, false);
  assert.equal(result.collectedPowerUp, true);
});
