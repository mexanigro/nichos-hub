// CONEXION-08 · C (H) · el material genérico por la puerta del hub (C1) y «lo que el fixture declara = lo que tiene el tenant» (C2,
// inciso n). Sesión A (2026-09-23): tests rojos — `scripts/b4-material.ts` no recorre `brand.logo` ni `brand.logoDark` en sus `RUTAS`
// (C1), y el tenant `test-b4-peluqueria-a` trae el teléfono del preset del nicho (`03-612-4477`), no el genérico, y no tiene logos (C2).
// Caja negra: C1 corre el script por `spawnSync` sobre un fixture y una carpeta `--media` temporales (prefijo «conexion-08-», borrados
// en `finally`) con `--bucket-falso` y las `FIREBASE_*` en blanco, así que NADA sale a la red ni toca Storage (patrón A3 de
// CONEXION-01); C2 usa `b4-tenant.ts show`, que sólo lee. Los dos PNG de prueba son un 1×1 transparente embebido, sin dependencias.
// Sólo en H (inciso n).
// COPIA PROMOVIDA (PRESET-01, 2026-09-23): la carpeta `tests/orden/conexion-08/` queda congelada y esta copia es la editable. Único
// cambio respecto del original (D-89): se queda sólo con C1; C2 lee Firestore y una copia promovida no sale a la red en cada
// `npm test` (lo que el fixture declara = lo que tiene el tenant lo sigue midiendo la orden viva de turno).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  LOGO, LOGO_DARK, MATERIAL, NICHO, SIN_FIREBASE,
  conTemporal, correrLargo, cuenta, fuente, rutaStorage, tokenDe, urlStorage,
} from "./orden/conexion-08/_comun.ts";

/** PNG 1×1 transparente (67 bytes): material de prueba válido para `subirMaterial`, sin dependencias. */
const PNG_1X1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const P = "/dev-fixtures/media/paleta-x/";
/** Las dos rutas que esta orden añade a `RUTAS`, con su rol. */
const NUEVAS: [string, string][] = [["brand.logo", "branding"], ["brand.logoDark", "branding"]];
/** Bloque `const RUTAS … [ … ];` de b4-material.ts, con espacios normalizados. */
function bloqueRutas(src: string): string {
  const i = src.indexOf("const RUTAS");
  assert.ok(i >= 0, `${MATERIAL} declara «const RUTAS»`);
  const j = src.indexOf("];", i);
  assert.ok(j > i, `${MATERIAL}: el array RUTAS se cierra`);
  return src.slice(i, j + 2).replace(/\s+/g, " ");
}

test("scripts/b4-material.ts recorre también `brand.logo` y `brand.logoDark` con rol `branding` (sus `RUTAS`), y con `--bucket-falso` sobre un fixture temporal con `brand.logo: \"/dev-fixtures/media/paleta-x/logo.png\"` sube el archivo a `clients/test-b4-peluqueria-x/media/branding/logo.png` y reescribe la clave por su url", () => {
  // (1) Las dos rutas, en el array que el script recorre. Hoy no están: aquí es donde esta orden está en rojo.
  const rutas = bloqueRutas(fuente(MATERIAL));
  for (const [clave, rol] of NUEVAS) {
    assert.ok(rutas.includes(`["${clave}", "${rol}"]`), `${MATERIAL}: RUTAS debe llevar ["${clave}", "${rol}"]\n${rutas.slice(0, 900)}`);
  }

  conTemporal((tmp) => {
    // (2) Fixture y carpeta --media temporales con los dos logos; nada más de material, para medir sólo lo que esta orden añade.
    const media = join(tmp, "media"), carpeta = join(media, "paleta-x");
    mkdirSync(carpeta, { recursive: true });
    const bytes = new Map<string, Buffer>();
    for (const n of [LOGO, LOGO_DARK]) {
      const b = Buffer.concat([PNG_1X1, Buffer.from(n)]); // contenidos distintos → tokens distintos
      writeFileSync(join(carpeta, n), b);
      bytes.set(n, b);
    }
    const fx = join(tmp, "peluqueria-paleta-x.json"), bucket = join(tmp, "bucket");
    writeFileSync(fx, JSON.stringify({ business: { type: NICHO }, brand: { name: "הדר", logo: P + LOGO, logoDark: P + LOGO_DARK } }, null, 2) + "\n");

    // (3) La corrida: sin red (bucket falso y FIREBASE_* en blanco).
    const r = correrLargo(["--experimental-strip-types", MATERIAL, "--paleta", "x", "--fixture", fx, "--media", media, "--bucket-falso", bucket], { env: SIN_FIREBASE });
    assert.equal(r.status, 0, `${MATERIAL} --paleta x … --bucket-falso … debe salir 0 (salió ${r.status})\n${r.out.slice(-3000)}`);

    // (4) Los archivos, bajo clients/<id>/media/branding/<nombre>, byte a byte.
    for (const n of [LOGO, LOGO_DARK]) {
      const destino = join(bucket, ...rutaStorage("x", "branding", n).split("/"));
      assert.ok(existsSync(destino), `falta ${rutaStorage("x", "branding", n)} en --bucket-falso\n${r.out.slice(-1500)}`);
      assert.ok(readFileSync(destino).equals(bytes.get(n)!), `${rutaStorage("x", "branding", n)} byte a byte`);
    }

    // (5) El fixture reescrito: cada clave por su url exacta (bucket falso, token = sha256 del contenido).
    const texto = readFileSync(fx, "utf8");
    assert.equal(cuenta(texto, "/dev-fixtures/media"), 0, `el fixture ya no referencia /dev-fixtures/media\n${texto}`);
    const f = JSON.parse(texto);
    for (const [clave, n] of [["logo", LOGO], ["logoDark", LOGO_DARK]] as const) {
      const esperada = urlStorage("falso", rutaStorage("x", "branding", n), tokenDe(bytes.get(n)!));
      assert.equal(f.brand[clave], esperada, `brand.${clave} reescrito por su url`);
    }
    assert.equal(f.brand.name, "הדר", "lo demás del fixture queda intacto");
  });
});
