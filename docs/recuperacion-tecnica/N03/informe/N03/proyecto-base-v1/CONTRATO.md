# Contrato local proyecto/base — preparación

Alcance congelado: getAdminDb (server.ts), loadAdminFirestore (api/index.ts), firestoreRestCreate, getFirestoreRestContext, firestoreRestGetDocument y firestoreRestPatchDocument. Sin modificar producto.

P0: fuentes y 35 entradas/expectativas fijas preservadas. P1: capturas efectivas con SDK instalado y operaciones interceptadas. P2: conservación y sensibilidad (alterar app reutilizada y URL observada debe producir RED atribuible). P3: matriz, límites, recomendación y revisión archivados.

Aceptación de preparación: cada caso captura dos accesores Admin, app real seleccionada, projectId/databaseId reales y referencia SDK; cada helper REST captura URL/método o ausencia de operación y retorno/error. Registros/cache aislados por caso. SDK real; cert RSA sintético generado sólo en memoria; no registrar valores de claves/tokens. Docker sin red ni entorno anfitrión. Fuentes readonly. HTTP simulado, no prueba OAuth/permisos/DB.

Ausencia, vacío y blancos permanecen entradas diferentes. Clave en blancos con app nueva: error cert; con app existente no se parsea y puede operar. default literal no se equipara con (default). Política de destino común NO aprobada: las expectativas describen el comportamiento actual; GREEN instrumental no descuenta ni legitima discrepancias. No reabrir clientId, pagos, kill-switch, otros accesores o escritores.

Refutación previa Newton: sin BLOCKERS; cubrir registro real/cachés, app ajena primera, cero operaciones y bases distintas. Incorporado. Fuentes vigentes y deuda ya adjudicada, sin nueva auditoría. Techo90% TOTAL compartido (inicio86%), reserva10%N04; N03 abierta, etapas posteriores y condición por tenant antes del despliegue intactas.
