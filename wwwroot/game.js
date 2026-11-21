(() => {
  const nameScreen = document.querySelector("#name-screen");
  const gameScreen = document.querySelector("#game-screen");
  const nameForm = document.querySelector("#name-form");
  const nameInput = document.querySelector("#player-name");
  const errorMessage = document.querySelector("#name-error");
  const count = document.querySelector("#character-count");
  const gamePlayerName = document.querySelector("#game-player-name");
  const playerDisplayName = document.querySelector("#player-display-name");
  const nameButton = document.querySelector("#change-name");
  const canvas = document.querySelector("#game-board");
  const context = canvas.getContext("2d");
  const overlay = document.querySelector("#board-overlay");
  const overlayTitle = document.querySelector("#overlay-title");
  const overlayCopy = document.querySelector("#overlay-copy");
  const startButton = document.querySelector("#start-game");
  const gameStatus = document.querySelector("#game-status");
  const scoreDisplay = document.querySelector("#current-score");
  const highScoreDisplay = document.querySelector("#high-score");
  const boostIndicator = document.querySelector("#boost-indicator");
  const directionButtons = document.querySelectorAll("[data-direction]");
  const leaderboardDialog = document.querySelector("#leaderboard-dialog");
  const leaderboardList = document.querySelector("#leaderboard-list");
  const leaderboardEmpty = document.querySelector("#leaderboard-empty");
  const openLeaderboard = document.querySelector("#open-leaderboard");
  const closeLeaderboard = document.querySelector("#close-leaderboard");
  const { directions, queueDirection, moveSnake } = window.SnakeLogic;
  const {
    chooseFoodPosition, choosePowerUpPosition, createSpeedBoost,
    parseLeaderboard, mergeLeaderboard, recordLeaderboardScore
  } = window.WebSnakeGame;

  const cells = 20;
  const cellSize = canvas.width / cells;
  const storageKeys = {
    name: "websnake.playerName",
    score: "websnake.highScore",
    leaderboard: "websnake.leaderboard"
  };
  function readStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function storeValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage is optional; the current session can continue without persistence.
    }
  }

  let playerName = readStoredValue(storageKeys.name) || "";
  let highScore = Number(readStoredValue(storageKeys.score)) || 0;
  let leaderboard = parseLeaderboard(readStoredValue(storageKeys.leaderboard));
  let snake;
  let food;
  let powerUp;
  let direction;
  let directionQueue = [];
  let score = 0;
  let timer;
  let boostTimer;
  let running = false;
  let leaderboardPausedGame = false;
  let pointerStart;
  let activePointerId;
  const speedBoost = createSpeedBoost();

  function drawBoard() {
    context.fillStyle = "#141c16";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(151, 174, 135, 0.075)";
    context.lineWidth = 1;
    for (let cell = 1; cell < cells; cell += 1) {
      const position = cell * cellSize;
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, canvas.height);
      context.moveTo(0, position);
      context.lineTo(canvas.width, position);
      context.stroke();
    }

    if (!snake) return;
    canvas.setAttribute(
      "aria-label",
      `Snake game board. Head at column ${snake[0].x + 1}, row ${snake[0].y + 1}.` +
        (powerUp
          ? ` Speed power-up at column ${powerUp.x + 1}, row ${powerUp.y + 1}.`
          : speedBoost.isActive()
            ? " Speed boost active."
            : "")
    );
    context.fillStyle = "#ff7968";
    context.shadowColor = "#ff7968";
    context.shadowBlur = 14;
    context.beginPath();
    context.arc((food.x + 0.5) * cellSize, (food.y + 0.5) * cellSize, cellSize * 0.31, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    if (powerUp) {
      const centerX = (powerUp.x + 0.5) * cellSize;
      const centerY = (powerUp.y + 0.5) * cellSize;
      context.fillStyle = "#61d8e2";
      context.shadowColor = "#61d8e2";
      context.shadowBlur = 13;
      context.beginPath();
      context.moveTo(centerX, centerY - cellSize * 0.36);
      context.lineTo(centerX + cellSize * 0.3, centerY);
      context.lineTo(centerX, centerY + cellSize * 0.36);
      context.lineTo(centerX - cellSize * 0.3, centerY);
      context.closePath();
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "#10292b";
      context.beginPath();
      context.moveTo(centerX + 1, centerY - 6);
      context.lineTo(centerX - 3, centerY + 1);
      context.lineTo(centerX + 1, centerY);
      context.lineTo(centerX - 1, centerY + 6);
      context.lineTo(centerX + 4, centerY - 2);
      context.lineTo(centerX + 1, centerY - 1);
      context.closePath();
      context.fill();
    }

    snake.forEach((segment, index) => {
      const inset = index === 0 ? 2 : 3;
      context.fillStyle = index === 0 ? "#d4ff9b" : "#91ca51";
      context.beginPath();
      context.roundRect(segment.x * cellSize + inset, segment.y * cellSize + inset, cellSize - inset * 2, cellSize - inset * 2, 5);
      context.fill();
      if (index === 0) {
        context.fillStyle = "#192315";
        const eyeOffsetX = direction.x === 0 ? 5 : direction.x > 0 ? 12 : 4;
        const eyeOffsetY = direction.y === 0 ? 5 : direction.y > 0 ? 12 : 4;
        context.fillRect(segment.x * cellSize + eyeOffsetX, segment.y * cellSize + eyeOffsetY, 2, 2);
        context.fillRect(segment.x * cellSize + eyeOffsetX + (direction.x === 0 ? 5 : 0), segment.y * cellSize + eyeOffsetY + (direction.y === 0 ? 5 : 0), 2, 2);
      }
    });
  }

  function showNameScreen() {
    running = false;
    clearGameTimers();
    speedBoost.clear();
    boostIndicator.hidden = true;
    gameScreen.hidden = true;
    nameScreen.hidden = false;
    nameInput.value = playerName;
    updateCount();
    requestAnimationFrame(() => nameInput.focus());
  }

  function showGameScreen() {
    nameScreen.hidden = true;
    gameScreen.hidden = false;
    gamePlayerName.textContent = playerName;
    playerDisplayName.textContent = playerName;
    highScoreDisplay.textContent = String(highScore).padStart(2, "0");
    resetGame();
    requestAnimationFrame(() => {
      drawBoard();
      startButton.focus();
    });
  }

  function updateCount() {
    count.textContent = `${nameInput.value.length}/24`;
    errorMessage.hidden = true;
  }

  function renderLeaderboard() {
    leaderboardList.replaceChildren();
    leaderboardEmpty.hidden = leaderboard.length > 0;
    leaderboard.forEach((entry, index) => {
      const item = document.createElement("li");
      const rank = document.createElement("span");
      const name = document.createElement("span");
      const points = document.createElement("strong");
      rank.className = "leaderboard-rank";
      rank.textContent = String(index + 1).padStart(2, "0");
      name.className = "leaderboard-name";
      name.textContent = entry.name;
      points.textContent = `${entry.score} ${entry.score === 1 ? "PT" : "PTS"}`;
      item.append(rank, name, points);
      leaderboardList.append(item);
    });
  }

  function placeFood() {
    food = chooseFoodPosition(cells, snake);
    powerUp = choosePowerUpPosition(cells, snake, food);
  }

  function clearGameTimers() {
    clearTimeout(timer);
    clearTimeout(boostTimer);
    timer = undefined;
    boostTimer = undefined;
  }

  function updateBoostDisplay() {
    const active = speedBoost.isActive();
    boostIndicator.hidden = !active;
    gameStatus.textContent = leaderboardPausedGame ? "PAUSED" : active ? "SPEED BOOST · 2X" : running ? "IN PROGRESS" : "READY WHEN YOU ARE";
  }

  function endBoost() {
    speedBoost.clear();
    boostTimer = undefined;
    updateBoostDisplay();
    if (running) {
      clearTimeout(timer);
      scheduleMove();
    }
    drawBoard();
  }

  function collectSpeedBoost() {
    powerUp = null;
    speedBoost.collect();
    clearTimeout(boostTimer);
    boostTimer = setTimeout(endBoost, speedBoost.duration);
    updateBoostDisplay();
  }

  function scheduleMove() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      move();
      if (running) scheduleMove();
    }, speedBoost.getMoveDelay());
  }

  function resetGame() {
    running = false;
    clearGameTimers();
    speedBoost.clear();
    boostIndicator.hidden = true;
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    direction = { x: 1, y: 0 };
    directionQueue = [];
    score = 0;
    scoreDisplay.textContent = "00";
    gameStatus.textContent = "READY WHEN YOU ARE";
    overlayTitle.textContent = "Your run starts here";
    overlayCopy.textContent = "Use the arrows, WASD, or swipe the board to guide your snake.";
    startButton.innerHTML = 'START GAME <span aria-hidden="true">→</span>';
    overlay.hidden = false;
    placeFood();
    drawBoard();
  }

  function finishGame() {
    running = false;
    clearGameTimers();
    speedBoost.clear();
    boostIndicator.hidden = true;
    gameStatus.textContent = "RUN COMPLETE";
    overlayTitle.textContent = "Nice run, " + playerName;
    overlayCopy.textContent = `You collected ${score} ${score === 1 ? "fruit" : "fruits"}. Ready for another?`;
    startButton.innerHTML = 'PLAY AGAIN <span aria-hidden="true">→</span>';
    overlay.hidden = false;
    requestAnimationFrame(() => startButton.focus());
    highScore = Math.max(score, highScore);
    storeValue(storageKeys.score, String(highScore));
    highScoreDisplay.textContent = String(highScore).padStart(2, "0");
    const storedLeaderboard = parseLeaderboard(readStoredValue(storageKeys.leaderboard));
    leaderboard = recordLeaderboardScore([...leaderboard, ...storedLeaderboard], playerName, score);
    storeValue(storageKeys.leaderboard, JSON.stringify(leaderboard));
    renderLeaderboard();
  }

  function move() {
    if (directionQueue.length) direction = directionQueue.shift();
    const result = moveSnake(snake, direction, food, cells, powerUp);
    if (result.collided) {
      finishGame();
      return;
    }

    snake = result.snake;
    if (result.collectedPowerUp) collectSpeedBoost();
    if (result.ate) {
      score += 1;
      scoreDisplay.textContent = String(score).padStart(2, "0");
      if (snake.length === cells * cells) {
        finishGame();
        drawBoard();
        return;
      }
      placeFood();
    }
    drawBoard();
  }

  function requestDirection(requested) {
    if (!running) return;
    queueDirection(directionQueue, direction, requested);
  }

  function directionFromPointer(pointerEnd) {
    if (!pointerStart) return null;
    const horizontal = pointerEnd.x - pointerStart.x;
    const vertical = pointerEnd.y - pointerStart.y;
    if (Math.max(Math.abs(horizontal), Math.abs(vertical)) < 20) return null;
    if (Math.abs(horizontal) > Math.abs(vertical)) return horizontal > 0 ? directions.right : directions.left;
    return vertical > 0 ? directions.down : directions.up;
  }

  nameInput.addEventListener("input", updateCount);
  nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const chosenName = nameInput.value.trim();
    if (!chosenName) {
      errorMessage.hidden = false;
      nameInput.focus();
      return;
    }
    playerName = chosenName;
    storeValue(storageKeys.name, playerName);
    showGameScreen();
  });
  nameButton.addEventListener("click", showNameScreen);
  openLeaderboard.addEventListener("click", () => {
    leaderboardPausedGame = running;
    if (leaderboardPausedGame) {
      running = false;
      clearTimeout(timer);
      gameStatus.textContent = "PAUSED";
    }
    const storedLeaderboard = parseLeaderboard(readStoredValue(storageKeys.leaderboard));
    leaderboard = mergeLeaderboard([...leaderboard, ...storedLeaderboard]);
    renderLeaderboard();
    leaderboardDialog.showModal();
  });
  closeLeaderboard.addEventListener("click", () => leaderboardDialog.close());
  leaderboardDialog.addEventListener("click", (event) => {
    if (event.target === leaderboardDialog) leaderboardDialog.close();
  });
  leaderboardDialog.addEventListener("close", () => {
    if (!leaderboardPausedGame) return;
    leaderboardPausedGame = false;
    running = true;
    updateBoostDisplay();
    scheduleMove();
  });
  startButton.addEventListener("click", () => {
    if (running) return;
    resetGame();
    running = true;
    gameStatus.textContent = "IN PROGRESS";
    overlay.hidden = true;
    scheduleMove();
  });
  document.addEventListener("keydown", (event) => {
    if (gameScreen.hidden || !running) return;
    const keys = {
      ArrowUp: directions.up, w: directions.up, W: directions.up,
      ArrowDown: directions.down, s: directions.down, S: directions.down,
      ArrowLeft: directions.left, a: directions.left, A: directions.left,
      ArrowRight: directions.right, d: directions.right, D: directions.right
    };
    const requested = keys[event.key];
    if (!requested) return;
    event.preventDefault();
    requestDirection(requested);
  });
  directionButtons.forEach((button) => {
    button.addEventListener("click", () => requestDirection(directions[button.dataset.direction]));
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (!running || event.pointerType === "mouse" || activePointerId !== undefined) return;
    activePointerId = event.pointerId;
    pointerStart = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.pointerId !== activePointerId) return;
    const requested = directionFromPointer({ x: event.clientX, y: event.clientY });
    pointerStart = null;
    activePointerId = undefined;
    if (requested) requestDirection(requested);
  });
  canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== activePointerId) return;
    pointerStart = null;
    activePointerId = undefined;
  });

  renderLeaderboard();
  drawBoard();
  if (playerName) showGameScreen();
})();
