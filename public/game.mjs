import { Player } from './Player.mjs';
import { Collectible } from './Collectible.mjs';

// DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const playerScoreEl = document.getElementById('player-score');
const playerRankEl = document.getElementById('player-rank');

// Touch control buttons
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

// Game variables
const socket = io();
let currentPlayer;
let players = {};
let collectibles = [];

// Preload game assets
const loadImage = src => {
  const img = new Image();
  img.src = src;
  return img;
};

// Load the pixelated cat image (adjust the path if needed)
const catImage = loadImage('/public/cat.png');

// Canvas scaling
const BASE_WIDTH = 640;
const BASE_HEIGHT = 480;
let scale = 1;

const resizeCanvas = () => {
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 150;
  const widthScale = maxWidth / BASE_WIDTH;
  const heightScale = maxHeight / BASE_HEIGHT;
  scale = Math.min(widthScale, heightScale, 1);

  canvas.width = BASE_WIDTH * scale;
  canvas.height = BASE_HEIGHT * scale;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(scale, scale);
};

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Movement state
const keys = {
  w: false,
  a: false,
  s: false,
  d: false
};
const BASE_MOVE_SPEED = 300;
let MOVE_SPEED = BASE_MOVE_SPEED;
let lastTime = performance.now();
let pulse = 0;

// Starry background setup
const stars = [];
const numStars = 50;
for (let i = 0; i < numStars; i++) {
  stars.push({
    x: Math.random() * BASE_WIDTH,
    y: Math.random() * BASE_HEIGHT,
    radius: Math.random() * 1.5,
  });
}

// Initialize the game
const init = () => {
  const x = Math.floor(Math.random() * (BASE_WIDTH - 30));
  const y = Math.floor(Math.random() * (BASE_HEIGHT - 30));
  
  socket.emit('newPlayer', { x, y });
  
  window.requestAnimationFrame(gameLoop);
  
  setupEventListeners();
};

// Game loop for animation
const gameLoop = (currentTime) => {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  pulse = 10 + Math.sin(currentTime * 0.005) * 5;
  MOVE_SPEED = BASE_MOVE_SPEED * scale;

  updatePlayerPosition(deltaTime);

  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  
  drawGame();
  
  window.requestAnimationFrame(gameLoop);
};

// Update player position based on held keys
const updatePlayerPosition = (deltaTime) => {
  if (!currentPlayer) return;

  let moved = false;

  if (keys.w) {
    currentPlayer.y = Math.max(0, currentPlayer.y - MOVE_SPEED * deltaTime);
    moved = true;
  }
  if (keys.s) {
    currentPlayer.y = Math.min(BASE_HEIGHT - currentPlayer.height, currentPlayer.y + MOVE_SPEED * deltaTime);
    moved = true;
  }
  if (keys.a) {
    currentPlayer.x = Math.max(0, currentPlayer.x - MOVE_SPEED * deltaTime);
    moved = true;
  }
  if (keys.d) {
    currentPlayer.x = Math.min(BASE_WIDTH - currentPlayer.width, currentPlayer.x + MOVE_SPEED * deltaTime);
    moved = true;
  }

  if (moved) {
    socket.emit('movePlayer', { x: currentPlayer.x, y: currentPlayer.y });
  }
};

// Draw the starry background
const drawBackground = () => {
  ctx.fillStyle = '#111122';
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  ctx.fillStyle = '#ffffff';
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });
};

// Draw all game elements
const drawGame = () => {
  drawBackground();

  console.log('Collectibles to draw:', collectibles);

  Object.values(players).forEach(player => {
    drawPlayer(player);
  });
  
  collectibles.forEach(collectible => {
    drawCollectible(collectible);
  });
  
  if (currentPlayer) {
    playerScoreEl.textContent = `Score: ${currentPlayer.score}`;
    playerRankEl.textContent = currentPlayer.rank || 'Rank: 1/1';
  }
};

// Draw player on canvas
const drawPlayer = (player) => {
  ctx.shadowColor = '#00e676';
  ctx.shadowBlur = pulse;
  if (catImage.complete && catImage.naturalWidth !== 0) {
    ctx.drawImage(catImage, player.x, player.y, player.width, player.height);
  } else {
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00e676';
    ctx.fillText('😺', player.x + player.width / 2, player.y + player.height / 2);
  }
  ctx.shadowBlur = 0;
};

// Draw collectible on canvas
const drawCollectible = (collectible) => {
  try {
    console.log('Drawing collectible:', collectible);
    ctx.fillStyle = '#ff9100';
    ctx.shadowColor = '#ff9100';
    ctx.shadowBlur = pulse;
    ctx.beginPath();
    const radius = 5;
    ctx.arc(
      collectible.x + collectible.width / 2,
      collectible.y + collectible.height / 2,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
  } catch (error) {
    console.error('Error drawing collectible:', error);
  }
};

// Set up keyboard and touch event listeners
const setupEventListeners = () => {
  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        keys.w = true;
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        keys.s = true;
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        keys.a = true;
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        keys.d = true;
        break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.key) {
      case 'w':
      case 'W':
      case 'ArrowUp':
        keys.w = false;
        break;
      case 's':
      case 'S':
      case 'ArrowDown':
        keys.s = false;
        break;
      case 'a':
      case 'A':
      case 'ArrowLeft':
        keys.a = false;
        break;
      case 'd':
      case 'D':
      case 'ArrowRight':
        keys.d = false;
        break;
    }
  });

  // Touch controls
  upBtn.addEventListener('touchstart', () => { keys.w = true; });
  upBtn.addEventListener('touchend', () => { keys.w = false; });
  downBtn.addEventListener('touchstart', () => { keys.s = true; });
  downBtn.addEventListener('touchend', () => { keys.s = false; });
  leftBtn.addEventListener('touchstart', () => { keys.a = true; });
  leftBtn.addEventListener('touchend', () => { keys.a = false; });
  rightBtn.addEventListener('touchstart', () => { keys.d = true; });
  rightBtn.addEventListener('touchend', () => { keys.d = false; });

  // Prevent default touch behavior to avoid scrolling
  document.querySelector('.touch-controls').addEventListener('touchstart', (e) => {
    e.preventDefault();
  });
};

// Socket.io event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  init();
});

socket.on('updatePlayers', (updatedPlayers) => {
  players = updatedPlayers;
  currentPlayer = players[socket.id];
  console.log('Updated players:', players);
});

socket.on('updateCollectibles', (updatedCollectibles) => {
  collectibles = updatedCollectibles || [];
  console.log('Updated collectibles:', collectibles);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});