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

## Adenda posterior a los resultados — 2026-09-10

Lectura independiente de `recorrido.cjs`, `PLAN.md`, `FREEZE.json`, `FUENTES.json` y los resultados basal/mutante-namespace. No se ejecutó nuevamente el instrumento ni se modificó producto.

La revisión original se conserva íntegra en `preimagenes/REVISION-pre-adenda-resultados.md`, SHA256 `2702BBF73DACC8ED0D14EA5C59B63CB31B6E3F152890C24853FC9C70F8C3A293`. Ese es el documento al que apunta el FREEZE histórico; no se alteró el freeze para incorporar esta adenda. Antes de escribir se verificaron los tres hashes del freeze y las siete fuentes actuales contra FUENTES: todos coincidían.

**Resultado: sin BLOCKER de método para la caracterización local acotada.** Basal contiene 5 casos, 57 comprobaciones y cero fallos. El control coincidente entrega al callback del CRM el ID creado, nombre sintético y staff. Los cuatro casos separados —base, proyecto, ambos y `default` frente a `(default)`— tienen HTTP 200, una cita escrita en el almacenamiento modelado del backend y una consulta del navegador a otro namespace; el callback recibe lista vacía, loaded=true y error=null. Esto acredita la desconexión concreta en el modelo local, no compatibilidad funcional GREEN.

El extractor utiliza registro API, accessor, handler y validación actuales; las referencias Admin y la query del navegador pertenecen a los SDK instalados. La persistencia se resuelve por la clave proyecto/base/path. Se ejecutan el subscriber y los callbacks extraídos de AdminDashboard, sin montar React. La precedencia actual de FIREBASE_PROJECT_ID sobre VITE_FIREBASE_PROJECT_ID mantiene coherente al servidor en estos casos; no se desarma la guarda Admin/REST para fabricar el resultado.

El mutante-namespace conserva 57 comprobaciones y produce exactamente cuatro fallos de same-appointment al ignorar proyecto/base. Detecta la falsa conexión introducida en el almacenamiento simulado. Es sensibilidad del instrumento, no una reparación ni una mutación de producto. Las etiquetas textuales `connection`/`compatibility` son descriptivas; la conclusión se apoya en writes/query/uiState y sus aserciones.

**Límites materiales conservados:** runTransaction y onSnapshot están interceptados; serverTimestamp se materializa en una fecha sintética y la búsqueda de cliente se sustituye. El modelo no implementa concurrencia, reglas, índices, autenticación, ordenación/paginación general ni persistencia remota. Su única cita por caso permite aislar namespace sin necesitar modelar orden/limit de poblaciones mayores. No acredita métricas, filtros finales ni una fila renderizada del CRM. `uiState` representa las llamadas a setters reales extraídos, no una interfaz React montada.

La propuesta de autoridad de lectura backend sigue siendo una decisión funcional pendiente. Una lectura desde ese backend podría conectar la cita sin replicarla ni cambiar el destino general del navegador, pero requiere resolver autenticación/autorización por tenant, especialmente entre proyectos. **Lectura sola no resuelve las acciones CRUD de citas** que hoy pueden dirigirse al db del navegador; tampoco se atribuye esa solución al presente contrato. No implementar una reparación parcial como si hiciera operativa toda la agenda.
