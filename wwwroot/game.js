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

  const cells = 20;
  const cellSize = canvas.width / cells;
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
  let direction;
  let nextDirection;
  let score = 0;
  let timer;
  let running = false;

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
    context.fillStyle = "#ff7968";
    context.shadowColor = "#ff7968";
    context.shadowBlur = 14;
    context.beginPath();
    context.arc((food.x + 0.5) * cellSize, (food.y + 0.5) * cellSize, cellSize * 0.31, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

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
    requestAnimationFrame(drawBoard);
  }

  function updateCount() {
    count.textContent = `${nameInput.value.length}/24`;
    errorMessage.hidden = true;
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * cells), y: Math.floor(Math.random() * cells) };
    } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
  }

  function resetGame() {
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreDisplay.textContent = "00";
    gameStatus.textContent = "READY WHEN YOU ARE";
    overlayTitle.textContent = "Your run starts here";
    overlayCopy.textContent = "Use the arrow keys or WASD to guide your snake.";
    startButton.innerHTML = 'START GAME <span aria-hidden="true">→</span>';
    overlay.hidden = false;
    placeFood();
    drawBoard();
  }

  function finishGame() {
    running = false;
    clearInterval(timer);
    gameStatus.textContent = "RUN COMPLETE";
    overlayTitle.textContent = "Nice run, " + playerName;
    overlayCopy.textContent = `You collected ${score} ${score === 1 ? "fruit" : "fruits"}. Ready for another?`;
    startButton.innerHTML = 'PLAY AGAIN <span aria-hidden="true">→</span>';
    overlay.hidden = false;
    highScore = Math.max(score, highScore);
    storeValue(storageKeys.score, String(highScore));
    highScoreDisplay.textContent = String(highScore).padStart(2, "0");
  }

  function move() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const eating = head.x === food.x && head.y === food.y;
    const body = eating ? snake : snake.slice(0, -1);
    if (head.x < 0 || head.x >= cells || head.y < 0 || head.y >= cells || body.some((segment) => segment.x === head.x && segment.y === head.y)) {
      finishGame();
      return;
    }

    snake.unshift(head);
    if (eating) {
      score += 1;
      scoreDisplay.textContent = String(score).padStart(2, "0");
      if (snake.length === cells * cells) {
        finishGame();
        drawBoard();
        return;
      }
      placeFood();
    } else {
      snake.pop();
    }
    drawBoard();
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
    gameStatus.textContent = "IN PROGRESS";
    overlay.hidden = true;
    timer = setInterval(move, 140);
  });
  document.addEventListener("keydown", (event) => {
    if (gameScreen.hidden || !running) return;
    const keys = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
    };
    const requested = keys[event.key];
    if (!requested) return;
    event.preventDefault();
    if (requested.x !== -direction.x || requested.y !== -direction.y) nextDirection = requested;
  });

  drawBoard();
  if (playerName) showGameScreen();
})();
