# L03 — contraste previo, decisión pendiente

Preparación autorizada por Liam el2026-09-10 según SIGUIENTE-ACCION de L02/aceptacion-local. Orden específica: contrastar primero promesa visible y política aceptada; presentar cualquier contradicción que requiera decisión antes de ampliar pruebas o fijar expectativas. No producto ni reparación presupuesta.

## Punto concreto

El editor del hub muestra «Notificaciones habilitadas», «Alertas de reserva» y «Consultas de contacto», sin delimitar esos controles por estado del agente o por destinatario. Interpretar que apagar el control global impide TODOS los avisos entraría en conflicto con D05 aceptado: sin agente, se conservan los cinco avisos base por email antes de consultar cache/preferencias. No se toma aquella interpretación de UI como una política ya aprobada ni se declara defectuosa la implementación D05.

Decisión presentada a Liam: **con agente deshabilitado, ¿los avisos base deben seguir enviándose aunque un toggle esté apagado, o autoriza revisar esa política para permitir su supresión?** Conservar D05 mantiene los emails base; el alcance/promesa de los toggles deberá precisarse sin contradecirlo. Permitir supresión cambia una política aceptada y requiere esa autorización expresa. Ninguna opción implica habilitar IA/agente por preferencias públicas.

## Evidencia local reutilizada, sin nuevas corridas

| Fuente vigente | Observación |
|---|---|
| Hub src/components/client-config-tab.tsx,1138–1140 | Labels y paths notifications.enabled / bookingAlerts / contactInquiries. No fijan alcance por evento/destinatario. |
| D05 CONTINUACION-APROBADA.md C3 y FREEZE.md | Preservar avisos incluidos sin agente; email disponible→intento al evento/destinatario esperado; no inventar destinatario en walk-in sin email. |
| Template server.ts:getChannelConfig y api/index.ts:getChannelConfig | Devuelven baseNotificationChannels antes de cache/preferencias cuando AGENT no está habilitado. Habilitado: leen notifications.channels. |
| Template src/lib/api/optional-services.ts | Cinco canales base email: booking_confirmation_customer, cancellation_customer, reschedule_customer, new_lead_owner, new_booking_owner. |
| D05 INFORME.md y resultados aceptados referidos allí | Evidencia local de recorridos y canales conservada; no demuestra matriz de los tres toggles. |

Población futura ya delimitada, todavía sin nuevo resultado esperado:

| Evento incluido | Destinatario del aviso base | Agente deshabilitado: política vigente |
|---|---|---|
| booking_confirmation_customer | Cliente con email disponible | Email |
| cancellation_customer | Cliente con email disponible | Email |
| reschedule_customer | Cliente con email disponible | Email |
| new_lead_owner | Dueño, destinatario configurado | Email |
| new_booking_owner | Dueño, destinatario configurado | Email |

Esta tabla identifica la población D05 y su política, no certifica cinco nuevos envíos. La matriz true/false/ausencia de tres toggles x agente on/off no se ejecutó ni se congeló. La relación de bookingAlerts con aviso al dueño y/o al cliente permanece por precisar. Tampoco se imputa un fallo a la rama con agente habilitado sólo por leer canales.

## Estado y gates

P0: contraste y definición compatible de alcance/política (pendiente decisión). P1: matriz local con instrumentos D05 reutilizados. P2: evidencia, refutación y propuesta mínima sólo si corresponde. P3: contrato/resultado registrado para revisión. Alcanzados0/4; avance actual: fuentes contrastadas y punto decisorio identificado. No hay Acceptance Contract L03 congelado ni RED funcional nuevo; preparación incompleta por condición de entrada no resuelta.

STOP de trabajo dependiente exigido por la orden actual; no freno por estrategia fallida. No se hicieron intentos de reparación ni pruebas ampliadas. Descartado: considerar automáticamente fallo «toggle=false y email base enviado». Nueva información: labels no delimitan alcance; contrato y ambos runtimes coinciden en la excepción base. Necesaria decisión de Liam antes de continuar.

Límites: lectura y evidencia local D05 reutilizada; no DB/notificaciones reales, persistencia, atomicidad ni entrega certificadas. Instrumentos runner-matriz.mjs/runner-recorridos.mjs identificados, no editados ni reejecutados. No nuevo framework, eventos, herramientas, instalaciones, producto, resets, efectos externos,push/deploy. Consumo observado83%/techo85% TOTAL compartido. N03 abierta, L03 no descontada; L02 aceptada sóloPOSTclient-info y otras entregas intactas. Etapas posteriores y condición sobre prestaciones por tenant antes del despliegue conservadas.
