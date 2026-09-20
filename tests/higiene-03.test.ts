// HIGIENE-03 (VERDAD-01, 2026-09-20): cierre.mjs distingue por el transcript si la sesión escribió en T/H. Copia del clasificador
// de T (tools/_transcript.mjs, idéntico en los dos repos): Edit/Write dentro de una raíz o shell que muta → escribió; lecturas →
// sólo lectura; sin transcript → sin-transcript (falla cerrado). Mutación en tests/mutaciones/higiene-03.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clasificar, escribioEn } from "../tools/_transcript.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const T_ROOT = "C:/Users/liama/Desktop/Nichos/Barber-shop-template-main";
const H_ROOT = "C:/Users/liama/Desktop/Nichos-hub";

test("HIGIENE-03 (H): Edit en H o git commit = escribió; git status/cat = sólo lectura; sin transcript = sin-transcript; el clasificador es idéntico al de T", () => {
  const roots = [H_ROOT, T_ROOT];
  const edit = { name: "Write", input: { file_path: "C:\\Users\\liama\\Desktop\\Nichos-hub\\tools\\x.mjs" }, cwd: "C:\\Users\\liama\\Desktop\\Nichos-hub" };
  const lectura = { name: "Bash", input: { command: "git status --short; cat CLAUDE.md" }, cwd: "C:\\Users\\liama\\Desktop\\Nichos-hub" };
  const commit = { name: "PowerShell", input: { command: "git add -A; git commit -m x" }, cwd: "C:\\Users\\liama\\Desktop\\Nichos-hub" };
  assert.equal(clasificar([lectura], roots).escribio.length, 0);
  assert.equal(clasificar([lectura, edit], roots).escribio.length, 1);
  assert.equal(clasificar([commit], roots).escribio[0].repo, H_ROOT);
  const dir = mkdtempSync(join(tmpdir(), "h03-"));
  const linea = (u: object, cwd: string) => JSON.stringify({ type: "assistant", cwd, message: { content: [{ type: "tool_use", ...u }] } });
  writeFileSync(join(dir, "lee.jsonl"), linea({ name: "Bash", input: lectura.input }, lectura.cwd));
  writeFileSync(join(dir, "escribe.jsonl"), linea({ name: "Write", input: edit.input }, edit.cwd));
  assert.equal(escribioEn(join(dir, "lee.jsonl"), roots).estado, "solo-lectura");
  assert.equal(escribioEn(join(dir, "escribe.jsonl"), roots).estado, "escribio");
  assert.equal(escribioEn("", roots).estado, "sin-transcript");
  writeFileSync(join(dir, "ilegible.jsonl"), "no es json\n");
  assert.equal(escribioEn(join(dir, "ilegible.jsonl"), roots).estado, "sin-transcript", "sin tool_use legibles no se acredita lectura (falla cerrado)");
  const mio = readFileSync(resolve(ROOT, "tools/_transcript.mjs"), "utf8"), deT = readFileSync(join(T_ROOT, "tools/_transcript.mjs"), "utf8");
  assert.equal(mio, deT, "tools/_transcript.mjs debe ser byte a byte el de T (una sola implementación, dos copias)");
  assert.equal(readFileSync(resolve(ROOT, "tools/cierre.mjs"), "utf8"), readFileSync(join(T_ROOT, "tools/cierre.mjs"), "utf8"), "tools/cierre.mjs idéntico en T y H");
});
