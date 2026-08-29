let socket = null;

function handler(message) {
  if (message.type == "auth") {
    state.player.name = message.name;
    state.player.id = message.id;
    state.player.pid = message.pid;
  } else if (message.type == "leave") {
    console.log(message)
    delete state.players[message.id];
  } else if (message.type == "update") {
    for (let player of message.players) {
      if (player.id == state.player.id) {
        continue;
      }
      state.players[player.id] = player;
    }
  }
}

function update() {
  socket.send(JSON.stringify({
    type: "update",
    player: state.player
  }));
}

async function init(url, session_token) {
  state.multiplayer = {
    socket: null
  };

  socket = new WebSocket(url);
  state.multiplayer.socket = socket;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.onmessage = (data) => {
    handler(JSON.parse(data.data.toString()));
  };
 
  socket.onclose = (e) => {
    console.log(`[mitty] socket is disconnected: reason: '${e.reason}' | code: '${e.code}'`);
  };

  socket.send(JSON.stringify({
    type: "auth",
    session_token
  }));
}

const multiplayer = {};
multiplayer.init = init;
multiplayer.update = update;
window.multiplayer = multiplayer;
