# Excepciones de paridad: caracterización local

RESULT: GREEN para el contrato acotado de caracterización, no N03 completa.
GATES: P0/P1/P2/DONE alcanzados. Sin cambios de producto ni nuevas aceptaciones.

Fuentes capturadas antes del montaje, contrato y primer instrumento congelados en FREEZE.json. Basal inicial GREEN: 27 casos HTTP loopback y 101 comprobaciones; no se había predicho un defecto de los callbacks. TypeScript extrae cinco registros literales y sus callbacks; Express instalado ejecuta esas llamadas y atiende HTTP real dentro de Docker sin red. booking-validation es el módulo real transpilado, sin duplicar validadores. SPA usa express.static y un index sintético. DB/token/email/log son interceptados; cron no se programa ni se llama remotamente. Comandos Docker, stdout/stderr y exit permanecen por corrida.

## Resultado por excepción

| Excepción | Resultado acreditado localmente | Límite |
| --- | --- | --- |
| GET /api/services | Registro API único, sin homólogo server; proyección id/name/duration/price y destino config/tenant; errores falta token/proyecto503, upstream404/502 y excepción500. | Upstream simulado; no prueba permisos, catálogos reales ni todos los middleware del runtime. |
| POST /api/availability | Registro API, missing/formato400 y echo válido200 sin consulta de slots. | available:true significa la semántica ligera existente; no acredita disponibilidad de agenda. |
| POST /api/bookings/validate | Registro API, validadores reales, payload válido y rechazo campos/duración/tiempo; cero persistencia. | valid:true no reserva ni certifica concurrencia. Caller externo no observado; no afirmar ausencia universal. |
| GET /api/daily-digest | Registro API + cron configurado; secreto/token/proyecto bloquean antes de DB/email; tenant en consulta, destinatario/remitente, conteo y estimación con fixture; ausencia owner/fallo upstream/proveedor y queued/sent diferenciados. | sent es respuesta del proveedor simulado; queued no envío; no timer efectivo, entrega, idioma/moneda reales, dedup o decisión de inclusión en nueva oferta. |
| GET * SPA | Registro real extraído incluye comillas simples y wildcard; deep-link entrega index, static entrega archivo, ruta API específica prevalece. Config Vercel conserva API antes de catchall. | No startup completo, bundle real ni ejecución alojada de rewrites. |

El CENSO N01 ya adjudica los tres helpers a monitor/checks. La preimagen bookingCheck.ts actual acredita calls concretos a services y availability, sin ejecutar escritura métrica. No tiene llamada a bookings/validate; se conserva ese límite en vez de inventar un consumidor. Book/support/stock y sus aceptaciones no se repitieron. El extractor anterior de tests/api-parity.test.ts no detecta GET * por restringir slash y comillas dobles; este instrumento AST sí lo captura. No se modificó aquel test.

## Sensibilidad y corrección del instrumento

Ronda inicial: retirar services/availability/validate/SPA produjo RED11/5/12/3; desarmar guarda de authorization cron produjo RED3. Retirar digest provocó ERROR-INSTRUMENTO (exit2): el observador accedía a una operación inexistente. No se contó como sensibilidad válida. Fuente anterior preservada en preimagenes/contrato-r1.cjs; resultado y error conservados en resultados/remove-3.

Única corrección: accesos opcionales del observador para convertir ausencia de operaciones en fallos de expectativas fijas. No se cambió ningún valor esperado, contrato ni callback. FREEZE-R2.json conserva nuevas huellas. Ronda final basal-r2 GREEN27/101, exit0. Los seis mutantes exit1 sin error del instrumento: remove-0=11, remove-1=5, remove-2=12, remove-3=29, remove-4=3, cron=3 fallos. El mutante cron realiza consultas y envío simulado con credencial incorrecta; el contrato exige cero y lo detecta. Resumen en RESUMEN.json.

## Conservación y alcance

PREIMAGENES.json y CUSTODIA-FINAL.json atan fuentes a resultados. El script sólo escribió dentro del expediente y /tmp efímero; producto no modificado. No se importó el startup completo ni se ejercitaron auth/origen/cuota globales. Por tanto estos resultados acreditan la justificación y semántica local de los registros exceptuados; no una certificación integral de protección de rutas, monitor, disponibilidad, reserva, cron o transporte. Políticas y obligaciones posteriores permanecen en sus receptores existentes. Ninguna ruta se copió ni retiró.
