import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { User, ClientToServerMessage, ServerToClientMessage } from '../../shared/types';

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

const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  path: '/api/ws',
});

function broadcastUserList() {
  const usersArray: User[] = Array.from(connectedUsers.values());
  const message: ServerToClientMessage = { type: 'spectators', users: usersArray };
  const messageString = JSON.stringify(message);

  console.log('Broadcasting user list:', usersArray);

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

      if (msg.type === 'join') {
        connectedUsers.set(ws, msg.user);

        console.log(`User joined: ${msg.user.username} (${msg.user.id})`);
        broadcastUserList();
      }
    } catch (err) {
      console.error('Failed to parse message', err);
    }
  });

  ws.on('close', () => {
    if (connectedUsers.has(ws)) {
      const user = connectedUsers.get(ws);
      connectedUsers.delete(ws);

      console.log(`User disconnected: ${user?.username}`);
      broadcastUserList();
    }
  });
});

server.listen(port, () => {
  console.log(`Server and WebSocket listening at http://localhost:${port}`);
});
