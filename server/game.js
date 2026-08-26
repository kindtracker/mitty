const { log } = require("./utils.js");

const WebSocket = require("ws");

const server = new WebSocket.Server({
  port: 8001
});

server.on("connection", (socket) => {
  log("game", "[mitty] player connected");

  socket.on("message", (data) => {
    log("game", "[mitty] received:", data.toString());
  });

  socket.on("close", () => {
    log("game", `[mitty:game] ${client.player.username}`);
  });
});

log("game", "[mitty:game] server listening: ws://localhost:8001");
