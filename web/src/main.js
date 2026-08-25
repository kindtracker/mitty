(async function() {
  await engine.init();

  function loop() {
    engine.render();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
