let canvas = null;
let ctx = null;

let state = {
  time: 0.5,
  width: 0,
  height: 0,
  assets: {},
  player: null,
  players: [],
  mouse: [],
  camera: [0, 0]
};

const all_textures = {
  "player": "/assets/player.png",
  "tileset": "/assets/tileset.png"
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  state.width = canvas.width;
  state.height = canvas.height;
}

function load_texture(path) {
  return new Promise((resolve, reject) => {
    const texture = new Image();

    texture.onload = () => {resolve(texture);};
    texture.onerror = () => {
      reject(new Error(`failed to load texture: ${path}`));
    };
    texture.src = path;
  });
}

async function init() {
  console.log("[mitty] loading: canvas");
  canvas = document.getElementById("mitty");
  resize();
  
  console.log("[mitty] adding events: canvas");
  window.addEventListener("resize", resize);

  console.log("[mitty] loading: ctx");
  ctx = canvas.getContext("2d");

  console.log("[mitty] loading: state");
  state.player = player_new("Mitty", 1);

  console.log("[mitty] loading: textures");
  for (const [key, value] of Object.entries(all_textures)) {
    console.log(`[mitty] loading: ${key}:${value}`);
    state.assets[key] = await load_texture(value);
  }
}

function player_new(name, id) {
  return {
    name,
    id,
    pid: Date.now().toString(16),
    pos: [0, 0],
    face: 1,
    animation: 0
  }
}

function background() {
  const cycle = (Math.sin(state.time) + 1) / 2;
  const top_light = 10 + 60 * cycle;
  const bottom_light = 5 + 50 * cycle;

  for (let y = 0; y < state.height; y++) {
    const lerp = y / state.height;
    const light = top_light + (bottom_light - top_light) * lerp;

    ctx.strokeStyle = `hsl(210, 100%, ${light / 80 * 100}%)`;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.width, y);
    ctx.stroke();
  }
}

function player_render(player) {
  console.log(JSON.stringify(player));
  ctx.drawImage(state.assets.player, player.animation * 16, 0, 16, 18, player.pos[0], player.pos[1], 16, 18);
}

function render() {
  background();

  ctx.save();
  ctx.translate(state.camera[0], state.camera[1]);
  const all_players = [state.player, ...state.players];
  for (const player of all_players) {
    player_render(player);
  }
  ctx.restore();
}

const engine = {};
engine.init = init;
engine.render = render;
engine.load_texture = load_texture;
window.engine = engine;
window.state = state;
