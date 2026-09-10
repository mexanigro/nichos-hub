# L02 client-info — GREEN local para revisión

**P0→P3 completados. Sólo se modificó src/app/api/onboarding/client-info/route.ts. L02 no descontada; N03 sigue abierta.** Liam aceptó la preparación y autorizó esta ejecución; no se presume aceptación del resultado. [Orden](ACEPTACION-Y-AUTORIZACION.md), [contrato](CONTRATO.md), [freeze](FREEZE.json).

El endpoint construye mapas explícitos en configUpdate y hubUpdate. Mantiene condiciones/defaults y set con merge; las ramas opcionales se adjuntan sólo con hojas. Arrays/sentinelas conservados. Sin helper genérico, limpieza de claves históricas, cambio de lector ni migración. [Diff](PRODUCTO.diff).

## Evidencia sobre la versión final

| Corrida | Escenarios / invocaciones | Resultado |
|---|---|---|
| P0 basal antes de producto |29 /39 |RED835 diferencias, exit1;1224 auxiliares |
| Handler final |29 /39 |GREEN0 diferencias, exit0;1220 auxiliares |
| Mutante config |29 /39 |RED765;config/lector/historial, ningún fallo hub |
| Mutante hub_clients |29 /39 |RED70;exclusivamente hub_clients |
| Tipos / lint pertinente |route.ts y dependencias de tipos |exit0 /0errores0advertencias |

[Resumen crudo](RESUMEN-CORRIDAS.json), [GREEN](resultados/green/RED.json), [casos y protocolos](resultados/green/CASOS.json), [mutaciones](MUTACIONES.json), [tipos](TIPOS.json), [lint](LINT-RESUMEN.json). El archivo de salida se llama RED.json por continuidad del instrumento; su productAcceptance final es GREEN.

1224 frente a1220 auxiliares refleja ramas de historial: al reparar, el caso sin cambios deja de escribir el registro espurio. Población29/39 y oráculos congelados idénticos en todas las corridas. Las cifras de diferencias incluyen aserciones por hoja/máscara/lector y repeticiones del límite; no son defectos distintos ni documentos reales afectados. No errores del instrumento, ni modificación de expectativas después del freeze.

Probados alta/resubmit con documentos ausentes/existentes, guardias (sin DB writes/emails al rechazar), lookup legacy/fallback, defaults omitidos, parciales email/calle/FAQ, mapas/arrays vacíos, horas explícitamente vacías, imágenes/arrays/hermanos fuera de patch, coexistencia literal/anidado sin limpiar, nicho otro y prioridad del branding. Contador previo3→4 y ausente→1. Historial con paths/summaries/count/truncated, caso sin cambio y110hojas; estados/history/clients y destinatarios/tags de correos modelados conservados. SDK real produce fields/máscaras/transforms; lectura del wizard real comprueba el contenido esperado fijo. Guardias y efecto adicional cero de llamada11 pasan también en ambos mutantes.

Las mutaciones reemplazan cada bloque constructor del handler final por su bloque literal basal exacto, preservando resto del handler. Por eso el rojo está atribuido a config o hub, sin desarmar el instrumento. [Refutación P0](REFUTACION-P0.md), [revisión final independiente](REFUTACION-FINAL.md). Sin BLOCKERS/MATERIAL pendientes para esta entrega local.

## Custodia y límites

Producto revisado SHA256 a89047927517fa676499d93da2ec7780f6b972f90a0c6ca9a0757c5960fcf172; preimagen 64c66a80a4f0de17f66444df5b87b2b98684d61e8d3b8733e30adbb4dbb80132. 284 archivos src fuera del alcance intactos, población src285; root tsconfig y dependencias leídas intactas. 610 artefactos previos de preparación/W-NEXT verificados por hash, más copias archivadas de preparación conservadas. Preimágenes físicas de producto y registros; HEAD no cambió. No se reejecutaron entregas aceptadas.

La prueba ejecuta handler/NextRequest/NextResponse/token/ratelimit/branding/diff/templates/lector reales en Docker sin red y sin credenciales reales. SDK instalado prepara writes sin commit; su aplicación de merge/transforms es modelo local con timestamp fijo. add del historial sólo acredita payload/secuencia modelados, no create/precondición real. No persistencia Firestore, reglas/claims, atomicidad, concurrencia, latencia ni entrega remota certificadas. Sin DB/correos reales, instalaciones, efectos externos, push ni deploy.

Consumo observado83% TOTAL compartido; inicio82%,techo85%,sin resets. N03 abierta; L02 no descontada y no se prepara otra reparación. Resto L02/L01/L12 y etapas N04/N08/N10 intactos. Antes del despliegue siguen vigentes identificación de tenants/prestaciones a conservar, evidencia y decisión de Liam sobre excepciones. Próximo paso exclusivo: revisión de Liam de esta entrega.
