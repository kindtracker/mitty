(async function() {
  const name = "Mitty";

  const engine = window.engine;
  const multiplayer = window.multiplayer;
  const mitty_config = window.config;
  await engine.init(name);
  await multiplayer.init(mitty_config.game, name);
  
  engine.tiles_add("mitty:grass", [0, 2]);

  let last_time = null;
  let ml_last_time = null;
  function loop() {
    const now = Date.now();
    if (last_time == null) {
      last_time = now;
    }
    if (ml_last_time == null) {
      ml_last_time = now;
    }
    const dt = (now - last_time) / 1000;
    const ml_dt = (now - ml_last_time) / 1000;
    last_time = now;
    if (ml_dt > 1/24) {
      multiplayer.update();
      ml_last_time = now;
    }
    if (dt < 1) {
      engine.update(dt);
      engine.render(dt);
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
