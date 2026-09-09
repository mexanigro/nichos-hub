# N03 L06-language-v1 — GREEN local para revisión

Sólo src/app/api/onboarding/route.ts del hub: añadido language:locale al objeto de config/{slug}, manteniendo el valor ya guardado en hub_clients y los normalizadores existentes. El consumidor ahora prepara el idioma elegido en lugar de he por omisión. Sin idioma, el defaultinglés del onboarding llega al consumidor; es se conserva y mantiene fallbackinglés del template. No migración de clientes existentes ni cambio de traducciones/defaults/permisos.

[Contrato aprobado](PROPUESTA.md) y [freeze previo a producto](FREEZE.json). P0→P1→P2→P3:4/4. GREEN exclusivamente local de esta conexión L06; N03 sigue abierta, no H01/ES-A completo. Entregada para revisión, no se atribuye aceptación final a Liam.

## Evidencia

- [Aceptación](green-p2/ACEPTACION.json):34/34 sobre14escenarios del POST real y deployToVercel real con dependencias simuladas.10idiomas/ausencias/normalizaciones con config igual al hub y payload correcto; conservación de todas las demás escrituras/respuestas/disparos completos contra referencia-r2. Cuatro adversos conservados:429/403/400/500, cero disparos posteriores. config.set fallido conserva las dos escrituras previas, sin inventar rollback.
- [Tipos](TIPOS-P2.json):exit0 con configuración del hub y next-env.d.ts, sin relajar opciones. [Lint](LINT-P2.json):exit0,cero errores/advertencias/supresiones, configuración diagnóstica N02 vigente, sólo archivo afectado.
- [Mutación](MUTACION.json), [aceptación mutante](mutation-p3/ACEPTACION.json): retirada exclusivamente language:locale en copia física;17fallos funcionales esperados (10faltas en config y7idiomas propagados incorrectos),17controles conservados. [Estado](MUTACION-ESTADO-P3.json):instrumentoexit0,contratoexit1. Copia coincide exactamente con preimagen; producto permanece reparado.
- [Conservación](CONSERVACION-FINAL.json):4fuentes hub pertinentes restantes,333template y6fuentes lint aceptadas intactas;5fuentes probadas coinciden con actual. Contrato/instrumentos/referencias congelados sin deriva. [Manifiesto final](FUENTES-FINALES.json). Ambos repos siguen main y un único worktree cada uno.

Se reutilizaron sondeo y referencias originales; única adaptación del sondeo permite leer la copia mutada usando las mismas dependencias, con preimagen. Acceptance compara contra la referencia anterior al parche y sólo permite las dos diferencias derivadas de la propiedad. RED previo conservado, no reejecución general ni suites template aceptadas. No errores del instrumento ni reintentos en esta implementación.

## Gates, revisión y límites

P0:huellas vigentes,autorización/revisión externa integradas,RED17 comprobado sobre referencia yfreeze. P1:preimagen física e inserción única. P2:propagación/conservación34,tipos/lint aprobados. P3:mutación sensible,claridad yconservación final,registros actualizados. Cada gate produjo avance material verificable.

[Revisión interna](REVISION-FINAL.md) separada de [revisión externa trasladada por Liam](REVISION-EXTERNA-PREPARACION.md). MATERIAL previo de captura del disparo ylocalización de persistencia resuelto antes del freeze. Ningún BLOCKER restante de esta entrega.

VM con imports de producto controlados, fetch/env sintéticos; no red real,IA,logos ni escrituras reales a Firestore. No monta Next/navegador ni certifica endpoint deploy/auth,proveedores,reglas,persistencia o aislamiento de SO. La llamada intermedia se conecta directamente al consumidor local; no se afirma un deployment real.

N04 conserva identidad/entorno reales,N08 propagación/publicación reales,N10 idiomas completos. H01/ES-A y otras obligaciones del balance no se cierran por esta propiedad. Condición previa al despliegue por prestaciones de tenant,evidencia ydecisión de Liam intacta. Sin instalaciones,operaciones remotas,ramas/worktrees,commit,push/deploy o resets.

Consumo observado78%,techo80%TOTAL N03 compartido. No retoma técnica pendiente de esta reparación; detener para revisión, sin iniciar otra obligación.
