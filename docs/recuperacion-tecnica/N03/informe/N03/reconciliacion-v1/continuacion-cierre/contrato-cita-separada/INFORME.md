# N03 — contrato de cita entre destinos separados

RESULT: RED de compatibilidad cuando los destinos físicos difieren; caracterización local completada.
TASK: seguir una cita de POST /api/book hasta su lectura por el consumidor CRM real.
GATES: 4/4 del contrato preparatorio (recepción/fuentes; recorrido; evidencia/refutación; propuesta/registros). No cierre N03.
TESTS:5casos57controles de caracterización aprobados; mutante del instrumento RED4 por falsa conexión entre namespaces. No se repitió el control de destinos aceptado ni suites ajenas.
BLOCKERS: ausencia de conexión en este recorrido; decisión funcional de autoridad de lectura pendiente antes de producto.
CHANGES: únicamente instrumento/evidencia/registros. Siete fuentes de producto idénticas antes/después.
REMAINING: definir contrato de lectura de citas y su autorización; conservar pendientes de cobro y demás balance.

## Resultado concreto

/api/book, registrado por api/index.ts, ejecuta createBookingHandler y createBookingWithManifest reales. loadAdminFirestore real selecciona aplicación/base; referencias Admin del SDK instalado identifican destino efectivo. La transacción interceptada registra appointments/{id} y daily_manifests en ese destino antes de devolver {success:true, appointmentId}. El tenant procede del backend, no del clientId ajeno enviado en el body sintético.

El módulo Firebase del navegador inicializa su app/base VITE con SDK real. dbService.subscribeToAppointments real consulta appointments allí, filtrado porclientId, ordercreatedAtdesc, limit500. Los callbacks reales de AdminDashboard reciben el resultado y llaman setAppointments/setAppointmentsLoaded/setSubscriptionError. No reciben el ID devuelto por BookingWizard. Éste conserva el ID para avisos/checkout, sin convertirlo en una referencia completa para el CRM.

[Matriz de destinos e identidades](MATRIZ.md). En control coincidente aparece la misma cita (ID, nombre, staff). Al separar sólobase, sóloproyecto, ambos o default/(default), /api/book sigue devolviendo200 y la escritura existe en el destino backend modelado, pero la suscripción CRM entrega [] conloaded=true yerror=null. Se conservó la guarda Admin–REST del servidor: no se confundió cita rechazada con cita creada e invisible.

**No existe un mecanismo de conexión en el recorrido examinado.** Compartir clientId, colección o un documentoID no hace que Firestore lea otro proyecto/base. No se afirma ausencia universal de integraciones remotas no observadas. La condición local de lectura de la misma cita entre destinos separados permanece incumplida; ahora queda localizado exactamente el corte, en vez de atribuirlo a selectores individuales.

## Contrato y sensibilidad del instrumento

Persistencia interceptada por clave completa proyecto/base/path; la respuesta HTTP y la lectura derivan de la misma escritura, sin crear una segunda cita para aparentar éxito. El mutante sólo del instrumento ignora proyecto/base al entregar onSnapshot: produce exactamente4fallos, uno por caso separado. Demuestra que el control detecta una falsa conexión fabricada por un mock; no es una reparación ni mutación de producto.

Reutilización: extractor/carga TypeScript y límites de book-v1, sondeo Admin/SDK de proyecto-base-v1 y browser-destinos.cjs. No se ejecutaron sus suites aceptadas. Revisión independiente en [REVISION.md](REVISION.md), con preimagen de la revisión antes de su adenda y freeze histórico intactos. Sin BLOCKERS de método para esta caracterización.

Límites: Express/HTTP loopback real; handler, transacción lógica, referencias/query SDK y callbacks consumidores reales. runTransaction, lookup de customers y onSnapshot interceptados; serverTimestamp materializado en fecha sintética. No se prueban DBpersistente, concurrencia, autenticación, reglas, índices, orden/paginación de poblaciones grandes, filtros finales ni fila renderizada en React. No se tocó configuración real ni se cargaron credenciales; clave de prueba generada en memoria, nunca registrada. Docker --network=none/--pull=never; sin efectos externos.

## Propuesta mínima y decisión pendiente

**Recomendación:** que el backend que crea las citas de /api/book sea su fuente de lectura para el CRM. Conservar el destino principal del navegador; añadir una lectura/listado de esas citas desde el mismo backend, autenticada y limitada al tenant. No elegir proyecto/base desde un parámetro arbitrario del visitante, copiar documentos, sincronizar ni unificar selectores.

**Decisión funcional solicitada:** confirmar esa autoridad de lectura para las citas creadas por /api/book. Una lectura puntual por ID no reemplaza la alimentación de la agenda actual: el contrato debe cubrir su listado al consumidor, sin prometer una agenda operativa por implementar sólo GET/id.

Antes de implementar deben quedar explícitos autorización entre proyectos y conservación de citas existentes que sólo estén en la base del navegador. No se presume que estén vacías ni se ocultan/trasladan sus datos. Asimismo, cambiar sólo lectura no garantiza que las acciones CRUD actuales actúen sobre el mismo origen; no se presenta esa reparación parcial como agenda completa. Esos límites condicionan el diseño posterior y no autorizan aquí cambios de permisos o escrituras.

## Balance y aceptación integrada

La aceptación de Liam del control local de selección/rechazo de destinos se registró en retoma-metricas/ACEPTACION.md y en registros vigentes, sin repetirlo. Esa obligación local queda descontada sólo en su alcance; no métricas completas. La coherencia entre creación y lectura de esta cita sigue RED para destinos separados. No se convierte el diagnóstico en cierre de la familia ni se traslada la obligación a N04.

N03 abierta; pendientes de cobro, aceptaciones previas, etapas posteriores y condición sobre prestaciones por tenant antes del despliegue intactas. Techo100%TOTAL, observado92%, sin resets, instalaciones, push/deploy ni efectos externos.
