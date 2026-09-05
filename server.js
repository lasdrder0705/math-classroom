// 静态站点服务器：服务教学章节页面，并提供 /api/chapters 章节列表
// 用法: node server.js --port 7100 --host 127.0.0.1
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ROOT = __dirname;
const CHAPTERS_DIR = path.join(ROOT, "chapters");

// 解析 CLI 参数（兼容 --port 3000 / --port=3000 / -p 3000）
function parseArgs(argv) {
  const args = { port: 7100, host: "127.0.0.1" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const [key, inlineVal] = a.split("=");
    const next = () => argv[++i];
    if (key === "--port" || key === "-p") args.port = parseInt(inlineVal || next(), 10);
    else if (key === "--host" || key === "-H") args.host = inlineVal || next();
  }
  return args;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// 从 HTML 文件中提取 <title> 作为章节标题
function extractTitle(filePath) {
  try {
    const head = fs.readFileSync(filePath, "utf8").slice(0, 5000);
    const m = head.match(/<title>([^<]*)<\/title>/i);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

function listChapters() {
  if (!fs.existsSync(CHAPTERS_DIR)) return [];
  return fs
    .readdirSync(CHAPTERS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".html"))
    .sort()
    .map((f) => ({
      file: f,
      title: extractTitle(path.join(CHAPTERS_DIR, f)) || f.replace(/\.html$/i, ""),
      url: "/chapters/" + encodeURIComponent(f),
      updatedAt: fs.statSync(path.join(CHAPTERS_DIR, f)).mtime.toISOString(),
    }));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsed.pathname);

  if (pathname === "/api/chapters") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(listChapters()));
    return;
  }

  if (pathname === "/") pathname = "/index.html";

  // 防止路径穿越
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404 · 页面不存在</h1><p><a href='/'>返回章节列表</a></p>");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

const { port, host } = parseArgs(process.argv.slice(2));
server.listen(port, host, () => {
  console.log(`数学教学站点已启动: http://${host}:${port}/`);
});
