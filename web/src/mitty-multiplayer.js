let socket = null;

function handler(message) {
  if (message.type == "auth") {
    state.player.name = message.name;
    state.player.id = message.id;
    state.player.pid = message.pid;
  }
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

function update() {
  socket.send(JSON.stringify({
    type: "update",
    player: state.player
  }));
}

const multiplayer = {};
multiplayer.init = init;
multiplayer.update = update;
window.multiplayer = multiplayer;
