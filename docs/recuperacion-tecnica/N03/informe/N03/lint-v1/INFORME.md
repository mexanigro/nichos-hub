# N03 lint-v1 — cierre exclusivamente local

**Checkpoint final: consumo74% / techo TOTAL74% N03 alcanzado; sin resets.** Reparación lint-v1 GREEN; se detiene toda continuación técnica. N03 sigue en curso. Retoma: balance reconciliacion-v1 descontando lint-v1; ninguna nueva reparación ejecutada. No continuar con el techo alcanzado. Las referencias73% siguientes corresponden a checkpoints previos.

RESULT: GREEN. Gates P0/P1/P2/P3: 4/4. Se corrigieron exclusivamente los 13 diagnósticos heredados (1 error, 12 advertencias) de seis archivos hub. N03 permanece en curso. Autorización: orden explícita de Liam de reparar la población preparada en reconciliacion-v1/SIGUIENTE-ACCION.md. Techo compartido TOTAL N03: 74%; observado al inicio y checkpoint de cierre: 73%, sin resets.

## Cambio material y aceptación

| Gate | Cambio verificable | Evidencia |
| --- | --- | --- |
| P0 | Preimágenes verificadas; aceptación/refutación/freeze antes de producto. RED heredado retenido por huellas. | [Contrato](CONTRATO.md), [freeze](FREEZE.md), [huellas](FREEZE.json), FUENTES.json |
| P1 | Seis archivos reparados: lint pasa de 1 error/12 advertencias a cero/cero con configuración N02 idéntica. | [Lint final](resultados/LINT-FINAL.json), LINT-FINAL-ESTADO.json |
| P2 | Tipos aprobados, 65 controles de conservación aprobados; lint detecta any reintroducido sólo en copia. | [Controles](resultados/despues.json), TIPOS-FINAL-ESTADO.json, [mutación](resultados/MUTACION.json) |
| P3 | Revisión independiente integrada, custodia y registros actualizados; alcance conservado. | [Revisión](REVISION-FINAL.md), [conservación](CONSERVACION.json), FUENTES-FINALES.json, REGISTROS-CUSTODIA.json |

Las cuatro rutas sólo cambian la aserción Record<string, unknown> del GET de seguimiento, imports sin uso (NextRequest y parse) y parámetros internos sin uso del callback api-costs. contracts.ts retira PLAN_TABLE y parámetros privados que no intervenían en los textos. pricing.ts usa una sobrecarga para conservar la firma pública boolean→number sin vincular un argumento innecesario. El detalle de Function.length y su evaluación NON-BLOCKING están en la revisión; no se oculta esa diferencia.

Aceptación A1: seis archivos, cero errores y advertencias; configuración sin cambios, SHA256 a24f1a569a468082acb273d8e0e65ebeac9d20a03496e7bc6de9b120ab09e303. A2: tsc --noEmit --incremental false -p tsconfig.json, exit0; hereda opciones del hub e incluye next-env.d.ts y dependencias. A3/A4: 65/65, cero fallos. Son 36 comparaciones de textos/versiones (cinco idiomas y fallback por seis planes), cinco grupos de resultados de precios/constantes/tier/idiomas, diez escenarios GET con oráculo independiente y comparación contra preimagen (20 controles), cuatro comprobaciones TypeChecker de firmas públicas. A5: mutante produce un error @typescript-eslint/no-explicit-any esperado, ningún cambio al producto. A6: nueve comprobaciones de conservación y revisión final sin BLOCKERS/MATERIAL pendientes.

El GET ensayado y sus wrappers withRole/withOwner se extraen del AST real; cubre filtros de status/pending, serialización, campos, autorización 401/403 antes de DB, llamada orderBy y propagación del fallo DB. Dependencias controladas: esto no certifica Firebase/Auth reales ni el ordenamiento remoto. No se inicia un servidor ni se ejecutan proveedores para demostrar una limpieza de tipos/imports. Los controles de contratos/precios comparan resultados contra preimágenes físicas y no cambian textos contractuales ni importes.

## Evidencia conservada y detector de bucles

El RED de reconciliacion-v1 se reutilizó tras verificar huellas. antes.json (61/61) y antes-firmas.json (65/65) permanecen. El primer instrumento tuvo un cierre de objeto incorrecto: preimagen guardada y una corrección concreta produjo progreso. El primer script de edición no halló un ancla CRLF en fuente LF y terminó antes de escribir producto; LINT-DESPUES.json conserva ese estado todavía rojo. La única continuación implementar-r2.cjs corrigió el ancla y produjo las seis modificaciones y LINT-FINAL.json GREEN. No se repitió la estrategia fallida ni se relajó el contrato. Después de P1 hubo progreso material en P2 (tipos/conservación/mutación) y P3 (revisión/custodia/registros).

Las 332 fuentes del template coinciden con el sello final D05-r2. Book-v1, support-v1, stock-v1 y health-v1/SP-H01 conservadas, sin repetir suites ni paridad cuyo código no cambió. No hubo instalaciones, remoto, cobros, notificaciones reales, commit, push, deploy ni resets. No hay soluciones temporales ocultas; el mutante queda exclusivamente en el expediente aislado.

## Continuidad del mismo ID

No queda trabajo en esta reparación. [Balance N03](../reconciliacion-v1/BALANCE.md) sigue vigente salvo su fila de 13 diagnósticos lint, satisfecha por este informe. RE-EXT-02/03, configuración/modos/fail-open/idiomas, deuda documental y warning de middleware no se declaran resueltos ni se abren aquí. El entorno/SDK/reglas corresponde a N04; runtime alojado a N06 y certificación integral a N10. La próxima continuación debe partir de ese balance, descontar lint-v1 y preparar una única acción bajo autorización; no repetir entregas aceptadas.

Antes de cualquier despliegue se mantiene presentar tenants y servicios que deban conservar prestaciones, evidencia y decisión de Liam sobre excepciones. No inferir compromisos de claves ni planes históricos. N03 completa no se cierra.
