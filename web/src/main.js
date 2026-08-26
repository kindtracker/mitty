(async function() {
  const engine = window.engine;
  await engine.init();

  engine.tiles_add("mitty:grass", [0, 2]);

  let last_time = null;
  function loop() {
    const now = Date.now();
    if (last_time === null) {
      last_time = now;
    }
    const dt = (now - last_time) / 1000;
    last_time = now;
    engine.update(dt);
    engine.render(dt);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
