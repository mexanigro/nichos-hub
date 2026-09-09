# N03 — support-v1, entrega local cerrada

RESULT: GREEN
TASK: Reparar el envío autenticado de soporte del CRM en ambos runtimes.
GATES: 4/4; P0 contrato/refutación/RED, P1 handler compartido, P2 consumidor y conexión local, P3 tipos/paridad/revisión/registro.
TESTS: contrato29/29PASS y mutación efectiva conservados por huellas; tipos exit0; paridad pertinente3/3PASS exit0. Ninguna prueba del contrato ni mutación repetida.
BLOCKERS: ninguno para support-v1 local.
CHANGES: en P3 sólo se agregó src/vite-env.d.ts al include del arnés, con preimagen; producto y opciones del compilador intactos. Revisión e informes actualizados.
REMAINING: ninguno de esta entrega. N03 sigue en curso; otras reparaciones y remoto quedan fuera de esta orden.

## Acta y versión aceptada
Alcance congelado en [FREEZE.md](FREEZE.md): handler compartido, ambos registros, consumidor autenticado y retirada de la excepción de soporte. Se conserva la implementación de cinco archivos identificada en [FUENTES-FINALES.json](FUENTES-FINALES.json). En P3 no se modificó producto, no se hizo commit/push/deploy ni otra operación remota.

Liam autorizó explícitamente retomar P3, guardar preimagen de tsconfig.json, agregar la declaración Vite existente y ejecutar tipos/paridad/revisión. Se mantuvieron objetivo, alcance y contrato. El STOP anterior y sus dos resultados permanecen íntegros; [informe anterior preservado](p3-cierre-v1/preimagenes/informe__N03__support-v1__INFORME.md). El defecto era la selección incompleta del arnés, no una razón para relajar el compilador.

Veredicto: entrega local support-v1 completa. No declara N03 ni producción completas.

## Aceptación y resultados
- A1/A2/A3: [29casos aprobados](GREEN-CONTRATO.txt), código real de consumidor y registro/handler con transporte/auth/DB/res simulados. Incluyen imports/factory, token, rechazo sin envío, identidad del runtime, validación, errores y límite5000. Resultado reutilizado porque fuentes y controles conservan sus huellas.
- A4: [mutación](MUTACION.txt),18casos con16PASS y2FAIL esperados. Desarmar auth sólo en memoria produce1carga de almacenamiento donde ambos runtimes exigen0; exit1. Producto de disco nunca fue mutado. Evidencia conservada.
- A5: [tipos P3](p3-cierre-v1/TIPOS-ESTADO.json), exit0, incluye server.ts/api/index.ts/support.ts, imports transitivos y la declaración Vite existente. Sólo cambia include; extends/exclude y opciones originales no se relajan. [Preimagen](p3-cierre-v1/preimagenes/tsconfig.json).
- [Paridad P3](p3-cierre-v1/PARIDAD.txt):3/3PASS, exit0, rutas, imports compartidos y ausencia de duplicados inline. Se seleccionaron esos tres controles pertinentes; no se presenta como ejecución de los19casos completos de api-parity ni como suite global.

Comandos nuevos: node node_modules/typescript/bin/tsc --noEmit -p <expediente>/tsconfig.json; node node_modules/tsx/dist/cli.mjs --test --test-name-pattern 'route parity|both runtimes consume|the inline duplicates' tests/api-parity.test.ts. Rutas y salidas exactas en los estados P3. Los controles seleccionados no ejecutan bootstrap ni llamadas a proveedores. No se instalaron dependencias.

## Revisión, evolución y custodia
[Revisión final y procedencia del contraste](p3-cierre-v1/REVISION-FINAL.md): refutación interna independiente integrada, lectura del integrador, diff frente a preimágenes y cinco pasadas. Sin BLOCKERS/MATERIAL demostrados pendientes. Se identifica el contraste como interno; no se atribuye una revisión externa no recibida.

Evolución: desaparece el handler duplicable de soporte en favor de una factory común; Vercel expone la ruta realmente consumida y el consumidor envía credencial o frena. Campos/tenant/autorización y códigos existentes se preservan. /api/book no se rehízo y las otras excepciones no se tocaron.

[Huellas comprobadas](p3-cierre-v1/HUELLAS-VERIFICADAS.json):5/5archivos producto coinciden con la entrega anterior; controles, GREEN, mutación, plan y freeze iguales. Expediente original completo sin deriva al abrir P3. Preimágenes físicas antes de cada archivo existente editado. Los resultados nuevos viven en p3-cierre-v1 y no sobrescriben resultados anteriores. Método vivo r2 leído y huella F090F5F8E5429BC7FCB74D187E105A14E3D1153D37D40B9036436B0E885B0C7D conservada.

## Límites y continuidad
Aceptación local del contrato congelado: no certifica HTTP/bootstrap alojado, Firebase real ni persistencia remota. N04/N06/N10 conservan sus obligaciones. N03 mantiene otras rutas, base sin IA, health, selección de configuración/tenant y lint en su ficha; no se abrió otra reparación.
Consumo P3 observado68%, objetivo67/freno69/máximo71, sin resets; lectura final en p3-cierre-v1/CONSUMO.json. Cuota compartida y redondeada.