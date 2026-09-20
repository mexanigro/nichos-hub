// VERDAD-01 (2026-09-20). En H, `veredicto` es el mismo motor de T (tools/verdad/veredicto.mjs del hermano, por la ruta fija de
// _git.mjs): la entrega.json y los informes viven en T (`verdad/`), pero las afirmaciones con `repo: "H"` se prueban aquí y el
// informe cita el HEAD de H (`--stop` desde H exige que el informe cite este HEAD). Sin hermano en disco → exit 2 (fail closed).
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { HERMANO } from "../_git.mjs";

const motor = join(HERMANO, "tools", "verdad", "veredicto.mjs");
if (!existsSync(motor)) { console.error(`veredicto (H): no encuentro el motor en ${motor} (hermano ausente): se bloquea`); process.exit(2); }
const r = spawnSync(process.execPath, [motor, ...process.argv.slice(2), "--repo", "H"], { stdio: "inherit", cwd: HERMANO });
process.exit(r.status ?? 2);
