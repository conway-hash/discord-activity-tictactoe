import { DiscordSDK } from "@discord/embedded-app-sdk";
import "./style.css";

let auth;
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
setupDiscordSdk().then(() => {
  console.log("Discord SDK is authenticated");

  // appendVoiceChannelName();
  // appendGuildAvatar();
  setupWebSocket();
});

async function setupDiscordSdk() {
  await discordSdk.ready();
  console.log("Discord SDK is ready");

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
      "applications.commands"
    ],
  });

  // Retrieve an access_token from your activity's server
  // Note: We need to prefix our backend `/api/token` route with `/.proxy` to stay compliant with the CSP.
  // Read more about constructing a full URL and using external resources at
  // https://discord.com/developers/docs/activities/development-guides/networking#construct-a-full-url
  const response = await fetch("/.proxy/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Hello Friends!</h1>
    <div class="card">
      <div class="card-header">
        <button id="plus_clicker">+</button>
        <p id="clickCount">0</p>
        <button id="minus_clicker">-</button>
      </div>
      <ul id="userList"></ul>
    </div>
  </div>
`;

async function appendVoiceChannelName() {
  const app = document.querySelector('#app');

  let activityChannelName = 'Unknown';

  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  // Update the UI with the name of the current voice channel
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  const textTag = document.createElement('p');
  textTag.textContent = textTagString;
  app.appendChild(textTag);
}

async function appendGuildAvatar() {
  const app = document.querySelector('#app');

  // 1. From the HTTP API fetch a list of all of the user's guilds
  const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
    headers: {
      // NOTE: we're using the access_token provided by the "authenticate" command
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  // 2. Find the current guild's info, including it's "icon"
  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

  // 3. Append to the UI an img tag with the related information
  if (currentGuild != null) {
    const guildImg = document.createElement('img');
    guildImg.setAttribute(
      'src',
      // More info on image formatting here: https://discord.com/developers/docs/reference#image-formatting
      `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
    );
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(guildImg);
  }
}

function setupWebSocket() {
  const socket = new WebSocket("/.proxy/api/ws");

  document.getElementById("plus_clicker")?.addEventListener("click", () => {
    socket.send(JSON.stringify({
      type: "plus_click",
      user: {
        username: auth.user.username,
        id: auth.user.id,
      },
    }));
  });

  document.getElementById("minus_clicker")?.addEventListener("click", () => {
    socket.send(JSON.stringify({
      type: "minus_click",
      user: {
        username: auth.user.username,
        id: auth.user.id,
      },
    }));
  });

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    socket.send(JSON.stringify({
      type: "join",
      user: {
        username: auth.user.username,
        id: auth.user.id,
      },
    }));
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log("📨 Message from server:", msg);

    if (msg.type === "users") {
      console.log("Currently connected users:", msg.users);
      const userListElement = document.getElementById("userList");

      // Clear existing list
      userListElement.innerHTML = "";

      // Add each user as a new <li>
      msg.users.forEach(user => {
        const li = document.createElement("li");
        li.textContent = user.username;
        userListElement.appendChild(li);
      });
    } else if (msg.type === "click") {
      const clickCountElement = document.getElementById("clickCount");
      if (clickCountElement) {
        const currentCount = parseInt(clickCountElement.textContent, 10);
        if (msg.action === "minus") {
          clickCountElement.textContent = currentCount - 1;
        } else {
          clickCountElement.textContent = currentCount + 1;
        }
      }
    } 
    else {
      console.log("Message from server:", msg);
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket disconnected");
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error", err);
  };
}
