const { createNoise2D } = require("simplex-noise");
const alea = require("alea");
const { log } = require("./utils.js");

const WebSocket = require("ws");

const server = new WebSocket.Server({
  port: 8001
});

const world = new Map();
const generated_chunks = new Map();
const seed = Math.floor(Math.random() * 10_000_000);
const noise = createNoise2D(alea(seed));
const clients = [];

let current_id = 0;

let uptime_start = Date.now();

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function player_new(name, id) {
  return {
    name,
    id,
    pid: Date.now().toString(16),
    speedwalk: 7.5,
    jump_power: 13,
    pos: [0, 0],
    vpos: [0, 0],
    on_ground: true,
    face: 1,
    animation: 0
  }
}

function broadcast(update_message) {
  const message = JSON.stringify(update_message);
  for (const client of clients) {
    if (client.socket.readyState !== WebSocket.OPEN) continue;
    if (client.player.id == -1) continue;
    client.socket.send(message);
  }
}

function tiles_add(name, x, y, broadcastp = true, socket = null) {
  world.delete(`${x},${y}`);
  world.set(`${x},${y}`, name);
  const update_message = {
    type: "update",
    tile: {
      mode: "add",
      pos: [x, y],
      name
    }
  };

  if (broadcastp) {
    broadcast(update_message);
  } else if (socket) {
    socket.send(JSON.stringify(update_message));
  }
}

function tiles_remove(x, y, broadcastp = true, socket = null) {
  world.delete(`${x},${y}`);  
  const update_message = {
    type: "update",
    tile: {
      mode: "remove",
      pos: [x, y]
    }
  };

  if (broadcastp) {
    broadcast(update_message);
  } else if (socket) {
    socket.send(JSON.stringify(update_message));
  }
}

function tiles_get(x, y) {
  return world.get(`${x},${y}`);
}

function get_prandom(x, t) {
  return (Math.abs(Math.sin(x * 12.9898 * t)) * 10) % 1
}

function tree_generate(x, y) {
  const height = 3 + Math.round(get_prandom(x, 2));
  for (let i = 1; i <= height; i++) {
    tiles_add("mitty:oak/log", x, y - i, true);
  }
  for (let dy = -2; dy <= 0; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 3) continue;
      tiles_add("mitty:oak/leaves", x+dx, y+dy-height, true);
    }
  }
  tiles_add("mitty:oak/leaves", x, y-height-1, true);
}

function noise_pos(x, y = 0) {
  return noise(x, y);
}

function chunk_generate(xs, ys, w, h) {
  for (let y = ys; y < ys + h; y++) {
    for (let x = xs; x < xs + w; x++) {
      let name = "mitty:dirt";

      const nx = x * 0.01;
      const noise0 = Math.abs(noise_pos(nx/512));
      const noise1 = noise_pos(nx/1);
      const noise2 = noise_pos(nx/2);
      const noise3 = Math.sqrt(Math.abs(noise_pos(nx/128))*(noise0 * 10));
      const noise4 = noise_pos(nx*noise3);
      const noise5 = noise0;
      const surface = Math.floor(noise1*20 + noise2*10 + noise4*3 + noise5) + 10;
      if (y < surface) continue;
      if (y == surface) {
        name = "mitty:grass";
        
        if (get_prandom(x, 1) < 0.08) {
          tree_generate(x, y);
        }
      } else if (y > surface + 4) {
        name = "mitty:stone";
      }
      tiles_add(name, x, y, false);
    }
  }
  generated_chunks.set(`${xs},${ys}`, true);
}

server.on("connection", (socket) => {
  const client = {socket, ip: socket._socket.remoteAddress, player: player_new("unknown", -1)};
  clients.push(client);

  log("game", `${client.ip}: client connected`);

  socket.on("message", async (data) => {
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
        uptime_start
      }));
    } else if (type == "update") {
      if ("player" in message) {
        client.player = message.player;
      } else if ("tile" in message) {
        if (!("mode" in message.tile)) return;
        if (!("pos" in message.tile)) return;
        if (message.tile.mode == "add") {
          if (!("name" in message.tile)) return;
          tiles_add(message.tile.name, message.tile.pos[0], message.tile.pos[1], true);
        } else if (message.tile.mode == "remove") {
          tiles_remove(message.tile.pos[0], message.tile.pos[1], true);
        }
      }
    } else if (type == "request") {
      if ("chunk_pos" in message) {
        const cpos = message.chunk_pos.split(",").map(Number);
        if (!generated_chunks.get(`${cpos[0]},${cpos[1]}`)) {
          chunk_generate(cpos[0], cpos[1], 8, 8);
        }
        for (let y = cpos[1]; y < cpos[1] + 8; y++) {
          for (let x = cpos[0]; x < cpos[0] + 8; x++) {
            tiles_add(tiles_get(x, y), x, y, false, socket);
          }
        }
      }
    }
  });

  socket.on("close", () => {
    if (client.player.id != -1) {
      const index = clients.indexOf(client);
      if (index !== -1) {
        clients.splice(index, 1);
      }

      broadcast({
        type: "leave",
        id: client.player.id
      });
    }
    log("game", client.player.id == -1 ? `${client.ip} disconnected` :  `${client.ip}: ${client.player.username} disconnected`);
  });
});

let s_tick = 0;
setInterval(() => {
  s_tick++;
  if (s_tick == 8) {
    s_tick = 0;
  }

  let players = [];
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (client.player.id == -1) continue;
    players.push(client.player);
  }

  broadcast({ type: "update", players });
}, 1000 / 32);

async function main() {
  log("game", "server listening: ws://localhost:8001");
};

main();
