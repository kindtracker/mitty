const http = require("http");
const fs = require("fs");
const path = require("path");

const mimi = { 
  "js": "application/javascript", 
  "html": "text/html", 
  "css": "text/css", 
  "json": "application/json", 
  "wasm": "application/wasm", 
  "png": "image/png", 
  "jpg": "image/jpeg", 
  "jpeg": "image/jpeg", 
  "gif": "image/gif", 
  "webp": "image/webp", 
  "svg": "image/svg+xml", 
  "ico": "image/x-icon", 
  "txt": "text/plain"
};

const server = http.createServer((req, res) => {
  let ip = req.socket.remoteAddress;
  if (ip == "::1" || ip == "127.0.0.1") {
    ip = "localhost";
  }
  console.log(`[mitty] ${ip}: ${req.url}`);
  let fpath = path.join(__dirname, "web", req.url);

  if (req.url === "/") {
    fpath = path.join(__dirname, "web", "index.html");
  }

  const jpath = path.join("web", req.url);
  const parts = jpath.split("/");
  if (parts[1] == "api") {
    res.writeHead(404, {
      "Content-Type": "text/plain"
    });
    res.end("API is not available");
    return;
  }

  fs.readFile(fpath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        "Content-Type": "text/plain"
      });

      res.end("404 Not Found\n");
      return;
    }

    const ext = path.extname(fpath).slice(1); 
    const mime = mimi[ext] || "application/octet-stream"; 
    res.writeHead(200, { "Content-Type": mime });

    res.end(data);
  });
});

server.listen(8000, () => {
  console.log("[mitty] server listening: http://localhost:8000");
});
