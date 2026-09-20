// Mutación de tests/higiene-03.test.ts (VERDAD-01). Ojo: el test también exige que tools/_transcript.mjs sea byte a byte el de T;
// la mutación rompe la copia de H, así que pone rojo por dos caminos (clasificación e identidad). veredicto restaura el archivo.
const cambia = (de, a) => (s) => { if (!s.includes(de)) throw new Error(`mutación: no encontré «${de}»`); return s.replace(de, a); };
export default [
  { prueba: "HIGIENE-03 (H): Edit en H o git commit = escribió; git status/cat = sólo lectura; sin transcript = sin-transcript; el clasificador es idéntico al de T",
    archivo: "tools/_transcript.mjs", descripcion: "un shell que muta deja de contar como escritura",
    aplicar: cambia("if (!SHELL_ESCRIBE.test(cmd)) continue;", "continue;") },
];
