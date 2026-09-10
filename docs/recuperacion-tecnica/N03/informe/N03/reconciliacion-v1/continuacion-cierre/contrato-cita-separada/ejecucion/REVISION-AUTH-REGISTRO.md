# Revisión independiente posterior a implementación

Sin cambios de producto por este revisor. Se ejecutaron únicamente las corridas auth y registro pendientes y el control negativo nuevo de issuer; no se repitieron lookups ni suites aceptadas.

| Evidencia | Resultado |
|---|---|
| auth/resultados/green-r1/RESULTADO.json | GREEN, 38 casos, 65 comprobaciones, 0 fallos, exit 0 |
| resultados/registro-green-r1/REGISTRO.json | GREEN, 110 comprobaciones, 0 fallos, exit 0 |
| auth/resultados/mutante-issuer/RESULTADO.json | RED, 38 casos, 65 comprobaciones, 2 fallos, exit 1 |
| resultados/green-agenda-r1/CONTRATO.json | Resultado leído, no reejecutado: 33 comprobaciones, 0 fallos |

Mutante: únicamente el rechazo de issuer incorrecto se condicionó a la rama legacy, desarmándolo para expectedProjects explícito. Se mantuvieron firma, audiencia y expectativas congeladas. `issuer-wrong` e `issuer-suffix` se aceptaron incorrectamente y el contrato los detectó. Archivo montado de `auth/mutante-issuer/admin-auth.ts`, preimagen, argumentos y custodia preservados; ningún archivo de producto fue sustituido. Después de ejecutar, producto y preimagen coinciden; auth/contrato.cjs conserva el hash FREEZE-r2.

Registro evalúa AST de funciones y llamadas efectivas de ambos runtimes; verifica selección de emisores de configuración servidor, closed list de notify, delegación lookup y accessor y preservación default del gate legacy. No certifica una solicitud alojada ni reemplaza el contrato separado de criptografía.

Lectura de admin-auth, handler, servicio, callbacks Dashboard y etiquetas Dashboard/Calendar: sin BLOCKER nuevo confirmado. El servicio guarda referencia de origen fuera del documento, conserva historial, compara identidad física antes de deduplicar, prefiere filas browser coincidentes, controla generaciones de sesión y despacha actualizaciones al origen. Los errores explicitan datos anteriores sin actualizar. Las etiquetas de origen existen en las representaciones revisadas; no se ejecutó render completo.

Observación de conservación comunicada a root: la limpieza browser retorna temprano si faltan staff/date/time; el handler backend inicialmente no lo hacía. Para citas válidas de /api/book esos campos están presentes. No se atribuye a este control paridad general de documentos malformados ni corrección de manifests al reprogramar, atomicidad, concurrencia o reglas remotas.

Alcance: estos GREEN son contratos locales parciales de la reparación. No son aceptación del usuario, cierre de P3 global, autorización externa, métricas completas ni N03 completado.
