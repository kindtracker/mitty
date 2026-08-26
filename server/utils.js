const fs = require("fs");

function log(server_type, message) {
  const log_message = `[${new Date().toISOString()}] [mitty:${server_type}] ${message}`;
  console.log(log_message);
  fs.appendFileSync(`server_data/logs/${server_type}.txt`, log_message + "\n");
}

module.exports = { log };
