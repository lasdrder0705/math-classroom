// 扫描 chapters/ 目录，生成静态托管可用的 chapters.json 章节清单
// 以后每次新增章节 HTML 后运行一次：npm run build
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CHAPTERS_DIR = path.join(ROOT, "chapters");
const OUT = path.join(ROOT, "chapters.json");

function extractTitle(filePath) {
  try {
    const head = fs.readFileSync(filePath, "utf8").slice(0, 5000);
    const m = head.match(/<title>([^<]*)<\/title>/i);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

const chapters = fs
  .readdirSync(CHAPTERS_DIR)
  .filter((f) => f.toLowerCase().endsWith(".html"))
  .sort()
  .map((f) => ({
    file: f,
    title: extractTitle(path.join(CHAPTERS_DIR, f)) || f.replace(/\.html$/i, ""),
    url: "chapters/" + encodeURIComponent(f),
    updatedAt: fs.statSync(path.join(CHAPTERS_DIR, f)).mtime.toISOString(),
  }));

fs.writeFileSync(OUT, JSON.stringify(chapters, null, 2) + "\n", "utf8");
console.log(`chapters.json 已生成，共 ${chapters.length} 个章节：`);
chapters.forEach((c) => console.log(`  - ${c.file} → ${c.title}`));
