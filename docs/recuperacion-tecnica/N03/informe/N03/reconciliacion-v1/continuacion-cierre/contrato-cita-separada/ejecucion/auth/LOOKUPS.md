# Lookups reales de membresía — control separado

`lookups.cjs` extrae por AST lookupAdminUser de server.ts/api/index.ts y decodeFirestoreValue del API; carga isAdminRole/isAdminStatus reales y enlaza cada lookup con el gate real. No se repitió la suite auth. Firma RSA sintética válida con issuer legacy sólo para alcanzar la población de membresía.

Resultado `resultados/lookups/LOOKUPS.json`: **GREEN, 26 casos, 130 controles, cero fallos**, Docker exit 0. COMANDO.json conserva imagen y argumentos, sin red, dependencias/fuentes readonly. Hashes de las fuentes leídas están en el JSON. `preimagenes/lookups-pre-ejecucion.cjs` conserva el primer borrador; se corrigió la resolución del export Firebase Admin antes de ejecutar, sin modificar expectativas. Hubo una sola corrida de este contrato.

Trece casos por runtime: owner/manager/staff activos, otro tenant, tenant ausente, rol inválido/ausente, documento ausente, removed, pending, status inválido/ausente y fallo de transporte. Los resultados fijados comprueban rechazo de tenant/rol/ausencia, removed rechazado por gate, pending permitido y status inválido/ausente conservado como active. Cada consulta usa admin_users/email normalizado; Admin captura proyecto/base/path de referencia SDK real. No cambio de política.

Límite: API intercepta firestoreRestGetDocument en su interfaz collection/id; esta prueba no certifica su URL/contexto REST. Admin intercepta DocumentReference.get. No Firebase remoto, auth crossproject integrada con nuevos endpoints ni registro HTTP. El RED auth anterior sigue siendo una evidencia distinta.

## Refutación de conexion.cjs leído antes de implementar

BLOCKER instrumental comunicado a root: Query.get aplicaba appointments/tenant-local/db fijos en lugar de la query del SDK. Eso ocultaría quitar where(clientId) del handler. Debe capturar/aplicar colección, namespace, filtros, orden y límite reales; incluir otro tenant antes de listar, no recién después. La comprobación no-write sólo buscaba operaciones con update y omitiría txset: contar todas las escrituras. No se editó conexion.cjs.

CONTRATO.md declara correctamente que P0 está incompleto hasta instrumentar consumidor/errores/auth/registros/acciones. El RED por módulo ausente sirve para acreditar la conexión faltante; no valida la sensibilidad de las pruebas de una futura implementación.
