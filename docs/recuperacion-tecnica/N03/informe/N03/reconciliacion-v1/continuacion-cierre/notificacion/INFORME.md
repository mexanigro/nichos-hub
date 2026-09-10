# E-NOT-01: CTA de mensaje fiel a su destino

RESULT: GREEN local, para revisión; sin descuento D13 global.
TASK: evitar que liamMessage prometa responder en portal cuando usa SITE.
GATES: 4/4 (P0 contrato/RED, P1 refutación/freeze, P2 reparación/GREEN, P3 sensibilidad/tipos/lint/custodia).
TESTS: 12 casos/90 comprobaciones GREEN, mutante RED40; tipos final0; lint0 errores/0 advertencias.
BLOCKERS: ninguno de este alcance.
CHANGES: dos expresiones de texto condicional en src/lib/email-templates.ts.
REMAINING: revisión/integración por root; demás D13 y entrega real no certificados.

## Efecto y conservación

POST /api/messages llama liamMessage con name/body sin portalUrl. Se conserva ese caller entero por hash. Antes, SITE recibía un CTA que prometía responder en portal. Ahora, portalUrl ausente o vacío produce «Podés visitar Arzac Studio:» y «Visitar Arzac Studio →». Portal explícito conserva exactamente texto y enlace anteriores. La condición truthy es la misma que determina cta, sin nueva validación, trim o destino.

Preimagen física previa a producto y hashes en PREIMAGENES.json. Contrato y control congelados antes del cambio en FREEZE.json. Basal RED12 casos/90 controles/40 fallos, exit1. Cambio mínimo de dos expresiones, luego GREEN12/90/0, exit0. Mutante sólo en memoria restaura función basal, RED40 exit1; no confundir con error de instrumento. Todos los escenarios conservan subject, saludo, body, escape HTML, saltos, firma y destinos; salida íntegra comparada con preimagen ajustando sólo frases contratadas. Bytes fuera de liamMessage y caller idénticos. No se tocó sender, transporte, auth, guardias, persistencia ni estado.

## Comprobaciones y límites

Plantilla real transpilada con TypeScript instalado, process sintético con SITE definido/ausente. 3 portalUrl (ausente/vacío/explícito) ×2 SITE ×2 cuerpos (simple/caracteres HTML y salto). No se importa ni ejecuta transporte/caller, no se carga .env, no hay red/credenciales/envío. Portal explícito se conserva, no se certifica su existencia operacional ni aterrizaje.

Tipos r1 detectó process sin declaración por omitir next-env.d.ts en el include del arnés. Se conservan TIPOS.log/TIPOS-LINT.json/tsconfig.json originales; r2 añade sólo next-env.d.ts existente, manteniendo extends y opciones originales, incrementalfalse. TIPOS-r2-exit.txt=0; TIPOS-LINT-FINAL.json consigna el resultado. LINT.json usa configuraciones Next core-web-vitals/typescript instaladas, sin supresiones,0/0. No hubo modificación de producto para resolver instrumento.

CUSTODIA-FINAL.json contiene hashes finales de plantilla, caller, contrato y test. Esta reparación resuelve exclusivamente la garantía visible falsa del fallback de este mensaje; no construye portal ni cierra soporte completo, proveedores, digest, recordatorios o D13. BALANCE no editado por este agente.
