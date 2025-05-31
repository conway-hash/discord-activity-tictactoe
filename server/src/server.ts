import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { User, ClientToServerMessage, ServerToClientMessage, GameState } from '../../shared/types';

dotenv.config({ path: '../.env' });

// Express app
const app = express();
const port = 3001;

app.use(express.json());

app.post('/api/token', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.VITE_DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code: req.body.code,
      }),
    });

    const data = (await response.json()) as { access_token: string };
    res.send({ access_token: data.access_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// websocket server
const connectedUsers = new Map<WebSocket, User>();
let playerOne: User | null = null;
let playerTwo: User | null = null;
const board: string[] = ['', '', '', '', '', '', '', '', '']; // 3x3 tic-tac-toe board
let gameState: GameState = 'waiting';

const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  path: '/api/ws',
});

function broadcastState() {
  const usersArray: User[] = Array.from(connectedUsers.values());
  const message: ServerToClientMessage = {
    type: 'responseState',
    users: usersArray,
    playerOne: playerOne,
    playerTwo: playerTwo,
    board: board,
    gameState: gameState,
  };
  const messageString = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(messageString);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  const welcomeMessage: ServerToClientMessage = {
    type: 'info',
    message: 'Welcome!',
  };
  ws.send(JSON.stringify(welcomeMessage));

  ws.on('message', (data) => {
    try {
      const msg: ClientToServerMessage = JSON.parse(data.toString());
      console.log('Received message from client:', msg);

      if (msg.type === 'requestConnect') {
        msg.user.isSpectator = true;
        connectedUsers.set(ws, msg.user);
        broadcastState();
      }

      if (msg.type === 'requestPlayerUpdate') {
        const user = connectedUsers.get(ws);
        if (!user) {
          console.warn('User not found in connected users');
          return;
        }

        if (user.isSpectator) {
          if (playerOne == null) {
            playerOne = user;
            user.isSpectator = false;
          } else if (playerTwo == null) {
            playerTwo = user;
            user.isSpectator = false;
          }
        } else {
          if (playerOne?.id === user.id) {
            playerOne = null;
            user.isSpectator = true;
          }
          if (playerTwo?.id === user.id) {
            playerTwo = null;
            user.isSpectator = true;
          }
        }

        if (playerOne && playerTwo) {
          gameState = 'playing';
        } else {
          gameState = 'waiting';
        }

        broadcastState();
      }

      if (msg.type === 'requestBoardUpdate') {
        const user = connectedUsers.get(ws);
        if (!user) {
          console.warn('User not found in connected users');
          return;
        }

        if (gameState !== 'playing') {
          console.warn(
            `User ${user.username} tried to update the board while game is not in playing state`,
          );
          return;
        }

        if (playerOne?.id === user.id) {
          if (board[msg.index] === '') {
            if (board.filter((c) => c !== '').length % 2 === 0) {
              board[msg.index] = 'X';
            } else {
              console.warn(`User ${user.username} tried to update the board out of turn`);
            }
          } else {
            console.warn(`User ${user.username} tried to update an occupied cell`);
          }
        } else if (playerTwo?.id === user.id) {
          if (board[msg.index] === '') {
            if (board.filter((c) => c !== '').length % 2 === 1) {
              board[msg.index] = 'O';
            } else {
              console.warn(`User ${user.username} tried to update the board out of turn`);
            }
          } else {
            console.warn(`User ${user.username} tried to update an occupied cell`);
          }
        } else {
          console.warn(`User ${user.username} is not a player, cannot update board`);
          return;
        }

        const winningCombinations = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8], // rows
          [0, 3, 6],
          [1, 4, 7],
          [2, 5, 8], // columns
          [0, 4, 8],
          [2, 4, 6], // diagonals
        ];

        for (const [a, b, c] of winningCombinations) {
          const value = board[a];
          if (value !== '' && value === board[b] && value === board[c]) {
            gameState = 'finished';
            console.log(`Game finished! Winner: ${value}`);
            break;
          }
        }
        if (gameState != 'finished' && board.every((cell) => cell !== '')) {
          gameState = 'draw';
          console.log("Game finished! It's a draw.");
        }

        broadcastState();

        if (gameState === 'finished' || gameState === 'draw') {
          // Schedule a game reset after 5 seconds
          setTimeout(() => {
            board.fill('');

            // Resume game only if both players are present
            if (playerOne && playerTwo) {
              gameState = 'playing';
            } else {
              gameState = 'waiting';
            }

            console.log('Game reset for a new round');

            // Optionally broadcast the new initial state
            broadcastState();
          }, 5000);
        }
      }
    } catch (err) {
      console.error('Failed to parse message', err);
    }
  });

  ws.on('close', () => {
    if (connectedUsers.has(ws)) {
      const user = connectedUsers.get(ws);
      if (user?.id === playerOne?.id) {
        playerOne = null;
      } else if (user?.id === playerTwo?.id) {
        playerTwo = null;
      }
      connectedUsers.delete(ws);

      console.log(`User disconnected: ${user?.username}`);
      broadcastState();
    }
  });
});

server.listen(port, () => {
  console.log(`Server and WebSocket listening at http://localhost:${port}`);
});
