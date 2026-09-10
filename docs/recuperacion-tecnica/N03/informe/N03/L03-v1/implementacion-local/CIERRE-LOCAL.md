# L03 — implementación local para revisión

**RESULT: GREEN local, P0–P3: 4/4. L03 NO descontada; N03 abierta.** Liam aceptó la preparación L03 y autorizó únicamente retirar los tres interruptores y añadir la explicación en `src/components/client-config-tab.tsx`. Esta acta registra la aceptación de la preparación, no una aceptación anticipada de la implementación.

Se sustituyeron los tres nodos ToggleField por el texto aprobado: «Sin agente, los avisos base de contacto y reservas usan email. Con agente, usan los canales configurados.» Admin Email y los demás campos permanecen. La política D05 sigue vigente: con agente deshabilitado, los cinco avisos base por email se mantienen aunque esos flags estén apagados. No se añade comportamiento para conservar los controles.

El [diff](CAMBIO.diff) contiene sólo ese reemplazo. La preimagen tiene SHA-256 `554a215376a026148100442da459a2b4cf3b57ab7a3167ecc1deed1b71a27c57`; el componente final probado, `50617ec18ff67ebe93f9b100e5e7926f3a44e749c55f61ba2c65b38266e9a8f8`. HEAD base: `2e751a92536666c325ed6eca6b731f4180a646ea`. No se creó commit, rama ni worktree.

| Gate | Cambio verificable y evidencia |
| --- | --- |
| P0 | [Contrato fijo](CONTRATO.md), preimagen y [freeze](FREEZE.json) antes de tocar producto. RED previo: 29 renders/29 guardados, 140 diferencias esperadas por nota ausente y controles presentes. [Resultado](resultados/red-congelar/RESULTADO.json). Refutación sin bloqueos; se fijó también que el contenido no aparezca con sección cerrada. |
| P1 | Tres controles reemplazados por la nota. Prefijo y sufijo byteidénticos: datos, defaults, tipos, carga, guardado y demás campos sin cambios. [Constancia](P1.json). |
| P2 | ReactDOMServer renderiza JSX y subcomponentes reales: 29/29. Handler real de guardado conserva 29/29 payloads. [GREEN](resultados/green/RESULTADO.json). Mutante aislado restaura los controles y conserva la nota: 112 fallos exclusivamente de controles/botones; 29 guardados siguen iguales. [RED sensible](resultados/mutante/RESULTADO.json). |
| P3 | Tipos exit 0. Lint ejecutado y atribuido contra preimagen: 2 errores y 2 advertencias previos, exactamente los mismos, cero nuevos. Revisión independiente, [conservación](CONSERVACION.json), custodia y registros vigentes. |

Los 29 casos comprenden 27 combinaciones de true/false/ausencia de los tres flags, un mapa notifications ausente con adminEmail vacío y una sección cerrada. Los payloads incluyen canales, campos hermanos desconocidos, arrays y campos fuera de notifications. La única exclusión del payload es `_customServicesBackup`, comportamiento ya existente. Las expectativas provienen de la política y del contrato previo; no fueron ajustadas a la reparación. Cada corrida conserva HTML, salida y código de salida. Docker usó imagen/dependencias existentes, `--network=none`, sin entorno de credenciales ni DB real.

**Lint global del componente sigue RED por deuda previa; no se presenta como limpio.** Los dos errores son `react-hooks/set-state-in-effect` (433) y `react-hooks/refs` (1852); advertencias `no-unused-vars` (2031) y `no-img-element` (2061). Están fuera de las líneas 1138–1140 modificadas. [Comparación exacta](LINT-COMPARATIVO.json), [basal](LINT-BASAL.json), [final](LINT.json), [tipos](TIPOS.json). No se silenciaron reglas ni se repararon esos puntos. Es un hallazgo NON-BLOCKING para este contrato local, que exige verificar lint pertinente y conservar el resto del componente.

Revisión desde cumplimiento, consumidor e instrumento: tres controles retirados, nota fiel a los cinco avisos incluidos, guardado conservado y mutante detectado por la causa correcta. [Refutación independiente](REVISION.md): sin BLOCKERS ni MATERIAL pendientes. La lectura del diff y los bytes fuera del reemplazo comprueba que el helper ToggleField sigue disponible para los otros controles. No hay solución temporal oculta ni ampliación del alcance.

[Conservación](CONSERVACION.json): población completa de 285 archivos src, sólo cambia el componente autorizado; 284 idénticos, sin altas/bajas. Fuentes vigentes de template/D05: 9/9 idénticas. Evidencia de preparación conservada: 31/31. Método vivo r2 verificado con su huella previa. El registro de estado Git conserva los cambios ajenos y las entregas aceptadas W-NEXT/L02; no se repitieron sus suites.

Límites: SSR aislado de la sección real y handler de guardado con PUT interceptado; no prueba navegador, hidratación, flujo completo de interacción, persistencia Firestore ni entrega de email/WhatsApp. La evidencia D05 aceptada se reutiliza por vigencia de fuentes, sin recertificar backend. El texto describe selección de canal, no garantiza entrega.

Liam actualizó el techo a **90% TOTAL compartido de N03**, sin resets; el último **10% queda reservado para N04**. Consumo TOTAL observado al comenzar y antes del cierre: **84%**, ventana de 10080 minutos. El techo previo de 85% queda histórico. Etapas posteriores y condición de comprobar prestaciones por tenant antes del despliegue permanecen vigentes. Sin instalaciones, efectos externos, push ni deploy.

Próximo paso único: revisión de esta implementación. No se descuenta L03, no se prepara otra reparación y N03 no se declara terminada. Los registros vigentes y el archivo del hub enlazan esta acta; preimágenes, fuentes, corridas, mutante y resultados quedan en el mismo expediente.
