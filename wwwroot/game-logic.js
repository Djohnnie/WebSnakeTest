(function exposeGameLogic(global) {
  function chooseFoodPosition(cells, snake, random = Math.random) {
    const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
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

  function normalizeLeaderboard(entries) {
    if (!Array.isArray(entries)) return [];

    const players = new Map();
    for (const entry of entries) {
      if (!entry || typeof entry.name !== "string") continue;
      const name = entry.name.trim();
      const score = entry.score;
      if (!name || typeof score !== "number" || !Number.isInteger(score) || score < 0) continue;

      const key = name.toLocaleLowerCase();
      const previous = players.get(key);
      if (!previous || score > previous.score) players.set(key, { name, score });
    }

    return [...players.values()].sort((first, second) =>
      second.score - first.score || first.name.localeCompare(second.name)
    );
  }

  function parseLeaderboard(value) {
    if (!value) return [];
    try {
      return normalizeLeaderboard(JSON.parse(value));
    } catch {
      return [];
    }
  }

  function recordLeaderboardScore(entries, name, score, limit = 10) {
    const standings = normalizeLeaderboard(entries);
    const cleanName = String(name).trim();
    if (!cleanName || !Number.isInteger(score) || score < 0) return standings.slice(0, limit);

    return normalizeLeaderboard([...standings, { name: cleanName, score }]).slice(0, limit);
  }

  const gameLogic = { chooseFoodPosition, parseLeaderboard, recordLeaderboardScore };
  global.WebSnakeGame = gameLogic;

  if (typeof module !== "undefined" && module.exports) module.exports = gameLogic;
})(globalThis);
