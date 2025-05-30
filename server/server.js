import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import http from "http";
import { WebSocketServer } from "ws";

dotenv.config({ path: "../.env" });

// express app
const app = express();
const port = 3001;

app.use(express.json());

app.post("/api/token", async (req, res) => {
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  const { access_token } = await response.json();
  res.send({access_token});
});

// websocket server
const connectedUsers = new Map(); // key: userId, value: username

const server = http.createServer(app);
const wss = new WebSocketServer({
  server,
  path: "/api/ws",
});

function broadcastUserList() {
  const usersArray = Array.from(connectedUsers.entries()).map(([id, username]) => ({ id, username }));
  const message = JSON.stringify({ type: "users", users: usersArray });

  console.log("Broadcasting user list:", usersArray);

  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send a welcome message
  ws.send(JSON.stringify({ type: "info", message: "Welcome!" }));

  ws.on("message", (data) => {
    // data is a Buffer or string, convert to string then parse JSON
    let msg;
    try {
      msg = JSON.parse(data.toString());
      console.log("Received message from client:", msg);

      if (msg.type === "join" && msg.user) {
        connectedUsers.set(msg.user.id, msg.user.username);
        ws.userId = msg.user.id; // store userId on ws connection
        console.log(`User joined: ${msg.user.username} (${msg.user.id})`);
      }

      broadcastUserList();
    } catch (err) {
      console.error("Failed to parse message", err);
    }
  });

  ws.on("close", () => {
    if (ws.userId) {
      connectedUsers.delete(ws.userId);
      console.log(`User disconnected: ${ws.userId}`);

      broadcastUserList();
    }
  });
});

server.listen(port, () => {
  console.log(`Server and WebSocket listening at http://localhost:${port}`);
});
