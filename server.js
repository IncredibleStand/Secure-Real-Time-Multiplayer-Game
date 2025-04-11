require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { Player } = require('./public/Player.mjs');
const { Collectible } = require('./public/Collectible.mjs');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  noSniff: true,
  noCache: true,
  xssFilter: true,
  frameguard: {
    action: 'deny'
  }
}));

app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({origin: '*'})); 

app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

fccTestingRoutes(app);

app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server);

// Game state
const gameState = {
  players: {},
  collectibles: []
};

// Generate a collectible at random position
const generateCollectible = () => {
  const id = Date.now().toString();
  const x = Math.floor(Math.random() * (640 - 20));
  const y = Math.floor(Math.random() * (480 - 20));
  const value = 1; // Fixed value of 1 to match FCC example
  
  const collectible = new Collectible({ id, x, y, value });
  gameState.collectibles.push(collectible);
  
  console.log('Generated collectible:', collectible);
  return collectible;
};

// Serialize collectibles to plain objects before sending
const serializeCollectibles = (collectibles) => {
  return collectibles.map(collectible => ({
    id: collectible.id,
    x: collectible.x,
    y: collectible.y,
    value: collectible.value,
    width: collectible.width,
    height: collectible.height
  }));
};

// Initialize with one collectible
generateCollectible();

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);
  
  socket.on('newPlayer', (data) => {
    const { x, y } = data;
    gameState.players[socket.id] = new Player({ id: socket.id, x, y });
    console.log(`Player ${socket.id} added at position (${x}, ${y})`);

    if (gameState.collectibles.length === 0) {
      generateCollectible();
    }

    io.emit('updatePlayers', gameState.players);
    io.emit('updateCollectibles', serializeCollectibles(gameState.collectibles));
    console.log('Sent initial collectibles to client:', serializeCollectibles(gameState.collectibles));
  });
  
  socket.on('movePlayer', (data) => {
    const player = gameState.players[socket.id];
    if (player) {
      player.x = data.x;
      player.y = data.y;
      
      gameState.collectibles.forEach((collectible, index) => {
        if (player.collision(collectible)) {
          player.score += collectible.value;
          gameState.collectibles.splice(index, 1);
          
          const newCollectible = generateCollectible();
          io.emit('updateCollectibles', serializeCollectibles(gameState.collectibles));
        }
      });
      
      const playersList = Object.values(gameState.players);
      player.rank = player.calculateRank(playersList);
      
      io.emit('updatePlayers', gameState.players);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`Player ${socket.id} disconnected`);
    delete gameState.players[socket.id];
    io.emit('updatePlayers', gameState.players);
  });
});

module.exports = app;