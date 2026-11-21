((root, factory) => {
  const logic = factory();
  if (typeof module === "object" && module.exports) module.exports = logic;
  else root.SnakeLogic = logic;
})(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const directions = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 }),
    right: Object.freeze({ x: 1, y: 0 })
  });

  function sameDirection(first, second) {
    return first.x === second.x && first.y === second.y;
  }

  function isOppositeDirection(first, second) {
    return first.x === -second.x && first.y === -second.y;
  }

  function queueDirection(queue, current, requested) {
    const previous = queue.length ? queue[queue.length - 1] : current;
    if (sameDirection(previous, requested) || isOppositeDirection(previous, requested) || queue.length >= 2) {
      return false;
    }
    queue.push({ ...requested });
    return true;
  }

  function moveSnake(snake, direction, food, cells, powerUp = null) {
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const ate = head.x === food.x && head.y === food.y;
    const collectedPowerUp = Boolean(
      powerUp && head.x === powerUp.x && head.y === powerUp.y
    );
    const body = ate ? snake : snake.slice(0, -1);
    const collided =
      head.x < 0 ||
      head.x >= cells ||
      head.y < 0 ||
      head.y >= cells ||
      body.some((segment) => segment.x === head.x && segment.y === head.y);

    if (collided) return { collided, ate: false, collectedPowerUp: false, head, snake };

    const nextSnake = [head, ...(ate ? snake : snake.slice(0, -1))];
    return { collided: false, ate, collectedPowerUp, head, snake: nextSnake };
  }

  return { directions, queueDirection, moveSnake };
});
