let canvas = null;
let ctx = null;

let state = {
  time: 0.6,
  width: 0,
  height: 0
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  state.width = canvas.width;
  state.height = canvas.height;
}

function init() {
  console.log("[mitty] loading: canvas");
  canvas = document.getElementById("mitty");
  resize();
  
  console.log("[mitty] adding events: canvas");
  window.addEventListener("resize", resize);

  console.log("[mitty] loading: ctx");
  ctx = canvas.getContext("2d");
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
window.engine = engine;
window.state = state;
