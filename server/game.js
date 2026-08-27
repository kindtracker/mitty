const { log } = require("./utils.js");

const WebSocket = require("ws");

const server = new WebSocket.Server({
  port: 8001
});

const clients = [];

let current_id = 0;

function player_new(name, id) {
  return {
    name,
    id,
    pid: Date.now().toString(16),
    speed: 7.5,
    pos: [0, 0],
    vpos: [0, 0],
    on_ground: true,
    face: 1,
    animation: 0
  }
}

server.on("connection", (socket) => {
  const client = {socket, player: player_new("unknown", -1)};
  clients.push(client);

  log("game", `[mitty] client connected`);

  socket.on("message", (data) => {
    const message = JSON.parse(data.toString());
    if (!("type" in message)) return;
    const type = message.type;
    if (type == "auth") {
      // TODO: verify session token
      if (!("session_token" in message)) return;
      
      current_id++;
      client.player.name = message.session_token;
      client.player.id = current_id;
      socket.send(JSON.stringify({
        type: "auth",
        name: message.session_token,
        id: client.player.id,
        pid: client.player.pid,
      }));
    } else if (type == "update") {
      if (!("player" in message)) return;
      client.player = message.player;
    }
  });

  socket.on("close", () => {
    log("game", `[mitty:game] ${client.player.username}`);
  });
});

setInterval(() => {
  let players = [];
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (client.player.id == -1) continue;
    players.push(client.player);
  }

  const update_message = JSON.stringify({
    type: "update",
    players 
  });

  for (const client of clients) {
    if (client.socket.readyState !== WebSocket.OPEN) continue;

    client.socket.send(update_message);
  }
}, 1000 / 24);

log("game", "[mitty:game] server listening: ws://localhost:8001");
