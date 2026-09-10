# Revisión independiente: cita con destinos separados

Alcance: lectura de booking-handler.ts, loadAdminFirestore en api/index.ts, subscribeToAppointments en db.ts y sus consumidores AdminDashboard/BookingWizard. Sin ejecutar suites, modificar producto ni consultar servicios externos.

## Mecanismo observado

- `src/lib/api/booking-handler.ts:44–86` obtiene el contexto Admin, crea la cita mediante createBookingWithManifest y devuelve solamente `{ success: true, appointmentId }`.
- `api/index.ts:2445–2473` selecciona la instancia/base Admin efectiva y comprueba su compatibilidad con la configuración REST del servidor. Esa guarda no conecta una instancia del navegador con la cita creada.
- `src/services/db.ts:95–144` consulta `appointments` en el db importado del navegador, con clientId, orden createdAt descendente y límite 500. No recibe appointmentId ni utiliza un lector del backend.
- `src/components/admin/AdminDashboard.tsx:290–321` monta esa suscripción fuera de demo; en demo usa datos sintéticos propios. No recibe el ID de BookingWizard.
- `src/components/booking/BookingWizard.tsx:192–227` conserva el ID de la respuesta para avisos/checkout. No lo conecta con la consulta del CRM.

## Hallazgos

**MATERIAL — conexión ausente por lectura de fuente.** La identidad de una cita incluye proyecto, base y ruta. Igual clientId o igual documento ID no demuestra identidad entre dos namespaces. Si la creación tiene éxito en un destino Admin separado, la suscripción actual no tiene mecanismo para leer esa cita desde allí. Esta lectura identifica la causa; la reproducción funcional corresponde al sondeo de root, todavía no revisado aquí.

**MATERIAL — distinguir rechazo y falta de visibilidad.** Un entorno de servidor que contradiga su propia configuración Admin/REST puede rechazar la creación antes de persistir. La separación navegador/backend debe representarse con sus configuraciones independientes reales, sin desarmar esa guarda. Una cita no creada no acredita el defecto de visibilidad.

**MATERIAL — límite de la prueba.** La observación de la suscripción puede acreditar entrega de la misma cita al consumidor del CRM; no acredita una fila visible en navegador completo, porque siguen existiendo filtros de fecha/personal y modo demo. El control coincidente necesita createdAt y una población dentro del límite 500. El resultado debe identificar namespace, ruta y contenido sintético de la cita, evitando considerar un ID coincidente de otro namespace como éxito.

## Propuesta mínima pendiente de decisión funcional

Conservar los destinos separados. Resolver explícitamente si las citas creadas por `/api/book` tienen al backend como autoridad de lectura del CRM. Si se confirma, la alternativa mínima recomendada es una lectura de citas del mismo backend, autenticada y acotada al tenant, manteniendo los demás datos del navegador en su destino actual. No copiar documentos ni unificar selectores por preferencia.

Un GET de una cita por ID prueba una recuperación puntual, pero por sí solo no reemplaza la agenda actual por suscripción. Antes de implementar debe quedar definido si el contrato exige esa recuperación puntual o la alimentación de la agenda; no atribuir al primero la garantía del segundo. No aceptar un proyecto/base arbitrario enviado por el navegador para elegir la autoridad.

No hay una decisión de reparación inferible de los cinco consumidores leídos. No se implementó ninguna alternativa, no se certificaron permisos/rules o Firestore remoto y no se abrieron cancelaciones, disponibilidad u otras familias.
