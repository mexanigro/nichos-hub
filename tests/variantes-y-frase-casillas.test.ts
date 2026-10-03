// INSTAGRAM-FAQ-01 · guard de la condición 2 del revisor (aprobada por Liam, 2026-10-02): E3 y E4 de la orden prueban la función y la
// casilla de variantes; esto EJECUTA lo que muestran las dos casillas que tocan, montadas con `renderToString` (D-34: sin navegador ni
// Firestore), en las dos direcciones:
// (1) la casilla de equipo (`StaffEditor`) llama a `validateFraseEquipo` con el config entero y muestra sus avisos: con team v6 y una
//     persona sin bio mientras las otras la tienen, el aviso de `staff[i].bio` está en la casilla; con todas o ninguna, no hay aviso;
// (2) la casilla de variantes (`LayoutVariantsEditor`) ofrece las v6+ sólo a peluquería (D-194): en peluquería, los botones de faq v6 e
//     instagram v6 (y las otras seis de peluquería); en barbería, ningún botón v6 ni v7 en toda la casilla.
// Sin navegador: los módulos con el cargador de .tsx de `./orden/arreglos-03/_comun.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { importarModulo } from "./orden/arreglos-03/_comun.ts";

type Cfg = Record<string, any>;
const montar = async (modulo: string, componente: string, props: Cfg) => {
  const SERVIDOR = "react-dom/server";
  const { renderToString } = (await import(SERVIDOR)) as { renderToString: (n: unknown) => string };
  const { createElement } = await import("react");
  const C = (await importarModulo(modulo))[componente];
  assert.equal(typeof C, "function", `${modulo} exporta ${componente}`);
  return renderToString(createElement(C as never, props as never));
};

const BIO = "בעלת הסטודיו. ארבע עשרה שנים של צבע.";
const equipo = (staff: Cfg[], variante = "v6"): Cfg => ({ business: { type: "peluqueria" }, sections: { team: { variant: variante } }, staff });
const casillaEquipo = (config: Cfg) => montar("src/components/config-editors/staff-editor.tsx", "StaffEditor", { value: config.staff, onChange: () => {}, clientId: "x", config, setConfig: () => {} });

test("la casilla de equipo muestra el aviso de la bio que falta (CT-2) con team v6 cuando otras personas la tienen, y no lo muestra con todas, con ninguna ni con otra variante", async () => {
  const conAviso = await casillaEquipo(equipo([{ id: "noa", name: "נועה", bio: BIO }, { id: "maya", name: "מאיה", bio: "  " }, { id: "dana", name: "דנה", bio: BIO }]));
  assert.match(conAviso, /<code>staff\[1\]\.bio<\/code>/, "con una bio que falta, la casilla nombra staff[1].bio");
  assert.match(conAviso, /no tiene bio y las otras sí/, "y dice por qué");
  for (const [que, cfg] of [
    ["todas con bio", equipo([{ id: "noa", name: "נועה", bio: BIO }, { id: "maya", name: "מאיה", bio: BIO }])],
    ["ninguna con bio", equipo([{ id: "noa", name: "נועה" }, { id: "maya", name: "מאיה", bio: "" }])],
    ["team v5", equipo([{ id: "noa", name: "נועה", bio: BIO }, { id: "maya", name: "מאיה" }], "v5")],
  ] as const) assert.doesNotMatch(await casillaEquipo(cfg), /<code>staff\[\d+\]\.bio<\/code>/, `${que}: sin aviso en la casilla`);
});

const casillaVariantes = (niche: string) => montar("src/components/config-editors/layout-variants-editor.tsx", "LayoutVariantsEditor", { getNested: () => undefined, updateNested: () => {}, niche });
const botones = (html: string) => [...html.matchAll(/<button\b[^>]*>(v\d)<\/button>/g)].map((m) => m[1]);

test("la casilla de variantes ofrece las v6 y v7 de peluquería —con faq v6 e instagram v6— sólo con niche peluqueria; a barbería, ninguna", async () => {
  const pelu = botones(await casillaVariantes("peluqueria"));
  // CONTACTO-PIE-01 (D-202): con contacto v6 y el pie v6 son diez (antes ocho).
  assert.equal(pelu.filter((v) => v === "v6").length, 10, `peluquería: diez botones v6 (navbar, hero, services, galería, team, reseñas, instagram, faq, contacto y pie) (${pelu.filter((v) => v === "v6").length})`);
  assert.equal(pelu.filter((v) => v === "v7").length, 1, "peluquería: galería v7");
  for (const niche of ["barberia", "estetica", "remodelaciones"]) {
    const otros = botones(await casillaVariantes(niche));
    assert.ok(otros.length > 0 && otros.every((v) => ["v1", "v2", "v3", "v4", "v5"].includes(v)), `${niche}: sólo v1–v5 (${[...new Set(otros)].join(", ")})`);
  }
});
