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
  const directionButtons = document.querySelectorAll("[data-direction]");
  const { directions, queueDirection, moveSnake } = window.SnakeLogic;
  const {
    chooseFoodPosition,
    choosePowerUpPosition,
    collectPowerUp,
    getMoveDelay,
    isSlowEffectActive,
    resetSlowEffect
  } = window.WebSnakeGame;

  const cells = 20;
  const cellSize = canvas.width / cells;
  const normalMoveDelay = 140;
  const slowEffectDuration = 5000;
  const storageKeys = { name: "websnake.playerName", score: "websnake.highScore" };
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
  let snake;
  let food;
  let powerUp;
  let direction;
  let directionQueue = [];
  let score = 0;
  let timer;
  let slowEffectTimer;
  let slowEffectUntil = 0;
  let running = false;
  let pointerStart;
  let activePointerId;

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
        (powerUp ? ` Power-up at column ${powerUp.x + 1}, row ${powerUp.y + 1}.` : "") +
        (isSlowEffectActive(slowEffectUntil, Date.now()) ? " Slow effect active." : "")
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
      context.save();
      context.translate(centerX, centerY);
      context.rotate(Math.PI / 4);
      context.fillStyle = "#70d7ff";
      context.shadowColor = "#70d7ff";
      context.shadowBlur = 16;
      context.beginPath();
      context.roundRect(-cellSize * 0.24, -cellSize * 0.24, cellSize * 0.48, cellSize * 0.48, 3);
      context.fill();
      context.restore();
      context.fillStyle = "#16323a";
      context.fillRect(centerX - 1.5, centerY - 6, 3, 12);
      context.fillRect(centerX - 6, centerY - 1.5, 12, 3);
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
    clearInterval(timer);
    clearSlowEffect();
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

  function placeFood() {
    food = chooseFoodPosition(cells, snake);
    powerUp = choosePowerUpPosition(cells, snake, food);
  }

  function updateGameStatus() {
    if (!running) return;
    if (isSlowEffectActive(slowEffectUntil, Date.now())) {
      gameStatus.textContent = "IN PROGRESS · SLOWED";
      gameStatus.classList.add("slowed");
    } else {
      gameStatus.textContent = "IN PROGRESS";
      gameStatus.classList.remove("slowed");
    }
  }

  function restartMovementTimer() {
    clearInterval(timer);
    if (running) timer = setInterval(move, getMoveDelay(normalMoveDelay, slowEffectUntil, Date.now()));
  }

  function clearSlowEffect() {
    clearTimeout(slowEffectTimer);
    slowEffectUntil = resetSlowEffect();
    slowEffectTimer = undefined;
    gameStatus.classList.remove("slowed");
  }

  function activateSlowEffect() {
    const collection = collectPowerUp(
      snake[0],
      powerUp,
      slowEffectUntil,
      Date.now(),
      slowEffectDuration
    );
    if (!collection.collected) return;

    powerUp = collection.powerUp;
    slowEffectUntil = collection.slowEffectUntil;
    clearTimeout(slowEffectTimer);
    slowEffectTimer = setTimeout(() => {
      slowEffectUntil = 0;
      slowEffectTimer = undefined;
      updateGameStatus();
      restartMovementTimer();
    }, slowEffectDuration);
    updateGameStatus();
    restartMovementTimer();
  }

  function resetGame() {
    clearInterval(timer);
    clearSlowEffect();
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
    clearInterval(timer);
    clearSlowEffect();
    gameStatus.textContent = "RUN COMPLETE";
    overlayTitle.textContent = "Nice run, " + playerName;
    overlayCopy.textContent = `You collected ${score} ${score === 1 ? "fruit" : "fruits"}. Ready for another?`;
    startButton.innerHTML = 'PLAY AGAIN <span aria-hidden="true">→</span>';
    overlay.hidden = false;
    requestAnimationFrame(() => startButton.focus());
    highScore = Math.max(score, highScore);
    storeValue(storageKeys.score, String(highScore));
    highScoreDisplay.textContent = String(highScore).padStart(2, "0");
  }

  function move() {
    if (directionQueue.length) direction = directionQueue.shift();
    const result = moveSnake(snake, direction, food, cells);
    if (result.collided) {
      finishGame();
      return;
    }

    snake = result.snake;
    activateSlowEffect();
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
  startButton.addEventListener("click", () => {
    if (running) return;
    resetGame();
    running = true;
    updateGameStatus();
    overlay.hidden = true;
    restartMovementTimer();
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

  drawBoard();
  if (playerName) showGameScreen();
})();
