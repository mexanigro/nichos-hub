# N03 — retoma del control de destinos de métricas

RESULT: GREEN local, para revisión. N03 permanece abierta.
TASK: reparar únicamente el montaje detenido, sin endpoint ni expectativas.
GATES: 3/3: P0 preimagen/freeze; P1 reproducción de los tres estados; P2 atribución/conservación/registros. No son los gates globales de N03.
TESTS: preimagen RED7 (exit1), producto GREEN48 (exit0), guarda desarmada RED7 (exit1);16 escenarios por ejecución.
BLOCKERS: ninguno de este tramo instrumental.
CHANGES: versión del instrumento con dos dependencias reales y captura de errores; registros actualizados.
REMAINING: revisión de esta evidencia, contrato de destinos separados y pendientes de cobro del balance; no ejecutados aquí.

## Causa y corrección

crmRangeWindow llama startOfDay e isoDay. El arnés extraía crmRangeWindow pero omitía ambas funciones; además descartaba console.error del catch del callback. Por eso un error interno se manifestaba como500 sin operaciones observadas, indistinguible del fallo deliberado de lectura usado por el contrato. Añadir sólo CRM_METRICS_DOC_CAP no solucionaba esas dependencias. El replanteo independiente comunicado por Liam autorizó esta reproducción concreta.

Se conservó inline-destinos.cjs previo en preimagenes y no se sobrescribió la versión anterior del expediente. La nueva versión extrae ambas funciones por AST del archivo montado en cada corrida, con cuerpos idénticos en preimagen y producto; captura nombre/mensaje de Error y argumentos de console.error en internalErrors. FREEZE.json prueba por reversión exacta que sólo cambiaron carga de dependencias y observabilidad: entradas, expectativas, guardas simuladas y mutación permanecen iguales. No se modificó producto.

## Atribución del resultado

En el caso compatible de métricas se observan las tres consultas iniciadas a projects/p-a/databases/(default)/documents:runQuery. El500 y Error STOP_LOCAL_READ son deliberados: fetch se intercepta y falla antes de cualquier acceso real. Ya no aparece ReferenceError. En configuración incompatible, producto devuelve503 sin consultas; preimagen y mutante vuelven a iniciar tres consultas y fallan las expectativas de destino/rechazo. Los siete fallos de ambos RED son idénticos y pertenecen exclusivamente a casos incompatibles de los cuatro callbacks.

Se conserva el mismo contrato de16escenarios/48controles: digest, sitemap, crm-metrics y services frente a compatible/incompatible/sin-token/sin-proyecto. No se ejecutaron suites ajenas. Salidas nuevas: resultados/preimagen, resultados/producto y resultados/mutante; comandos, exit y errores internos íntegros. Docker existente con --pull=never --network=none y fuentes sólo lectura; sin instalaciones, credenciales reales ni efectos externos.

## Qué permite descontar y qué no

Resuelve el impedimento de montaje del control positivo y acredita localmente selección/rechazo de destinos en esta población. No certifica cálculo, agregaciones, exactitud de rangos, timezone, caché, datos reales, autorización completa, HTTP alojado ni métricas completas. No unifica destinos del navegador y backend; la decisión de conservarlos separados y definir su contrato sigue vigente. El balance continúa siendo lista única de cierre; no se reabren entregas aceptadas ni se trasladan obligaciones a N04.

Producto preservado por huella antes/después, incluido api/index.ts. La evidencia y parada anteriores se conservan como históricas, junto con el incidente de custodia anterior; esta retoma no los borra. Techo100% TOTAL compartido, lectura inicial91%, sin resets/push/deploy. Etapas posteriores y condición sobre prestaciones por tenant antes del despliegue intactas.
