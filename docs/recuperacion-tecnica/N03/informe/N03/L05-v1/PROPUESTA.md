# N03 L05 — contrato de acceso preparado, no implementado

Orden vigente: preparar exclusivamente getClientRuntimeState/enforceClientActive y consumidores pertinentes de ambos runtimes. No reconciliación general. Lint-v1 aceptada por Liam; book/support/stock/health-SP-H01/D05 conservadas. Techo77% TOTAL N03, sin resets; inicio y checkpoint74%. El producto permanece sin cambios. No freeze del nuevo contrato hasta decisión pendiente.

## Defecto reproducido y alcance de la medición

[SONDEO.json](SONDEO.json):43 observaciones (33 escenarios individuales,4 secuencias de caché,6 caracterizaciones de proveedor),25 divergencias frente al rechazo503 propuesto. Se ejecutan funciones reales extraídas por AST de server.ts y api/index.ts: getClientRuntimeState, enforceClientActive y callback real /api/tenant/status, con Admin/REST/token/reloj/respuesta simulados dentro de VM. No se importan módulos de producto ni se cargan .env o credenciales reales; fetch es un stub de lista cerrada, no hay require/red en la VM. Contadores de lectura guardados; cero intentos fuera del stub. Esto demuestra el comportamiento de la cadena extraída, NO arranque completo de runtimes, HTTP real, Auth real ni Firestore. El montaje app.use y orden de excepciones se verificaron estáticamente, no se presentan como middleware efectivo certificado.

server.ts retorna active/stripe si no hay Admin o falla una lectura; documento/status ausente también active y se cachea. No valida estados desconocidos: el guard deja pasar cualquier valor distinto de suspended/archived; el endpoint puede decir active:false pese a haber permitido el recorrido. api/index.ts retorna active con fallback de proveedor ante falta de proyecto/token,404,403/500,error o JSON inválido; status desconocido/ausente se transforma en active. Ambos permiten de nuevo tras vencer una caché suspended si la lectura falla. Son defectos de acceso, no decisiones comerciales aprobadas.

[PENDIENTE.json](PENDIENTE.json):dos observaciones adicionales de lectura simulada que nunca resuelve, sin respuesta durante75ms; código inspeccionado sin deadline propio. No se infiere una duración infinita medida ni se usa75ms como SLO. Esta medición cubre el riesgo señalado por el revisor sin repetir el sondeo inicial.

## Contrato documentado y consumidores

N01 [DEUDA L05](../../N01/SA-01-L-v1/DEUDA.md) y [MATRIZ tenant lifecycle](../../N01/SA-01-L-v1/MATRIZ.md) reconocen active/trial/maintenance permitidos, suspended/archived bloqueados, ausencia/error como fail-open defectuoso. No aprueban defaults activos por fallo de DB ni definen tolerancia temporal.

enforceClientActive se monta bajo /api en server.ts:1476 y api/index.ts:2714, después de origen/límite/contexto. /api/tenant/status y los recorridos funcionales posteriores (contacto/reserva/CRM/checkout) lo atraviesan. No se encontró consumidor de /api/tenant/status en src; su respuesta sigue siendo contrato público y no se elimina. server expone status/active; API también clientId/paymentProvider: conservar forma existente de casos válidos, sin ampliar exposición ni unificar respuestas por preferencia.

Pagos: getClientRuntimeState alimenta webhook y checkout en ambos runtimes. Webhook está antes del guard; API daily-digest también. No trasladarlos detrás ni alterar sus validaciones/autorización. /api/live y /api/health continúan antes del bootstrap/guard con contrato health-SP-H01; no inferir readiness de la caché de acceso. Límites, autenticación, origen y aislamiento existentes permanecen.

Browser: main.tsx llama bootstrapTenantConfig de services/tenant.ts y sólo muestra suspensión para suspended/archived. Lee Firestore directamente y no usa /api/tenant/status. Su fail-open ya está en deuda L05; esta preparación está acotada al guard servidor solicitado, no cambia UI, bootstrap browser ni SDK/rules. Reparar servidor no demuestra que todos los accesos directos browser estén cerrados; N03 conserva esa deuda, N04 certifica rules/aislamiento.

## Tabla propuesta

| Condición de acceso | Decisión | Respuesta observable |
|---|---|---|
| Lectura comprobada con status exacto active, trial o maintenance | Permitir | next una vez; resultado funcional original; tenant/status200 con forma actual y active:true |
| Lectura comprobada suspended o archived | Bloquear |423 y mensaje existente Tenant is <status>. Service is blocked.; cero ejecución posterior |
| Documento ausente, status ausente/null/vacío/desconocido/tipo incorrecto | Bloquear |503 {error:"Tenant state unavailable."}; no next ni resultado funcional; no sintetizar active |
| Configuración necesaria/token ausente; carga/lectura/HTTP/JSON fallido | Bloquear | Mismo503 genérico; no datos internos, credenciales ni causa sensible en respuesta |
| Lectura pendiente más de1500ms | Bloquear esa petición |503 genérico; resultado tardío no autoriza ni renueva caché; pendientes compartidos hasta asentarse para no multiplicar lecturas |
| Caché de estado comprobado con edad menor de30000ms desde inicio de lectura | Aplicar ese estado | Permitir o423 como arriba, sin releer; no caché de default/error |
| Edad igual o mayor de30000ms | Exigir nueva lectura | Aplicar resultado comprobado o503; nunca servir permiso vencido ante error |
| Estado comprobado válido y fallo del config opcional de proveedor | Según status | Acceso independiente; resolución de proveedor conserva su mecanismo/fallback actual |
| Webhook, daily-digest API y señales de salud anteriores al guard | Conservar excepción actual | Sus contratos/autorizaciones originales; ninguna nueva excepción, bypass visitante o movimiento de middleware |

Valores de status exactos: sin trim/case-normalization ni convertir otros estados en suspensión comercial. Documento ausente/inválido significa imposibilidad técnica de verificar, por eso503, no423.

## Única decisión pendiente

Aprobar la política temporal propuesta: conservar hasta30s un estado comprobado, plazo máximo1500ms para verificarlo, nunca permiso vencido ante error y nunca habilitación por respuesta tardía. Los30s son el TTL efectivo actual;1500ms tiene precedente en health-v1, pero ninguno constituye una decisión ya aprobada para este guard. No se inventa una prestación por plan ni se revisan tenants reales.

Recomendación: aprobar esta política. Consecuencias concretas: una suspensión posterior a una lectura válida puede tardar como máximo el resto de esa ventana en aplicarse; al vencerla, una DB lenta/caída devuelve503 aunque el tenant fuera activo. Una operación SDK no cancelable puede seguir pendiente después de responder503, compartida y sin autorizar; no afirmar que el deadline cancela Firestore. No modificar health para reutilizar su caché ni copiar políticas de selección.

## Cambio mínimo preparado

1. Nuevo src/lib/api/tenant-access.ts: resultado discriminado de acceso verificado/no disponible, validación de los cinco estados, cache propia por instancia/tenant, deadline y decisión de middleware. Sin proveedor ni conocimiento de precios. Sólo tras aprobación/freeze.
2. server.ts: adaptador de lectura clients.status con getAdminDb y CLIENT_ID actuales; conectar enforceClientActive y status público al nuevo resultado. api/index.ts: adaptador REST con exactamente proyecto/base/CLIENT_ID/token actuales. No unificar selectores Admin/REST ni intervenir token/provisioning.
3. Mantener getClientRuntimeState y cache legacy de pagos sin modificación de lógica, excepciones o prioridades. Dejar de usar su status como permiso. Webhook/checkout conservan proveedor; API status conserva paymentProvider consultando su mecanismo actual sólo después de acceso permitido. Las diferencias observadas ante provider inválido (server stripe, API fallback env) se preservan, no se arreglan aquí. Habrá lectura de acceso independiente de las lecturas legacy de pagos: medir contadores, no ocultar el coste local ni compartir un default inseguro.

Archivos de producto previstos: sólo los dos runtimes y ese módulo nuevo. Instrumentos/resultados en este expediente. Antes de cada edición futura: preimagen física, SHA y verificación contra FUENTES.json/CONSERVACION.json, preservando trabajo ajeno. No tocar src/services/tenant.ts, src/main.tsx, runtime-health.ts, selectores/config/pagos/provisioning ni entregas aceptadas.

## Plan finito y aceptación preparada

P0: incorporar decisión, completar controles ejecutables del contrato decidido, refutar lo afectado y freeze; conservar el rojo ya observado. P1: implementar sólo lector/guard de acceso separado y conexiones de los dos runtimes; rechazos antes del consumidor. P2: ejecutar válidos/adversos/cache/timeout/proveedor/excepciones sobre runtimes realmente registrados en el entorno local aislado ya usado por health/D05; salidas bloqueadas. P3: mutación aislada del punto de decisión, tipos pertinentes, paridad y regresiones sólo afectadas, claridad/custodia/registros. Cerrar exclusivamente reparación servidor si todo GREEN; N03 sigue en curso.

A1 estados: cinco exactos, ausencia y tipos inválidos; permitidos producen resultado base y bloqueados no alcanzan consumidor. A2 fallos de ambos lectores: falta configuración/token,404/403/500,error/JSON y pendiente/deadline;503 sin active ni efecto funcional. A3 cache: antes/en/exactamente después de30s, active→suspended, suspended→active, vencida+error, respuesta tardía y solicitudes concurrentes; contador acredita no renovación insegura ni multiplicación mientras pendiente. A4 separación: proveedor y prioridades idénticos frente a caracterización por runtime, incluyendo config opcional caído, inválido, legacy/env/stripe/none; webhook verificable sin cobros mantiene su respuesta de fixture y su registro antes del guard. A5 orden/compatibilidad: origen/límites/auth/contexto conservados, estado público válido idéntico por runtime, live/health e inicialización fallida según evidencia vigente; llamadas directas funcionales no saltan el guard ni datos de visitante lo habilitan. A6 sensibilidad: guard desarmado sólo en copia aislada permite un caso que el oráculo exige503 y por ello falla; positivos siguen válidos. Tipos con src/vite-env.d.ts incluido, sin relajar opciones, y paridad pertinente sin retirar excepciones adicionales.

El sondeo actual es evidencia preparatoria y RED frente a propuesta, no aceptación GREEN de una reparación sin construir. Arranque completo y middleware efectivo quedan NO_VERIFICADOS para el nuevo contrato hasta P2; no se repetirá una suite aceptada completa sin dependencia afectada. Se reutiliza infraestructura existente, no arnés general nuevo.

## Refutación y suficiencia para esta etapa

Procedencia: revisor independiente /root/refutar_soporte (Harvey), lectura de deuda/matriz y ambos getters/consumidores, sin cambios ni pruebas. BLOCKER encontrado: cambiar getter global afectaría webhook/checkout; resuelto en diseño con lector/cache de acceso separados y proveedor legacy intacto. MATERIAL: estados exactos, config opcional separado, orden de excepciones y caché/lectura pendiente. Estados/config/orden entran en tabla/aceptación; política temporal queda para única decisión de Liam. No hay congelación ni autorización implícita de implementación. El contraste no certifica la política comercial ni los runtimes remotos.

Progreso material en una pasada: comportamiento observado y custodiado; tabla y superficie mínima preparadas; riesgo de pagos separado; decisión única identificada. El segundo control se agregó por información accionable del revisor (lectura pendiente), sin corregir producto ni repetir estrategia fallida. Ningún ciclo fallido reiterado, ninguna nueva reparación.

Única siguiente acción: Liam aprueba la política temporal y autoriza ejecutar esta propuesta; retomar P0 de la misma N03/L05, sin reiniciar reconocimiento. Hasta entonces sólo preparación registrada; no alterar contrato de acceso.
