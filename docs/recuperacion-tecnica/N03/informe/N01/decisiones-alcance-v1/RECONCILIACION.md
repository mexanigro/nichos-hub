# Reconciliación de alcance con censo, deuda y matriz

Complemento vigente `decisiones-alcance-v1` del censo SA-01-L-v1 y control SP03-v2. [Decisiones](DECISIONES.md). La captura local inicial confirma 3092 entradas Git y fuentes sin deriva; los SP01/SP02/SP03 se reutilizan por huella. Ningún dato remoto se refrescó. Familias/candidatos/documentos no se eliminan, aunque una prestación quede diferida para la nueva base.

## Matriz y deuda recibidas

Se mantienen seis nichos comerciales × he/en/ru/ar; employment sólo regresión, otro→estetica como normalización, ambos modos solo/equipo y fronteras hub/template/claims. Celdas P/L siguen significando presencia local, no traducción completa ni despliegue certificado. Reservas por defecto en barberia/estetica/tattoo/nails; contacto/consulta preservados en cafeteria/remodelaciones/employment. ES-A cambia el objetivo de oferta, no prueba esas celdas.

| Familia/recorrido conservado del censo | Estado de contrato nuevo | Deuda que no desaparece / siguiente consumidor |
| --- | --- | --- |
| publico/config/ciclo: selector hub→config→deploy→tenant/site→App/CRM | ES-A elegido | L06 y H01: es cae a en, hub.language no siempre llega a config; L01/L02/L12 merge/modos. N03/N08 corrigen bajo orden, N10 certifica idiomas completos |
| crm/cobro: PaymentsTab/CSV, agenda y métricas; gateway/checkout/webhook separados | Manual/CSV incluido, checkout nuevo diferido | L04/L08 de gateway/importe quedan para clientes con compromiso y futuras activaciones, no cerrados. N05 certifica manual/CSV; N06 relación agenda; N07 comercio y SaaS por separado |
| agenda/calendar: BookingWizard/AppointmentCalendar vs auth/callback/disconnect Calendar | Agenda incluida, Google sync diferida | D08 concurrencia/turnos no diferido. calendar_config/OAuth existentes preservados; estado/compromiso por tenant no verificado. N04/N06/N07/N08 |
| notificacion/soporte: Notify/cron/logs/email, Contact/Inquiry e hilo provider_messages | NOT-A elegido | L03 toggles/channels, queued≠entrega, inglés actual, Gmail/Resend y eventos complementarios abajo. N03/N05/N06/N07/N08 |
| saas/ventas/costos, ia/wa, monitor/infra, auth/clientes/stock/tareas | Se conserva adjudicación previa | No añadir IA/agente a base ni retirar herramientas internas de Liam. L01–L13, H01–H09 y D01–D16 retienen destinos. H03 monitor sin IA sigue N09; no es defecto resuelto por SP01 |

## Eventos: incluido no significa enviado ni certificado

| Evento / fuente local ya censada | Aplicación de NOT-A | Condición/pendiente y responsable |
| --- | --- | --- |
| booking_confirmation_customer | Incluido: cliente, email tras persistencia | N06/N07: reserva única, idioma, destinatario y fallo de email sin duplicar cita |
| reminder_24h_customer | Incluido: cliente, email | N06/N07: scheduler real, cambio/cancelación, Asia/Jerusalem, idempotencia; enum no acredita timer operativo |
| cancellation_customer y reschedule_customer | Incluidos: cliente, email | N03/N06/N07: estado primero, trazabilidad/reintento, no llamadas al agente |
| new_lead_owner y new_booking_owner | Incluidos: dueño, email | N04/N07: destino por tenant, no fallback global accidental |
| new_booking_staff | Incluido cuando aplique equipo/staff asignado | N04/N07: identidad y destinatario válidos; no inventar staff/correo en solo |
| review_request_customer y marketing | Fuera de nueva base hasta orden expresa | Configuraciones/compromisos existentes se preservan. N01 presenta excepción si aparece; N07 no apaga ni envía por esta nota |
| Auto-reply de contacto, respuesta/notificación de soporte, preferencias históricas | No se declaran cubiertos automáticamente por los siete eventos | Excepción de cobertura E-NOT-01: censo conserva Contact/Inquiry→inbox y SupportTab→provider_messages→hub reply; texto TODO promete portal pero hilo existe. Integrador N01 identifica qué aviso se promete/emite y lo presenta antes A04; N05/N07/N08 reciben recorrido y aterrizaje del enlace |
| Resumen diario /api/daily-digest | Operacional existente, fuera del enum; no confundir con marketing | E-NOT-02: cron local declarado y envío a dueño presentes; frecuencia/remitente/idioma/destino efectivo no certificados. Recomendación técnica: adjudicar como aviso operativo del dueño si corresponde al contrato vigente, sin presentarlo como elección ya aprobada. N01/N07, cron N09 |
| Avisos de pago y suscripción Arzac | Separar evento del comercio de SaaS | E-NOT-03: webhook/notificación comercio y plantillas SaaS son recorridos distintos. Manual/CSV no implica que exista email de cobro manual ni que se haya contratado facturación. Integrador N01 identifica evento/compromiso concreto; N05/N07/N08 verifican según contrato antes A04/uso |
| Plantilla contractual Gmail frente a implementación Resend | Diferencia concreta de proveedor, no decisión resuelta por NOT-A | E-NOT-04: recomendación técnica Resend conservada, sujeta a remitente/dominio/idiomas/entrega/costo y compromiso. Integrador presenta sustitución concreta si cliente tiene Gmail comprometido; Liam decide excepción material, no diseña transporte |

Fuentes: [propuesta DEC-NOT y sus F13/F17–F20](../segunda-autorizacion-v1/PROPUESTA.md), [CENSO](../SA-01-L-v1/CENSO.md), [DEUDA](../SA-01-L-v1/DEUDA.md), api/index.ts:977–1041,1225,2444,2466,4926–5101 en template; email-templates del hub y SupportTab ya censados. Son fuentes de código/plantilla, no contratos firmados ni entregas reales.

## Casos por cliente: desconocidos concretos, no excepciones contractuales inventadas

| Caso identificado en evidencia histórica | Lo conocido y lo que falta | Operación/efecto/responsable |
| --- | --- | --- |
| hub_clients/M0VaD8RBINa6dzMFxEcU; clientId demo-future-tattoo; prj_isuKwvbxqQ2rHY3N9S4oTJnktu2V; demo-future-tattoo.arzac.studio | Registro ready y 404 del diagnóstico; no estado actual, contrato firmado, idiomas o integraciones prometidas comprobados. No se afirma excepción a ES/COB/CAL/NOT | Integrador N01: F2 identifica registro vigente, F3 configuración raw cuando autorizado; V1/V4/V5/V3 deployment/alias bajo PR posterior. No visitar sitio ni cambiar ready. A01/A04 siguen abiertos |
| hub_clients/demo-lekt-grigori-mpyhjweg | Captura no tenía clientId/status ni proyecto/dominio suficiente; docId no sustituye clientId por inferencia. Compromiso comercial desconocido | Integrador N01: F2 acotado; si continúa sin ID, no expandir F3/Vercel, preparar identificación específica. Presentar límite a Liam, sin diseñar desde nombre ni borrar registro |
| Resto de tenants | No se afirma ausencia de excepciones porque no haya contrato local asociado | F2 hasta25 y sin paginar sólo delimita población visible. Página adicional, ausencias y errores mantienen incompleto. Integrador prepara evidencia específica por cliente/evento antes A04 |

Fuente histórica de estos dos casos: F22 de segunda-autorizacion-v1/PERMISOS, captura 2026-09-06T13:34:59.643Z; no se presenta como observación remota de este turno. **No se verificó una excepción contractual de cliente concreto**. Lo correcto hoy es conservar compromisos desconocidos y presentar estos casos de reconciliación, no afirmar que no existen excepciones.

Las máscaras r2 observan intención/config raw y diferencias, no contienen contratos firmados, calendar_config, payment_credentials, destinatarios, horarios/servicios/staff completos ni env del bundle. No permiten certificar compromiso, sync activa, entrega o contrato efectivo completo. Si hace falta otra fuente, el integrador preparará consulta mínima y permiso específico; el alcance aprobado no amplía F2/F3. No reenviar contratos/datos personales a otros servicios ni contactar clientes.
