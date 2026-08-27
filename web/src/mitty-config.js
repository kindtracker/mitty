const base = location.origin;

window.config = {
  base,
  api: `${base}/api/`,
  game: `ws://${location.hostname}:8001`
};
