/**
 * build-blink-loop.mjs — crea un loop WebM alpha de parpadeo/doze a partir de
 * un frame de ojos abiertos (ya con alpha) + uno de ojos cerrados (cream bg).
 *
 *   node scripts/build-blink-loop.mjs <openAlphaPng> <closedCreamPng> <outWebm>
 *
 * Quita el cream del frame cerrado (flood-fill), lo alinea al abierto, hace
 * crossfade por píxel (lerp RGBA) para un parpadeo suave, y codifica VP9 yuva420p.
 */
import sharp from "sharp";
import { execFileSync } from "child_process";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { resolve } from "path";

const [openPath, closedPath, outWebm] = process.argv.slice(2);
if (!openPath || !closedPath || !outWebm) { console.error("uso: <open> <closed> <out>"); process.exit(1); }

const W = 760, H = 888; // canvas (igual que la pose abierta)
const TMP = resolve(process.cwd(), "public/mascot/hedgehog/_gen/_frames");
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

function floodFillCream(data, w, h, ch) {
  const corner = (x, y) => { const i = (y * w + x) * ch; return [data[i], data[i+1], data[i+2]]; };
  const cs = [corner(2,2), corner(w-3,2), corner(2,h-3), corner(w-3,h-3)];
  const R = Math.round(cs.reduce((s,c)=>s+c[0],0)/4), G = Math.round(cs.reduce((s,c)=>s+c[1],0)/4), B = Math.round(cs.reduce((s,c)=>s+c[2],0)/4);
  const TOL=34*34, FEA=60*60;
  const d2=(r,g,b)=>{const a=r-R,c=g-G,d=b-B;return a*a+c*c+d*d;};
  const vis=new Uint8Array(w*h), st=[];
  const push=(x,y)=>{ if(x<0||y<0||x>=w||y>=h)return; const p=y*w+x; if(vis[p])return; const i=p*ch; if(d2(data[i],data[i+1],data[i+2])<=TOL){vis[p]=1;st.push(p);} };
  for(let x=0;x<w;x++){push(x,0);push(x,h-1);} for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
  while(st.length){const p=st.pop();const x=p%w,y=(p-x)/w;push(x+1,y);push(x-1,y);push(x,y+1);push(x,y-1);}
  for(let p=0;p<w*h;p++){const i=p*ch; if(vis[p]){data[i+3]=0;continue;} const dd=d2(data[i],data[i+1],data[i+2]); if(dd<FEA){const t=dd/FEA;const a=Math.round(255*Math.min(1,t*1.15)); if(a<data[i+3])data[i+3]=a;}}
  return data;
}

async function loadOpen() {
  const { data } = await sharp(openPath).ensureAlpha().resize(W, H, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  return data;
}
async function loadClosed() {
  // flood-fill cream del frame generado, luego trim a contenido, luego encajar en WxH
  const raw = await sharp(closedPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  floodFillCream(raw.data, raw.info.width, raw.info.height, raw.info.channels);
  const cleaned = await sharp(Buffer.from(raw.data), { raw: { width: raw.info.width, height: raw.info.height, channels: raw.info.channels } })
    .png().toBuffer();
  const trimmed = await sharp(cleaned).trim({ threshold: 1 }).resize(W, H, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return trimmed.data;
}

function lerpFrame(open, closed, t) {
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < out.length; i++) out[i] = Math.round(open[i] * (1 - t) + closed[i] * t);
  return out;
}

async function writeFrame(idx, buf) {
  const p = resolve(TMP, `f${String(idx).padStart(3, "0")}.png`);
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toFile(p);
}

const open = await loadOpen();
const closed = await loadClosed();

// Secuencia (12fps): hold abierto, parpadeo rápido, hold cerrado breve, abrir, hold.
const seq = [];
for (let i = 0; i < 30; i++) seq.push(0);            // ~2.5s ojos abiertos
seq.push(0.4, 0.75, 1);                               // cerrar (rápido)
seq.push(1, 1);                                       // cerrado breve
seq.push(0.75, 0.4, 0.15);                            // abrir
for (let i = 0; i < 6; i++) seq.push(0);              // hold abierto final (loop seamless)

let idx = 0;
for (const t of seq) {
  const buf = t === 0 ? open : t === 1 ? closed : lerpFrame(open, closed, t);
  await writeFrame(idx++, buf);
}
console.log(`frames: ${idx}`);

execFileSync("ffmpeg", [
  "-y", "-framerate", "12", "-i", resolve(TMP, "f%03d.png"),
  "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "34",
  "-an", outWebm,
], { stdio: "inherit" });

rmSync(TMP, { recursive: true, force: true });
console.log("done ->", outWebm);
