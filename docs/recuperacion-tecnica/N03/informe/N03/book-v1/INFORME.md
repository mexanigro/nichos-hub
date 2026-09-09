# N03 — primera entrega /api/book

RESULT: GREEN para esta entrega local acotada; N03 continúa en curso.
TASK: Registrar POST /api/book en api/index.ts, compartir lógica con server.ts y conservar el contrato de BookingWizard.
GATES: P0 custodia/plan, P1 fallo reproducido, P2 handler compartido, P3 controles/revisión/registro: alcanzados para esta entrega.
TESTS: RED de paridad antes del cambio;34/34 pruebas después (19 paridad,15 handler), sin omitidas/canceladas. Typecheck de server.ts,api/index.ts y test nuevo con imports transitivos: exit0. Mutación del validador de duración detectada: el caso inválido recibió200 y el control falló como debía.
BLOCKERS: Ninguno de esta entrega local. El bootstrap completo y la persistencia remota no se ejecutaron ni certificaron.
CHANGES: Cinco archivos de producto/pruebas: módulo compartido nuevo, registro enambos runtimes, excepción única retirada y pruebas del handler real. Otras rutas intactas. Registros N02/N03 y receptores actualizados; ninguna operación remota.
REMAINING: Resto del alcance N03, entorno/SDK/reglas N04, runtime alojado previo y reservas integrales N06, certificación N10.

## Problema y cambio

BookingWizard envía POST /api/book y espera appointmentId. El handler existía únicamente en server.ts; tests/api-parity.test.ts admitía esa ausencia en ONLY_IN_SERVER. RED-CONTRATO.txt conserva el fallo exacto después de retirar sólo esa excepción: POST /api/book falta en api/index.ts. No se confundió el primer fallo de montaje Docker con el defecto del producto.

src/lib/api/booking-handler.ts concentra el cuerpo existente, manteniendo validadores, selección de campos, CLIENT_ID del runtime y createBookingWithManifest. server.ts conserva getAdminDb y carga perezosa de FieldValue; api/index.ts reutiliza loadAdminFirestore ya existente. No se inicializa Firebase al importar el módulo compartido: sus imports de tipos desaparecen en ejecución.

Contrato preservado:200 {success:true,appointmentId},400 campos inválidos,409 conflicto,503 DB no disponible,500 fallo de persistencia. El upsert del cliente sigue esperado con await y no fatal después de confirmar la reserva; se corrigió sólo su comentario engañoso de fire-and-forget. BookingWizard no cambió. No se usó /api/bookings/validate como sustituto, ni se modificaron otras excepciones/rutas.

## Qué prueban los controles

La prueba extrae con TypeScript AST la declaración app.post efectiva de api/index.ts y la ejecuta sobre Express con HTTP real127.0.0.1 dentro del contenedor aislado. No registra una ruta duplicada inventada por el test. Comprueba que ambos runtimes referencian la factory compartida y que el consumidor conserva POST/appointmentId.

El handler y createBookingWithManifest son reales; Firestore y su transacción son simulados. Casos: válido normaliza datos/ignora clientId ajeno y propone appointment+manifest+customer; defaults deestado; siete cuerpos inválidos no carganpersistencia; sinDB503, conflicto409, fallo de lectura500 y fallo de commit500 nunca devuelven éxito ni hacenupsert; fallo customer conserva éxito de reserva ya confirmada. No demuestra atomicidad, contención, permisos reales ni ejecución de middleware/bootstrap completo. N04/N06 conservan esas obligaciones.

La mutación se aplicó únicamente a la copia aislada: retirar decisión isValidBookingDuration permitió duración481 con200; el test exigía400 y falló por esa diferencia. Se conservan ambas preimágenes y MUTACION.txt; restauración por bytes comprobada en FUENTES-FINALES.json. No se mutó producto para el desarme.

## Ejecución, custodia y revisión

Docker reutilizó imagen local fijada sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2, pullnever,networknone,rootro,capdrop,no-new-privileges,4GiB/2CPU/128pids yUID65534. Fuentes/copia y node_modules RO, tmpfs limitado, entorno vacío con PATH/HOME/TMPDIR; sin .env ni credenciales montadas. Pruebas180s, tipos300s; todos los comandos con timeout interno. Cinco contenedores secuenciales propios eliminados, incluido el primer montaje fallido. Estados Docker conservanexit/OOM; no se abrieron servidores en el host.

Primer lanzamiento RED.txt: Docker no pudo crear el mountpointnode_modules dentro del directorio RO; código125, producto no ejecutado. Se creó únicamente el directorio vacío en la copia; RED-CONTRATO.txt logró ejecutar y reproducir el fallo. No hubo ciclos sin información nueva.

CUSTODIA.json conserva11preimágenes:3archivos originales a modificar y8registros. STATUS-INICIAL.txt fija trabajo ajeno; seis archivos previamente modificados de AdminDashboard/db/locales comparados contra la copia inicial permanecen idénticos. Las demás rutas ajenas no fueron editadas; no se afirma un censo de archivos volátiles ajenos. FUENTES-FINALES.json fija los5archivos finales y su igualdad con la copia de prueba.

Revisión de cinco pasadas: plan/deuda/consumidor; RED/GREEN y mutación; lectura de extracción y controles; revisión independiente focal y corrección de precisión; registros/pendientes/límites. Se quitó un import no usado del test y se precisó que la transacción es simulada después del GREEN, con preimagen; no cambia código ejecutable y no se repitió la suite por esa limpieza. [Revisión](REVISION.md).

## Reproducción acotada

Desde copia saneada equivalente, con los mismos montajes/límites y recursos existentes: node node_modules/tsx/dist/cli.mjs --test tests/booking-handler.test.ts tests/api-parity.test.ts; node node_modules/typescript/bin/tsc --noEmit -p tsconfig.n03.json. El config de tipos extiende el original y selecciona ambos runtimes y el test; no es la suite/typecheck completa N02. Conservar resultado nuevo sin sobrescribir éste. Ningún comando npm/install/deploy/login se ejecutó.

## Continuidad recibida

Liam aceptó N02 exclusivamente local. El403 no demuestra falta de acceso remoto y no está resuelto; no es obligatorio recuperar el Firebase temporal. En la etapa receptora puede elegirse otro entorno aislado o intervención de Liam. Antes de pedirla, indicar qué crear/hacer, enqué consola/destino y cómo verificarlo; no prolongar intentos por una dependencia del instrumento. N04 entorno/SDK/reglas; N06 runtime alojado disponible antes de certificarreservas; N10 integral.

Pendientes N03 fuera de esta entrega: arranque/base sinIA/agente, otras diferencias de rutas y políticas/tenants de su ficha. Se preserva validación de formato de fecha/hora existente; este cambio no pretende certificar calendario/zonahoraria/concurrencia ni reglas de reservas completas (N06). No repararotras rutas por hallazgos incidentales. Entrega local sin commit/push/despliegue.

Codex: referencia62%, objetivo67%, freno69%, máximo71%, sin resets. Inicio67%; lecturas entre pasos67%; consumo final en CONSUMO-CODEX.json. Cuota compartida, redondeada y sin atribución exacta de consumo por sesión.
