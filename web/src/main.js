engine.init();

async function loop() {
  engine.render();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
