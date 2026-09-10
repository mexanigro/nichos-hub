# Acta de revisión local — integración final N03

Fecha: 2026-09-10. Revisor independiente: subagente `refutacion_wnext`. Alcance: integración reciente de agenda, autorización, estado tenant y cobro; sin modificaciones de producto ni nuevas familias. Esta acta no constituye aceptación de Liam ni cierre global de N03.

**Veredicto: RED global.** La integración local recuperó las garantías enumeradas abajo. Permanece el bloqueo conocido de precio autorizado de la cita creada por `/api/book`; Liam decidió mantener pendiente su autoridad. No se alteró el handler de reserva ni se agregó precio artificial al recorrido final.

## Evidencia ejecutada y sensibilidad

| Ejecución | Casos | Controles | Fallos | Resultado e interpretación |
|---|---:|---:|---:|---|
| `resultados/consumidores-green/CONSUMIDORES.json` | 8 | 67 | 0 | GREEN acotado: callbacks reales de status/webhook resuelven el error de estado con respuesta 503 redactada; comportamiento compatible preservado. |
| `resultados/parcial-final/PIPELINE.json` | 48 | 264 | 16 | RED: cuatro recorridos de reserva (dos runtimes × destinos iguales/separados), cada uno con checkout 400 y sin importe/moneda/credenciales de gateway esperados. Todos derivan de la cita sin precio. |
| `resultados/mutante-bypass-final/PIPELINE.json` | 48 | 264 | 40 | Mantiene los 16 fallos basales y agrega 24: al omitir el guard, seis estados adversos permiten HTTP 200 y lectura de citas en ambos runtimes. |
| `resultados/mutante-reject-final/PIPELINE.json` | 48 | 232 | 52 | Los 52 fallos son nuevos respecto del basal. Rechaza también accesos válidos; los 16 controles de precio dejan de alcanzarse al fallar la reserva antes. No son 36 fallos adicionales calculados por resta. |

Mutaciones exclusivamente en memoria, conservando los oráculos. El log `PayloadTooLargeError` corresponde al caso adverso de cuerpo superior al límite, no a un fallo de montaje. Las corridas RED terminaron con exit 1 por sus comprobaciones; consumidores con exit 0.

`REVISION-RESULTADOS.json` conserva las diferencias por identificador y las huellas. Verificados 4/4 archivos congelados sin drift (pipeline, contrato, runner y consumidores); 10/10 fuentes actuales coinciden con las huellas del resultado final. Los dos mutantes observaron las mismas huellas de producto que la corrida basal final.

## Garantías locales acreditadas

- Los seis middlewares aplicables se extraen y registran en el orden real de ambos runtimes, antes de las rutas reales de reserva, lista CRM, actualización y checkout. Se ejercitan Express HTTP, referencias y consultas SDK reales, firma RSA y gate/lookup de autorización reales; transportes externos y almacenamiento están interceptados.
- Con proyectos/base separados, la reserva se crea en el backend, la lista devuelve esa misma identidad y la actualización afecta esa misma cita. El antiguo rechazo global por seleccionar estado tenant desde el destino navegador deja de impedir este recorrido.
- Suspensión y archivo bloquean; estado ausente, inválido, error y timeout rechazan antes de leer citas. Los controles de origen, autenticación, tenant del miembro, límite de cuerpo y rate limit mantienen los resultados esperados de esta población.
- Estado, configuración y credenciales de esta API usan el backend de citas. Proveedor explícito manual/none no inicia cobro; inválido/null/vacío rechaza; sólo ausencia habilita selección legacy. Error de configuración o lectura de credenciales no habilita el gateway.
- Las citas preexistentes con precio sintético autorizado constituyen una población separada: prueban importe/seña/moneda y destino de credenciales. No reparan ni certifican el precio de citas creadas por book.
- Los consumidores afectados por la propagación de errores de estado ahora responden 503 sin rechazar una promesa fuera del manejo de Express 4. El status local del servidor, que no consultaba ese getter, conserva su comportamiento.

## Revisión de conservación y límites

La revisión de código reciente mantiene identidad/origen de cada cita, historia navegador separada y acciones dirigidas a su origen. La autorización de agenda confía en el issuer navegador explícito configurado en servidor y en membresía backend del tenant/rol; no concede membresías automáticamente. Los controles previos de auth, lookups, registro, agenda, credenciales y política de cobro se reutilizan, sin repetir sus suites ni extender sus conclusiones a un navegador completo.

Los loaders conservan la precedencia aprobada: mapa nested presente es autoritativo y no se mezcla con legacy; sólo ausencia admite plano. `apiName` permanece independiente de `apiKey`. El cobro conserva la validación de precio de la cita, modo/seña y moneda configurados; Cardcom sigue bloqueado antes de resolver gateway por su política monetaria no acreditada. No se afirma cobro real ni resolución global de COB-A.

**BLOCKER conocido:** no existe aún una autoridad aprobada y conectada que aporte el precio a la cita creada por book; checkout devuelve 400. El mensaje que invita a fijarlo en CRM no acredita por sí mismo una acción funcional de fijación. Mantener RED y decisión pendiente; no modificar contrato para ocultarlo.

**MATERIAL / límites:** almacenamiento/transacciones, certificados, REST y proveedor están interceptados; no se probaron arranque completo, Firebase remoto/rules, concurrencia, webhook/proveedor real o render React completo. Estas limitaciones impiden convertir la evidencia local en certificación operativa. La integración no certifica efectos externos de notificación ni resuelve otras familias del balance.

No se identificó otro BLOCKER en el alcance revisado. Tipos, conservación global de archivos y balance quedan en el expediente del integrador; esta acta no sustituye esas verificaciones ni descuenta filas por iniciativa del revisor.

## Cierre de esta revisión

RESULT: RED  
TASK: revisar y medir la integración local final sin ocultar el bloqueo de precio  
GATES: controles de consumidores y pipeline/mutaciones ejecutados; cierre global pendiente  
TESTS: consumidores 67/67; pipeline 248/264; sensibilidad positiva y adversa acreditada con las diferencias anteriores  
BLOCKERS: autoridad y conexión del precio de la cita creada por book  
CHANGES: sólo acta y diferencias/huellas de resultados; ninguna edición de producto por el revisor  
REMAINING: precio pendiente y obligaciones vigentes del balance global
