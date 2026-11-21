(function exposeGameLogic(global) {
  function samePosition(first, second) {
    return Boolean(first && second && first.x === second.x && first.y === second.y);
  }

  function chooseOpenPosition(cells, occupiedPositions, random = Math.random) {
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
    return chooseOpenPosition(cells, snake, random);
  }

  function choosePowerUpPosition(cells, snake, food, random = Math.random) {
    return chooseOpenPosition(cells, food ? [...snake, food] : snake, random);
  }

  function collectPowerUp(head, powerUp, slowEffectUntil, now, duration = 5000) {
    if (!samePosition(head, powerUp)) {
      return { collected: false, powerUp, slowEffectUntil };
    }

    return {
      collected: true,
      powerUp: null,
      slowEffectUntil: now + duration
    };
  }

  function isSlowEffectActive(slowEffectUntil, now) {
    return slowEffectUntil > now;
  }

  function getMoveDelay(normalDelay, slowEffectUntil, now) {
    return isSlowEffectActive(slowEffectUntil, now) ? normalDelay * 2 : normalDelay;
  }

  function getRemainingMoveDelay(normalDelay, slowEffectUntil, now, lastMoveAt) {
    const elapsed = Math.max(0, now - lastMoveAt);
    return Math.max(0, getMoveDelay(normalDelay, slowEffectUntil, now) - elapsed);
  }

  function resetSlowEffect() {
    return 0;
  }

  const gameLogic = {
    chooseFoodPosition,
    choosePowerUpPosition,
    collectPowerUp,
    getMoveDelay,
    getRemainingMoveDelay,
    isSlowEffectActive,
    resetSlowEffect,
    samePosition
  };
  global.WebSnakeGame = gameLogic;

  if (typeof module !== "undefined" && module.exports) module.exports = gameLogic;
})(globalThis);
