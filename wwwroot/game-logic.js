(function exposeGameLogic(global) {
  function chooseFreePosition(cells, occupiedPositions, random = Math.random) {
    const occupied = new Set(occupiedPositions.map((position) => `${position.x},${position.y}`));
    const available = [];

    for (let y = 0; y < cells; y += 1) {
      for (let x = 0; x < cells; x += 1) {
        if (!occupied.has(`${x},${y}`)) available.push({ x, y });
      }
    }

    if (available.length === 0) return null;

    const index = Math.min(Math.floor(random() * available.length), available.length - 1);
    return available[index];
  }

  function chooseFoodPosition(cells, snake, random = Math.random) {
    return chooseFreePosition(cells, snake, random);
  }

  function choosePowerUpPosition(cells, snake, food, random = Math.random) {
    if (!food) return null;
    return chooseFreePosition(cells, [...snake, food], random);
  }

  function createSpeedBoost(normalMoveDelay = 140, duration = 5000, now = Date.now) {
    let expiresAt = null;

    function remainingMilliseconds() {
      if (expiresAt === null) return 0;
      return Math.max(0, expiresAt - now());
    }

    function isActive() {
      if (remainingMilliseconds() === 0) {
        expiresAt = null;
        return false;
      }
      return true;
    }

    return {
      collect() {
        expiresAt = now() + duration;
      },
      clear() {
        expiresAt = null;
      },
      duration,
      getMoveDelay() {
        return isActive() ? normalMoveDelay / 2 : normalMoveDelay;
      },
      getSpeedMultiplier() {
        return isActive() ? 2 : 1;
      },
      isActive,
      remainingMilliseconds
    };
  }

  const gameLogic = { chooseFoodPosition, choosePowerUpPosition, createSpeedBoost };
  global.WebSnakeGame = gameLogic;

  if (typeof module !== "undefined" && module.exports) module.exports = gameLogic;
})(globalThis);
