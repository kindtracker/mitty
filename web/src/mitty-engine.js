let canvas = null;
let ctx = null;

let state = {
  time: 1,
  width: 0,
  height: 0,
  assets: {},
  player: null,
  players: {},
  keys: {},
  mouse_buttons: {},
  mouse: [0, 0],
  mouse_world: [0, 0],
  camera: [0, 0],
  breaking: 0,
  breaking_pos: null,
  scale: 4,
  world: null,
  chunks: null,
  multiplayer: null,
  server_uptime_start: Date.now()
};

const all_textures = {
  "player": "/assets/player.png",
  "tileset": "https://minecraft.wiki/images/15w41a_textures-atlas.png?0ff46"
}

function vec_add(a, b) {
  return [a[0] + b[0], a[1] + b[1]];
}

function vec_mul(a, b) {
  return [a[0] * b[0], a[1] * b[1]];
}

function vec_get(a) {
  return {x: a[0], y: a[1]};
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
  e.preventDefault();
  state.mouse = [e.clientX, e.clientY];
  if (e.type == "mousedown" || e.type == "mouseup") {
    state.mouse_buttons[e.button] = e.type == "mousedown" ? true : false;
  }
  if (e.type == "mousedown") {
    if (tiles_get(state.mouse_world)) {
      state.breaking_pos = state.mouse_world;
    } else {
      tiles_add("mitty:grass", state.mouse_world);
      state.breaking_pos = null;
    }
  } else if (e.type == "contextmenu") {
    tiles_remove(state.mouse_world);
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

async function init(player_name) {
  console.log("[mitty] loading: canvas");
  canvas = document.getElementById("mitty");
  resize();
  
  console.log("[mitty] adding events: canvas");
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onmouse);
  window.addEventListener("keydown", onkey);
  window.addEventListener("keyup", onkey);
  window.addEventListener("contextmenu", onmouse);
  window.addEventListener("click", onmouse);
  window.addEventListener("mousedown", onmouse);
  window.addEventListener("mouseup", onmouse);

  console.log("[mitty] loading: ctx");
  ctx = canvas.getContext("2d");
  resize();

  console.log("[mitty] loading: state");
  state.player = player_new(player_name, 1);
  state.world = new Map();
  state.chunks = new Map();

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
    speedwalk: 7.5,
    jumppower: 12.8,
    pos: [0, 0],
    vpos: [0, 0],
    on_ground: true,
    face: 1,
    animation: 0
  }
}

function background() {
  const cycle = (Math.sin(state.time) + 1) / 2;
  const smooth = cycle * cycle * (3 - 2 * cycle);

  const twilight = 1 - Math.abs(cycle - 0.5) * 2;
  const night = 1 - smooth;

  const top_light = 8 + 52 * smooth;
  const bottom_light = 5 + 45 * smooth;

  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, `hsl(220, ${45 + smooth * 40}%, ${top_light}%)`);
  gradient.addColorStop(0.45, `hsl(210, ${55 + smooth * 30}%, ${(top_light + bottom_light) / 2}%)`);
  gradient.addColorStop(1, `hsl(200, ${50 + smooth * 30}%, ${bottom_light}%)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);

  if (night > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${night * 0.8})`;
    for (let i = 0; i < 160; i++) {
      const x = (Math.sin(Date.now()/512000+i*i)+1)/2 * state.width;
      const y = ((i + state.time*2) * 71.3) % (state.height * 0.8);
      const size = 0.5 + ((i * 17) % 10) / 10;

      ctx.globalAlpha = night * (0.4 + Math.sin(state.time*8 + i * 0.3));
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  }

  if (twilight > 0.01) {
    const glow = ctx.createLinearGradient(0, state.height * 0.45, 0, state.height);
    glow.addColorStop(0, "rgba(255, 120, 50, 0)");
    glow.addColorStop(0.7, `rgba(255, 120, 50, ${twilight * 0.15})`);
    glow.addColorStop(1, `rgba(255, 180, 80, ${twilight * 0.3})`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, state.width, state.height);
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
  ctx.drawImage(state.assets.player, Math.floor(player.animation) * 16, 0, 16, 18, x, y, 16, 18);
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
  const start_x = Math.floor((-state.camera[0]) / (16 * state.scale)) - 1;
  const start_y = Math.floor((-state.camera[1]) / (16 * state.scale)) - 1;
  const end_x = Math.ceil((state.width - state.camera[0]) / (16 * state.scale)) + 1;
  const end_y = Math.ceil((state.height - state.camera[1]) / (16 * state.scale)) + 1;

  for (let y = start_y; y < end_y; y++) {
    for (let x = start_x; x < end_x; x++) {
      const tile = state.world.get(`${x},${y}`);
      if (!tile) continue;
      ctx.drawImage(state.assets.tileset, tile.pos[0]*16, tile.pos[1]*16, 16, 16, x*16, y*16, 16, 16);
    }
  }
}

function chunks_request() {
  const start_x = Math.floor((-state.camera[0]) / (16 * state.scale)) - 1;
  const start_y = Math.floor((-state.camera[1]) / (16 * state.scale)) - 1;
  const end_x = Math.ceil((state.width - state.camera[0]) / (16 * state.scale)) + 1;
  const end_y = Math.ceil((state.height - state.camera[1]) / (16 * state.scale)) + 1;

  for (let y = start_y; y < end_y; y += 8) {
    for (let x = start_x; x < end_x; x += 8) {
      const has_chunk = state.chunks.get(`${x},${y}`);
      if (has_chunk) continue;
      multiplayer.chunk_request(x, y);
    }
  }
}

function tiles_add(name, pos, call_multiplayer = true) {
  state.world.delete(`${pos[0]},${pos[1]}`);
  state.world.set(`${pos[0]},${pos[1]}`, mtiles[name]);
  if (call_multiplayer) {
    multiplayer.tiles_add_callback(name, pos);
  }
}

function tiles_remove(pos, call_multiplayer = true) {
  state.world.delete(`${pos[0]},${pos[1]}`);
  if (call_multiplayer) {
    multiplayer.tiles_remove_callback(pos);
  }
}

function tiles_get(pos) {
  return state.world.get(`${pos[0]},${pos[1]}`);
}

function selec() {
  const width = 2;

  const pos = vec_mul(state.mouse_world, [16, 16]);
  const tile = tiles_get([pos[0]/16, pos[1]/16]);
  ctx.save();
  if (tile) {
    ctx.globalCompositeOperation = "difference";
    ctx.strokeStyle = "#ffffff";
  } else {
    ctx.strokeStyle = "#ffffff30";
  }
  ctx.lineWidth = width / state.scale;
  ctx.strokeRect(pos[0]+0.75*(width/5), pos[1]+0.75*(width/5), 16-1.25*(width/5), 16-1.25*(width/5));
  ctx.restore();
    
  const breaking = state.breaking ? Math.floor(state.breaking+1) : 1;
  if (state.breaking_pos) {
    const tile = mtiles[`mitty:breaking:${breaking}`];
    const pos = state.mouse_world;
    ctx.drawImage(state.assets.tileset, tile.pos[0]*16, tile.pos[1]*16, 16, 16, pos[0]*16, pos[1]*16, 16, 16); 
  }
}

function render() {
  background();

  camera();
  ctx.save();
  ctx.translate(state.camera[0], state.camera[1]);
  ctx.scale(state.scale, state.scale);
  tiles();
  const all_players = [state.player, ...Object.values(state.players)];
  for (const player of all_players) {
    player_render(player);
  }
  selec();
  ctx.restore();

  return 1;
}

function keys(dt) {
  const moving = state.keys["KeyA"] || state.keys["KeyD"];
  if (state.keys["KeyA"] && state.keys["KeyD"]) {
    state.player.animation = 0;
    return;
  }
  if (state.keys["KeyA"] == true) {
    state.player.face = -1;
    state.player.pos[0] -= state.player.speedwalk * dt;
  } 
  if (state.keys["KeyD"] == true) {
    state.player.face = 1;
    state.player.pos[0] += state.player.speedwalk * dt;
  }
  if ((state.keys["Space"] || state.keys["KeyW"]) == true && state.player.on_ground) {
    state.player.vpos[1] = -state.player.jumppower;
  }
  if (moving) {
    state.player.animation = (performance.now() / 150) % 7;
  } else {
    state.player.animation = 0;
  }
}

function player_collide(player, tile) {
  const pos = player.pos;
  const size = [1, 18 / 16];

  return (
    pos[0] < tile[0] + 1 &&
    pos[0] + size[0] > tile[0] &&
    pos[1] < tile[1] + 1 &&
    pos[1] + size[1] > tile[1]
  );
}

function player_add(player) {
  state.players[player.id] = player;
}

function player_update(dt, player) {
  const gravity = 0.7;

  player.vpos[1] += gravity;

  let vpos = vec_mul(player.vpos, [dt, dt]);
  player.pos = vec_add(player.pos, vpos);

  player.on_ground = false;

  const start_x = Math.floor(player.pos[0]) - 1;
  const end_x = Math.floor(player.pos[0]) + 2;
  const start_y = Math.floor(player.pos[1]) - 1;
  const end_y = Math.floor(player.pos[1]) + 3;

  for (let y = start_y; y <= end_y; y++) {
    for (let x = start_x; x <= end_x; x++) {
      const tile = tiles_get([x, y]);

      if (!tile) continue;
      if (!player_collide(player, [x, y])) continue;

      const overlap_left = (player.pos[0] + 1) - x;
      const overlap_right = (x + 1) - player.pos[0];
      const overlap_top = (player.pos[1] + 18 / 16) - y;
      const overlap_bottom = (y + 1) - player.pos[1];

      const min_overlap = Math.min(overlap_left, overlap_right, overlap_top, overlap_bottom);

      if (min_overlap === overlap_bottom) {
        player.pos[1] = y + 1;
        player.vpos[1] = 0;
      } else if (min_overlap === overlap_top) {
        player.pos[1] = y - 18 / 16;
        player.vpos[1] = 0;
        player.on_ground = true;
      } else if (min_overlap === overlap_right) {
        player.pos[0] = x + 1;
        player.vpos[0] = 0;
      } else {
        player.pos[0] = x - 1;
        player.vpos[0] = 0;
      }
    }
  }
}

function mouse_buttons(dt) {
  if (!state.mouse_buttons[0] || state.breaking_pos == null || !state.mouse_world?.every((v, i) => v == state.breaking_pos?.[i])) {
    state.breaking = 0;
    state.breaking_pos = null;
    return;
  }

  const pos = state.breaking_pos;
  state.breaking += dt / tiles_get(pos).hardness;

  if (Math.floor(state.breaking) >= 7) {
    state.breaking = 0;
    state.breaking_pos = null;
    tiles_remove(state.mouse_world);
  }
}

function update(dt) {
  state.mouse_world = [
    Math.floor((state.mouse[0] - state.camera[0]) / state.scale / 16),
    Math.floor((state.mouse[1] - state.camera[1]) / state.scale / 16)
  ];

  state.time = ((Date.now() - state.server_uptime_start) / (64 * 1000)) % Math.PI * 2 + 1;

  keys(dt);

  const all_players = [state.player, ...Object.values(state.players)];
  for (const player of all_players) {
    player_update(dt, player);
  }
  chunks_request();

  mouse_buttons(dt);
}

const engine = {};
engine.init = init;
engine.render = render;
engine.update = update;
engine.load_texture = load_texture;
engine.tiles_add = tiles_add;
engine.tiles_remove = tiles_remove;
engine.player_add = player_add;
window.engine = engine;
window.state = state;
