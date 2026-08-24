let canvas = null;
let ctx = null;

let state = {
  time: 0.6,
  width: 0,
  height: 0,
  assets: {}
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

function init() {
  console.log("[mitty] loading: canvas");
  canvas = document.getElementById("mitty");
  resize();
  
  console.log("[mitty] adding events: canvas");
  window.addEventListener("resize", resize);

  console.log("[mitty] loading: ctx");
  ctx = canvas.getContext("2d");

  console.log("[mitty] loading: textures");
  for (const [key, value] of Object.entries(all_textures)) {
    console.log(`[mitty] loading: ${key}:${value}`);
    state.assets[key] = load_texture(value);
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

function render() {
  background();
}

const engine = {};
engine.init = init;
engine.render = render;
engine.load_texture = load_texture;
window.engine = engine;
window.state = state;
