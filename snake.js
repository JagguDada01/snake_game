const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const gridSize = 20;
const tileCount = 35;
const baseGameSpeed = 400;
const minGameSpeed = 80;
const bigFoodLifetime = 8000;



const eatSound = new Audio('punch.mp3');
const gameOverSound = new Audio('khatam.mp3');
const startSound = new Audio('wake-up-to-reality.mp3');
const bigAppearSound = new Audio('big.mp3');
const bigEatSound = new Audio('modi.mp3');
const bigMissSound = new Audio('faaah.mp3');

let snake = [{x: 10, y: 10}];
let direction = 'RIGHT';
let food = {x: 15, y: 10};
let bigFood = null;
let score = 0;
let highScore = loadHighScore();
let gameSpeed = baseGameSpeed;
let gameTimerId = null;
let bigFoodTimerId = null;
let isRunning = false;
let isGameOver = false;
let isFreshRound = true;
let regularFoodsEaten = 0;

[eatSound, gameOverSound, startSound,
  bigAppearSound, bigEatSound,
  bigMissSound].forEach(sound => {
  sound.preload = 'auto';
  sound.load();
});

function playSound(sound) {
  sound.pause();
  sound.currentTime = 0;
  const playback = sound.play();

  if (playback && typeof playback.catch === 'function') {
    playback.catch(() => {});
  }
}

function loadHighScore() {
  try {
    const savedValue = window.localStorage.getItem('snakeHighScore');
    return savedValue ? Number(savedValue) || 0 : 0;
  } catch {
    return 0;
  }
}

function saveHighScore() {
  try {
    window.localStorage.setItem('snakeHighScore', String(highScore));
  } catch {
    // Ignore storage failures and keep the in-memory score.
  }
}

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }
}

function isSameCell(firstCell, secondCell) {
  return Boolean(firstCell &&
    secondCell &&
    firstCell.x === secondCell.x &&
    firstCell.y === secondCell.y);
}

function isCellOnSnake(cell) {
  return snake.some(segment =>
    isSameCell(segment, cell));
}

function getRandomFreeCell({
  avoidFood = true,
  avoidBigFood = true
} = {}) {
  const freeCells = [];

  for (let y = 0; y < tileCount; y++) {
    for (let x = 0; x < tileCount; x++) {
      const cell = {x, y};

      if (isCellOnSnake(cell)) {
        continue;
      }

      if (avoidFood && isSameCell(cell, food)) {
        continue;
      }

      if (avoidBigFood && isSameCell(cell, bigFood)) {
        continue;
      }

      freeCells.push(cell);
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  return freeCells[Math.floor(
    Math.random() * freeCells.length)];
}

function clearBigFood(shouldPlayMissSound = false) {
  if (bigFoodTimerId !== null) {
    window.clearTimeout(bigFoodTimerId);
    bigFoodTimerId = null;
  }

  if (shouldPlayMissSound && bigFood) {
    playSound(bigMissSound);
  }

  bigFood = null;
}

function spawnBigFood() {
  const nextCell = getRandomFreeCell({
    avoidFood: true,
    avoidBigFood: false
  });

  if (!nextCell) {
    return;
  }

  clearBigFood();
  bigFood = {
    ...nextCell,
    spawnedAt: performance.now()
  };
  playSound(bigAppearSound);

  bigFoodTimerId = window.setTimeout(() => {
    clearBigFood(true);
  }, bigFoodLifetime);
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(210, 255, 232, 0.08)';
  ctx.lineWidth = 1;

  for (let index = 0; index <= tileCount; index++) {
    const position = index * gridSize + 0.5;

    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoardBackground() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawScore() {
  ctx.save();
  ctx.fillStyle = '#d7ffd9';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`Score: ${score}`, 12, 24);
  ctx.textAlign = 'right';
  ctx.fillText(`High: ${highScore}`, canvas.width - 12, 24);
  ctx.restore();
}

function drawGameOverOverlay() {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 12);
  ctx.fillStyle = '#f4f4f4';
  ctx.font = '18px monospace';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 22);
  ctx.fillText('Press Start to play again', canvas.width / 2, canvas.height / 2 + 54);
  ctx.restore();
}

function drawBigFood(timestamp) {
  if (!bigFood) {
    return;
  }

  const centerX = bigFood.x * gridSize +
    gridSize / 2;
  const centerY = bigFood.y * gridSize +
    gridSize / 2;
  const pulseScale = 1.15 +
    Math.sin((timestamp -
      bigFood.spawnedAt) / 140) * 0.25;
  const radius = gridSize / 2 * pulseScale;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 72, 72, 0.25)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd0d0';
  ctx.stroke();
  ctx.fillStyle = '#fff4f4';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BIG', centerX, centerY + 1);
  ctx.restore();
}

function draw(timestamp = performance.now()) {
  drawBoardBackground();
  drawGrid();

  // Draw snake (green)
  ctx.fillStyle = '#00FF00';
  snake.forEach(segment => {
    ctx.fillRect(
      segment.x * gridSize,
      segment.y * gridSize,
      gridSize - 2,
      gridSize - 2
    );
  });

  // Draw food (red)
  ctx.fillStyle = '#FF0000';
  ctx.fillRect(
    food.x * gridSize,
    food.y * gridSize,
    gridSize - 2,
    gridSize - 2
  );
  drawBigFood(timestamp);

  drawScore();

  if (isGameOver) {
    drawGameOverOverlay();
  }
}

function move() {
  let head = {
    x: snake[0].x,
    y: snake[0].y
  };

  if (direction === 'UP') head.y--;
  if (direction === 'DOWN') head.y++;
  if (direction === 'LEFT') head.x--;
  if (direction === 'RIGHT') head.x++;

  snake.unshift(head);

  const ateRegularFood = isSameCell(head, food);
  const ateBigFood = isSameCell(head, bigFood);

  if (ateRegularFood) {
    score++;
    regularFoodsEaten++;
    updateHighScore();

    if (score % 5 === 0) {
      gameSpeed = Math.max(
        minGameSpeed,
        Math.round(gameSpeed * 0.9)
      );
    }

    playSound(eatSound);
    placeFood();

    if (regularFoodsEaten % 5 === 0) {
      spawnBigFood();
    }
  }

  if (ateBigFood) {
    score += 5;
    updateHighScore();

    if (score % 5 === 0) {
      gameSpeed = Math.max(
        minGameSpeed,
        Math.round(gameSpeed * 0.9)
      );
    }

    playSound(bigEatSound);
    clearBigFood();
  }

  if (!ateRegularFood && !ateBigFood) {
    snake.pop();
  }
}

document.addEventListener('keydown',
  changeDirection);

function changeDirection(event) {
  const key = event.key;

  if (key.startsWith('Arrow')) {
    event.preventDefault();
  }

  if (key === 'ArrowUp' &&
      direction !== 'DOWN')
    direction = 'UP';

  if (key === 'ArrowDown' &&
      direction !== 'UP')
    direction = 'DOWN';

  if (key === 'ArrowLeft' &&
      direction !== 'RIGHT')
    direction = 'LEFT';

  if (key === 'ArrowRight' &&
      direction !== 'LEFT')
    direction = 'RIGHT';
}



function checkCollision() {
  const head = snake[0];

  if (head.x < 0 ||
      head.x >= tileCount ||
      head.y < 0 ||
      head.y >= tileCount)
    return true;

  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x &&
        head.y === snake[i].y)
      return true;
  }

  return false;
}

function placeFood() {
  const nextCell = getRandomFreeCell({
    avoidFood: false,
    avoidBigFood: true
  });

  if (nextCell) {
    food = nextCell;
  }
}

function renderFrame(timestamp) {
  draw(timestamp);
  window.requestAnimationFrame(renderFrame);
}

function gameLoop() {
  move();

  if (checkCollision()) {
    isGameOver = true;
    stopGame();
    playSound(gameOverSound);
    draw();
    return;
  }

  draw();
  gameTimerId = window.setTimeout(gameLoop, gameSpeed);
}

function startGame() {
  if (isRunning) {
    return;
  }

  if (isGameOver) {
    resetGame();
  }

  if (isFreshRound) {
    playSound(startSound);
    isFreshRound = false;
  }

  isRunning = true;
  startButton.disabled = true;
  pauseButton.disabled = false;
  gameLoop();
}

function stopGame() {
  if (gameTimerId !== null) {
    window.clearTimeout(gameTimerId);
    gameTimerId = null;
  }

  isRunning = false;
  startButton.disabled = false;
  pauseButton.disabled = true;
}

function resetGame() {
  snake = [{x: 10, y: 10}];
  direction = 'RIGHT';
  score = 0;
  gameSpeed = baseGameSpeed;
  isGameOver = false;
  isFreshRound = true;
  regularFoodsEaten = 0;
  clearBigFood();
  placeFood();
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', stopGame);

placeFood();
draw();
window.requestAnimationFrame(renderFrame);
pauseButton.disabled = true;
