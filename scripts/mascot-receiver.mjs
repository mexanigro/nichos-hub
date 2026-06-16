/**
 * mascot-receiver.mjs — recibe una imagen desde window.name del navegador.
 * Uso: node scripts/mascot-receiver.mjs <outPath> [port]
 * El tab de Chrome (con la dataURL en window.name) navega a http://localhost:<port>/,
 * el HTML lee window.name y la POSTea a /save, que la escribe a disco. Luego sale.
 */
import http from "http";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

const OUT = process.argv[2] || "public/mascot/hedgehog/_gen/out.png";
const PORT = Number(process.argv[3] || 7777);
mkdirSync(dirname(OUT), { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") { res.end(); return; }
  if (req.method === "POST" && req.url === "/save") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const b64 = body.includes(",") ? body.split(",")[1] : body;
        const buf = Buffer.from(b64, "base64");
        writeFileSync(OUT, buf);
        console.log(`SAVED ${OUT} ${buf.length} bytes`);
        res.end("ok " + buf.length);
        setTimeout(() => process.exit(0), 400);
      } catch (e) {
        res.statusCode = 500; res.end("err " + e.message);
      }
    });
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end(`<!doctype html><meta charset=utf8><body>receiver<script>
    (function(){ var d=window.name||''; if(!d.startsWith('data:')){document.title='NODATA';return;}
      fetch('/save',{method:'POST',body:d}).then(function(r){return r.text()}).then(function(t){document.title='SAVED '+t}).catch(function(e){document.title='ERR '+e}); })();
  </script></body>`);
});
server.listen(PORT, () => console.log(`receiver on http://localhost:${PORT} -> ${OUT}`));
setTimeout(() => { console.log("timeout, exiting"); process.exit(1); }, 120000);
