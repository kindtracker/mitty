const { spawn } = require("child_process");
const fs = require("fs");

if (!fs.existsSync("server_data/logs/web.txt")) {
  fs.writeFileSync("server_data/logs/web.txt", "");
}
if (!fs.existsSync("server_data/logs/game.txt")) {
  fs.writeFileSync("server_data/logs/game.txt", "");
}

const web = spawn("node", ["server/web.js"], {
  stdio: "inherit"
});

const game = spawn("node", ["server/game.js"], {
  stdio: "inherit"
});

process.on("SIGINT", () => {
  web.kill();
  game.kill();
  process.exit();
});
