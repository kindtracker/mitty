let canvas = null;
let ctx = null;

let state = {
  time: 1,
  width: 0,
  height: 0,
  assets: {},
  player: null,
  players: [],
  keys: {},
  mouse: [0, 0],
  camera: [0, 0],
  scale: 4,
  tiles: null
};

const all_textures = {
  "player": "/assets/player.png",
  "tileset": "/assets/tileset.png"
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  state.width = canvas.width;
  state.height = canvas.height

  if (!ctx) return;
  ctx.msImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.imageSmoothingEnabled = false;
}

function onmouse(e) {
  if (e.clientX) {
    state.mouse = [e.clientX, e.clientY];
  }
}

function onkey(e) {
  if (e.type == "keydown") {
    state.keys[e.code] = true;
  } else if (e.type == "keyup") {
    state.keys[e.code] = false;
  }
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
  window.addEventListener("mousemove", onmouse);
  window.addEventListener("keydown", onkey);
  window.addEventListener("keyup", onkey);

  console.log("[mitty] loading: ctx");
  ctx = canvas.getContext("2d");
  resize();

  console.log("[mitty] loading: state");
  state.player = player_new("Mitty", 1);
  state.tiles = new Map();

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
    speed: 7.5,
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
  const x = player.pos[0] * 16;
  const y = player.pos[1] * 16;

  ctx.save();
  if (player.face == -1) {
    ctx.translate(x + 16, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }
  ctx.drawImage(state.assets.player, player.animation * 16, 0, 16, 18, x, y, 16, 18);
  ctx.restore();
}

function camera() {
  const half_width = state.width / 2;
  const half_height = state.height / 2;
  const player_px = state.player.pos[0] * 16;
  const player_py = state.player.pos[1] * 16;
  const mouse_offset_x = state.mouse[0] - half_width;
  const mouse_offset_y = state.mouse[1] - half_height;
  const mouse_fov = 0.25;
  state.camera[0] = half_width - player_px * state.scale - 8 - mouse_offset_x * mouse_fov;
  state.camera[1] = half_height - player_py * state.scale - 9 - mouse_offset_y * mouse_fov;
}

function tiles() {
  for (const [key, tile] of state.tiles) {
    const pos = key.split(",").map(Number);
    console.log(key, tile)
    ctx.drawImage(state.assets.tileset, tile.pos[0]*16, tile.pos[1]*16, 16, 16, pos[0], pos[1], 16, 18); 
  }  
}

function tiles_add(name, x, y) {
  state.tiles.set(`${x},${y}`, mtiles[name]);
}

function render() {
  background();

  camera();
  ctx.save();
  ctx.translate(state.camera[0], state.camera[1]);
  ctx.scale(state.scale, state.scale);
  tiles();
  const all_players = [state.player, ...state.players];
  for (const player of all_players) {
    player_render(player);
  }
  ctx.restore();

  return 1;
}

function keys(dt) {
  if (state.keys["KeyA"] == true) {
    state.player.face = -1;
    state.player.pos[0] -= state.player.speed * dt;
  } 
  if (state.keys["KeyD"] == true) {
    state.player.face = 1;
    state.player.pos[0] += state.player.speed * dt;
  }
}

function update(dt) {
  keys(dt);
}

const engine = {};
engine.init = init;
engine.render = render;
engine.update = update;
engine.load_texture = load_texture;
engine.tiles_add = tiles_add;
window.engine = engine;
window.state = state;
