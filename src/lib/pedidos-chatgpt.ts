/**
 * MARCA-01 (M1-5, D-288) · el pedido de ChatGPT de cada hueco de material, armado solo desde la paleta de la clienta.
 *
 * Reemplaza los bloques de color escritos a mano por paleta de `bloque-04/PROMPTS-CONTENIDO.md` (cuyos textos siguen siendo la base
 * de cada hueco). El bloque común sale de `branding.colors` y `branding.mode`: superficies `surface`/`surfaceAlt`, acento
 * `accent`/`accentStrong`, oscuros `scrim`; la luz, del signo de b de `accentStrong` en OKLab; los colores prohibidos, los sectores de
 * tono cuyo rango ENTERO queda a más de 35° de H(`accentStrong`) (D-285 (5): por el rango, no por el centro). La escena es la
 * descripción del salón, escrita una vez por clienta, más su `local.jpg` adjunto en cada conversación (una por foto, R17: una persona
 * distinta en cada foto de servicio y de galería, elegida de una lista fija por su posición). Puro: la misma entrada da el mismo texto.
 * Sin API (inciso y): lo pega una persona en ChatGPT, y lo que vuelve se marca como generado en el registro de la web (inciso aa).
 */
import { hexToOklab, labToLch } from "./oklab.ts";

type Obj = Record<string, any>;
export type HuecoPedido = "servicio" | "galeria" | "retrato" | "local" | "logo";
export type Pedido = { ruta: string; hueco: HuecoPedido; pedido: string };

/** Los sectores de tono con su rango en grados (`DISENO-YULIA.md` § 3.5; olive entre el amarillo y el verde). */
export const SECTORES: [string, number, number][] = [
  ["red", 20, 40], ["orange", 50, 70], ["yellow", 90, 110], ["green", 120, 160], ["sage", 120, 160], ["olive", 100, 130],
  ["teal", 170, 210], ["blue", 220, 270], ["violet", 280, 320], ["magenta", 330, 360],
];
export const LUZ_CALIDA = "warm-neutral, about 4000-4500 K, no blue or green cast";
export const LUZ_FRIA = "cool-neutral, about 6000 K, no orange cast";
const TOLERANCIA = 35;
const difTono = (x: number, y: number) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };

/** Los sectores prohibidos: los que tienen todo su rango a más de 35° de `h`. */
export function sectoresProhibidos(h: number): string[] {
  return SECTORES.filter(([, a, b]) => { let min = 360; for (let x = a; x <= b; x++) min = Math.min(min, difTono(x, h)); return min > TOLERANCIA; }).map(([n]) => n);
}

/** Personas distintas, por posición (R17): la foto n lleva la persona n. */
const PERSONAS = [
  "a woman in her mid-30s, olive skin, oval face",
  "a woman in her mid-20s, fair skin, slim",
  "a woman around 50, light skin, short neck",
  "a woman around 30, tan skin, high cheekbones",
  "a woman in her early 40s, deep brown skin",
  "a woman around 28, light olive skin, long neck",
  "a woman around 30, fair skin, freckles on the shoulders",
  "a woman around 45, light skin, glasses pushed up on her head",
  "a woman in her early 20s, medium brown skin, round face",
  "a woman around 60, fair skin, soft wrinkles",
  "a woman around 35, warm beige skin, long neck",
  "a woman in her late 30s, dark brown skin, oval face",
  "a woman around 25, very fair skin, slim shoulders",
  "a woman around 40, olive skin, strong jawline",
  "a woman around 55, tan skin, short and slim",
  "a woman in her early 30s, light brown skin, freckles",
  "a woman around 27, fair skin, heart-shaped face",
  "a woman around 48, medium skin, broad shoulders",
];
/** Un servicio para chicos (medido en W1: con «a woman» ChatGPT dibujó una mujer y el corte de niños no se reconocía). */
const esDeNinos = (nombre: string) => /\b(kids?|child(ren)?|girls?|boys?)\b/i.test(nombre);
const NINO = "a child around 7 to 9 years old, seated on a booster cushion";
const persona = (n: number) => PERSONAS[n % PERSONAS.length] + (n >= PERSONAS.length ? ` (person ${n + 1} of the set, different from the others)` : "");

const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const lista = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : []);
/** El nombre en inglés de un servicio (capa `translations.en.services`, objeto por id o array con id); si no, el de la raíz. */
function nombreEn(c: Obj, s: Obj): string {
  const capa = c.translations?.en?.services;
  const en = Array.isArray(capa) ? lista(capa).find((x) => x.id === s.id) : obj(capa)[s.id];
  return String(en?.name || s.name || s.id || "service");
}

/** El bloque común de una paleta y un salón (M1-5). */
export function bloqueComun(colores: Obj, modo: string, salon: string): string {
  const hex = (k: string) => String(colores[k] ?? "").toLowerCase();
  const lab = hexToOklab(hex("accentStrong") || "#808080");
  const h = labToLch(lab).H;
  const prohibidos = sectoresProhibidos(h);
  return [
    "COLOR PALETTE (must be respected everywhere in the frame):",
    `- dominant surfaces / backgrounds: ${hex("surface")} and ${hex("surfaceAlt")} (plaster wall, pale stone, light fabric)`,
    `- accent objects (one or two per image, small): ${hex("accent")} / ${hex("accentStrong")} (a chair, a towel, a cape, a counter front)`,
    `- dark values: ${hex("scrim")} (never pure black)`,
    `- light: soft, ${lab[2] > 0 ? LUZ_CALIDA : LUZ_FRIA}`,
    `- key: ${modo === "dark" ? "low-key, dim and intimate, deep shadows" : "high-key, bright and airy, soft shadows"}`,
    `- forbidden colors: ${prohibidos.join(", ")}; no neon, no colored gels`,
    "- overall mood: calm, natural, matte; muted saturation except the accent",
    "SCENE (the attached photo is the salon; every image must look shot in THIS salon, same day, same photographer):",
    `- place: ${salon}`,
    "- treatment: matte, natural colour, slightly muted, fine grain; the same look in every image of the set",
    "- what is in frame: the salon itself softly out of focus behind the subject; never a plain studio backdrop",
  ].join("\n");
}

const PIE = "No text, no logos, no brand names, no mirrors reflecting the camera, no other people.";

/** Un pedido por hueco: cada foto de servicio, cada pieza de la galería, cada persona del equipo, el local y el logo, en ese orden. */
export function pedidosDeMaterial(config: unknown, salon: string): Pedido[] {
  const c = obj(config), colores = obj(c.branding?.colors), modo = String(c.branding?.mode ?? "light");
  const comun = bloqueComun(colores, modo, salon);
  const out: Pedido[] = [];
  let n = 0;
  const servicios = lista(c.services);
  servicios.forEach((s, i) => {
    const nombre = nombreEn(c, s), nino = esDeNinos(nombre), quien = nino ? NINO : persona(n++);
    out.push({ ruta: `sections.services.images.${i}`, hueco: "servicio", pedido: [comun, "",
      "One photograph, 9:16 vertical (1024x1792 or the tallest available).",
      `THE HAIR IS THE SUBJECT and THE SERVICE MUST BE RECOGNISABLE at a glance. ${nino ? "The child" : "A woman"} seen from behind, three-quarter from behind or in profile; the face secondary, never looking at the camera. The stylist's hands may appear (no stylist face). One small accent object in frame.`,
      "COMPOSED FOR A 9:16 CARD: subject in the upper two thirds, calm lower third, nothing important cut by the edges, subject centred horizontally.",
      `THIS PHOTO (service ${i + 1} of ${servicios.length}): ${nombre}.`,
      `PERSON: ${quien}.`,
      PIE].join("\n") });
  });
  lista(c.sections?.gallery?.items).forEach((g, i) => {
    out.push({ ruta: `sections.gallery.items.${i}.src`, hueco: "galeria", pedido: [comun, "",
      "One photograph, 4:5 vertical (1024x1280 or larger), for a portfolio gallery.",
      `THE FINISHED HAIR IS THE SUBJECT: a result of the type «${String(g.type ?? "hair")}», recognisable at a glance. A woman seen from behind, three-quarter or in profile, never looking at the camera.`,
      `THIS PHOTO (gallery piece ${i + 1}, type: ${String(g.type ?? "hair")}).`,
      `PERSON: ${persona(n++)}.`,
      PIE].join("\n") });
  });
  lista(c.staff).forEach((m, i) => {
    out.push({ ruta: `staff.${i}.photoUrl`, hueco: "retrato", pedido: [comun, "",
      "One portrait photograph, 4:5 vertical (1024x1280 or larger), of the stylist at work in this salon, natural and warm, looking near the camera.",
      `THIS PORTRAIT (team member ${i + 1}: ${String(m.name ?? "")}${m.specialty ? `, ${String(m.specialty)}` : ""}). Only if the real photo is missing; never invent who she is.`,
      PIE].join("\n") });
  });
  out.push({ ruta: "branding.localPhoto", hueco: "local", pedido: [comun, "",
    "One photograph, 16:9 horizontal (1920x1080 or larger), of the empty salon interior: the same place as the attached photo, wide, calm, no people. Only if the real photo is missing.",
    "No text, no logos, no brand names."].join("\n") });
  out.push({ ruta: "brand.logo", hueco: "logo", pedido: [comun, "",
    `A wordmark logo of the salon name, flat, on a transparent background, in ${String(colores.accentStrong ?? "").toLowerCase()} (and a second version in ${String(colores.surface ?? "").toLowerCase()} for dark backgrounds), in the spirit of the salon in the attached photo. Only if the salon has no logo.`,
    "No mockup, no shadows, no other text."].join("\n") });
  return out;
}

/** El archivo de pedidos para Liam: uno por hueco, cada uno en su bloque. */
export function pedidosEnMarkdown(clientId: string, pedidos: Pedido[]): string {
  return [`# Pedidos de ChatGPT · ${clientId}`, "", "Una conversación nueva por foto, con `local.jpg` de la clienta adjunto. Lo que vuelve se marca **generado** en el registro de la web (inciso aa).", "",
    ...pedidos.flatMap((p) => [`## ${p.ruta} (${p.hueco})`, "```text", p.pedido, "```", ""])].join("\n");
}
