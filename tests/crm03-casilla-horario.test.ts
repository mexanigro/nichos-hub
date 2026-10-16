// CRM-03 · técnico (clon de H): la casilla de equipo no ofrece editar el horario de una persona ya guardada —lo carga la dueña en el
// CRM de su web y guardarConfig lo conserva (G1)— y sí lo sugiere para una persona nueva. Montada con `renderToString` (D-34).
import { test } from "node:test";
import assert from "node:assert/strict";
import { importarModulo } from "./orden/arreglos-03/_comun.ts";

const montar = async (props: Record<string, unknown>) => {
  const SERVIDOR = "react-dom/server";
  const { renderToString } = (await import(SERVIDOR)) as { renderToString: (n: unknown) => string };
  const { createElement } = await import("react");
  const C = (await importarModulo("src/components/config-editors/staff-editor.tsx")).StaffEditor;
  return renderToString(createElement(C as never, props as never));
};
const staff = [{ id: "noa", name: "נועה" }];
const base = { value: staff, onChange: () => {}, clientId: "x", config: { staff }, setConfig: () => {} };

test("persona guardada: el aviso de que el horario lo carga la dueña, sin el editor; persona nueva: el editor", async () => {
  const guardada = await montar({ ...base, idsGuardados: ["noa"] });
  assert.match(guardada, /lo carga la dueña en el CRM de su web/);
  assert.doesNotMatch(guardada, /Horario semanal/);
  const nueva = await montar({ ...base, idsGuardados: [] });
  assert.match(nueva, /Horario semanal/);
  assert.doesNotMatch(nueva, /lo carga la dueña en el CRM de su web/);
});
