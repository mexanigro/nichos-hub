// Mutación de tests/contrato-hooks.test.ts (VERDAD-01, H): quitar el hook veredicto --stop de .claude/settings.json debe poner rojo
// el guard (CLAUDE.md sigue declarando `cierre.mjs veredicto.mjs`). veredicto restaura el archivo byte a byte.
const cambia = (de, a) => (s) => { if (!s.includes(de)) throw new Error(`mutación: no encontré «${de}»`); return s.replace(de, a); };
export default [
  { prueba: "CLAUDE.md declara exactamente los hooks presentes en .claude/settings.json, .githooks/ y npm prepare",
    archivo: ".claude/settings.json", descripcion: "Stop pierde veredicto --stop",
    aplicar: cambia(',\n        { "type": "command", "command": "node tools/verdad/veredicto.mjs --stop", "timeout": 30 }', "") },
];
