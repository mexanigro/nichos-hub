# L01 — reparación local para revisión

**GREEN local, P0→P3 4/4. L01 NO descontada; N03 abierta.** Liam aceptó la preparación y aprobó precedencia nested válida con fallback top válido, y autoridad del modo remoto admitido únicamente sobre showAbout/showTeam. Autorizó reparar exclusivamente los dos consumidores; no se modificó otro producto.

Hub `src/lib/wizard/config-to-wizard.ts` ahora acepta businessMode válido cuando business.mode no es exactamente solo/team. Template `src/config/site.ts` resuelve el modo del override admitido: solo → true/false, team → false/true; aplica después las restricciones del nicho. Reutiliza ese override al cambiar idioma. Sin modo remoto válido conserva la rama legacy existente; no toma el modo del preset como una orden nueva para pisar flags. Los campos crudos business.mode/businessMode no se normalizan ni se escriben.

Versiones revisadas: hub `0934399c91252c5b63af26ebba105ccdcc47f46336f8f40265d48975e0d205aa`; template `a85f4938b2172286d6b954b059bd26bd17b686f3717ab3346a9a3fa7a9008cda`. Preimágenes físicas y [diff hub](DIFF-hub.txt)/[diff template](DIFF-template.txt) conservados.

| Gate | Evidencia y resultado |
| --- | --- |
| P0 | [Contrato](CONTRATO.md) y [freeze](FREEZE.json) antes de editar. [RED fijo](resultados/red-fijo/RESULTADO.json): 73 casos, 1.752 comprobaciones, 297 fallos semánticos. Sin fallos de conservación ni borradores. Refutación independiente sin bloqueos. |
| P1 | Dos cambios acotados, [huellas](P1.json). Escritores, SAFE, prioridad de borrador, estados, permisos, defaults y demás features intactos. |
| P2 | [GREEN](resultados/green/RESULTADO.json): 73 casos, 1.752 comprobaciones, cero fallos. Mutantes independientes hub/site/idioma: 15/282/138 fallos atribuibles, todos exit1. |
| P3 | Tipos en ambos repositorios exit0; lint hub cero errores/advertencias. El script lint del template es tsc: chequeo pertinente ejecutado sobre site y sus dependencias. Revisión y [conservación](CONSERVACION.json) PASS. |

Población fija: 25 pares de representación; 14 casos de siete nichos × dos modos con flags contrarios; 21 casos sin modo válido (ausencia/null/inválido) en esos nichos; 6 SAFE con tipo ausente/incompatible y top ausente/solo/team; 6 altas por los tres escritores y dos modos; una reedición solo→team. Cada caso compara lector, hidratación con borradores fijos solo/team, rama SSR StepOwner, flags, campos ajenos completos, paso/asignación inicial de BookingWizard y tres cambios de idioma (he/ru/ar). Se parte de en. Employment conserva su excepción showTeam=false después del par de modo.

El RED previo r1 tenía 300 fallos. Antes del freeze se sustituyó la entrada de borrador dependiente del lector por dos valores fijos solo/team: se guardaron preimágenes del instrumento y se repitió sólo P0. El RED congelado r2 tiene 297 fallos. No hubo cambios del oracle tras implementar, ni ajustes para hacer pasar la reparación. La conservación compara con preimágenes inmutables; la precedencia y los pares de flags provienen de las reglas aprobadas, no del código reparado.

Sensibilidad: [hub](resultados/mutante-hub/RESULTADO.json) restaura sólo la versión previa del lector y falla en lectura/hidratación/owner; [site](resultados/mutante-site/RESULTADO.json) restaura el consumidor previo y falla en flags/recorrido/idiomas; [idioma](resultados/mutante-idioma/RESULTADO.json) mantiene la reparación y retira sólo el argumento del override al cambiar idioma, fallando exclusivamente en he/ru/ar. Los mutantes viven en copias del instrumento; nunca se aplicaron al producto. Ninguno falla por importación ni rompe los controles de campos ajenos o borradores.

Conservación: 623 archivos de producto controlados entre ambos repositorios (src y entradas/configuración raíz pertinentes), 621 byteidénticos y sólo los dos autorizados diferentes; sin altas/bajas en src. Dependencias, tsconfig, writers y fuentes de entregas aceptadas no cambiaron. Las 88 evidencias del manifiesto de preparación L01 permanecen idénticas. El estado Git se conservó con trabajo ajeno, sin limpieza, commit, push ni deploy. No se repitieron suites aceptadas de L02/D05/L05/L03.

Revisión independiente interna Newton: sin BLOCKERS ni MATERIAL pendientes para entrega local. Lectura de diff, resolución desde override admitido, orden nicho posterior, resultados y causas de mutantes coinciden con el contrato. No sustituye la aceptación de Liam ni representa una revisión externa nueva. No hay solución temporal oculta, helper genérico ni ampliación del alcance.

Límites heredados: SDK instalado sin commit, documentos sintéticos y dependencias externas interceptadas. Bootstrap/site/presets actuales, hydrate y ramas AST reales, SSR de pasos con proveedores visuales sintéticos; no navegador completo ni autenticación, DB, disponibilidad, entrega o despliegue reales. SAFE no incorpora business cuando lo descarta por tipo: allí no se promete una convergencia universal que L12/N08 todavía deben adjudicar. Se conserva el estado pending_review del escritor; la lectura active usada por el arnés es sintética y no autoriza publicar.

Presupuesto: inicio85%, observado86% TOTAL, techo90% compartido N03; último10% reservado a N04, sin resets. N03, etapas posteriores y condición de prestaciones por tenant antes del despliegue permanecen vigentes. Sin migraciones, instalaciones, efectos externos, push ni deploy. Próximo paso: revisión de esta implementación, sin descontar L01 ni abrir otra reparación.
