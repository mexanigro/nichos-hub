# L02 client-info — preparación terminada, producto RED

**Recomendar autorizar la reparación local descrita en [PROPUESTA](PROPUESTA.md). No se implementó. L02 no descontada; N03 sigue abierta.**

Fuentes adjudicadas vigentes: las cuatro huellas de W-NEXT/aceptacion-local coinciden; 17 fuentes/dependencias custodiadas. Runtime aislado Nodev22.23.1, Firebase Admin13.10.0, Firestore7.11.6, Next16.2.9; dependencias existentes, sin instalaciones. Docker network=none, filesystem read-only salvo resultados/tmp, entorno sintético. [Contrato](CONTRATO-PREPARACION.md), [fuentes](FUENTES.json), [comando y exit](resultados/r3/EXIT.json).

## Evidencia RED

Handler real transpilado, NextRequest/NextResponse reales, token firmado/verificado con jose y secreto público sintético, rate limiter, branding, servicios, idioma, diff, templates y configToWizardData reales. Se interceptan exclusivamente DB y envío de emails. Cada set del endpoint pasa por batch.set del SDK instalado y se extrae el write sin commit. [Casos y writes](resultados/r3/CASOS.json), [RED](resultados/r3/RED.json).

| Caso | Resultado observado |
|---|---|
| Alta config ausente, hub ausente o existente | HTTP200; claves literales business.mode/name y contact.email; lector sin los valores anidados solicitados. Fallback hub creado en memoria cuando falta. |
| Alta con config existente | HTTP200; lector sigue viendo mode=team, nombre=Anterior y email viejo aunque el envío pidió solo/Nuevo/new@example.invalid. |
| Resubmit con hub changes_requested y config ausente/existente | HTTP200; mismo defecto, estado pending_review; SDK emite delete/increment/serverTimestamp. |
| Resubmit con hub ausente o status indebido | HTTP403 sin escrituras ni correos. |
| Omisiones/contact/address vacíos/arrays vacíos | Defaults siguen emitidos; hermanos e imágenes fuera del parche conservados en modelo; arrays vacíos no reemplazan servicios. Defaults anidados siguen defectuosos. |
| Auth/tenant/límite | Token ausente/inválido/expirado401; tenant ajeno403; body/idioma inválido400; 10 respuestas200 y llamada11=429 sin efectos adicionales. Otro tenant intacto. |

21 escenarios /31 invocaciones del handler. 815 comprobaciones auxiliares completadas, más aserción final de presencia de RED. 599 discrepancias registradas, incluyendo repetición del ensayo de límite: **no son 599 defectos distintos ni documentos reales afectados**. Exit1 es RED esperado; no hubo error del instrumento en r3. r1/r2 exit2 y preimágenes conservadas; r2 ya dejó20 casos durables. [Refutación y progreso](REFUTACION.md).

## Qué prueba el SDK y qué no

DocumentMask.fromObject construye un FieldPath por clave, sin dividir puntos. El write literal codifica la máscara con el nombre completo entre backticks; su segments contiene un solo elemento business.mode. El mapa business:{mode:...} produce dos segmentos y máscara business.mode sin escape. La materialización usa esos segmentos del SDK y decode de DocumentSnapshot, no un mock que separa puntos. Los únicos splits del instrumento pertenecen al oracle que expresa el objetivo futuro, no a aplicar writes.

[Sondas SDK](resultados/r3/SONDAS-SDK.json): anidado→lector solo y hermano conservado; literal/restaurado→lector team antiguo. Arrays son hojas y conservan claves literales dentro de sus elementos. delete figura en máscara y fuera de fields; serverTimestamp/increment en updateTransforms, idénticos entre las dos sondas. contact:{} demuestra reemplazo del mapa: la propuesta prohíbe introducir ramas opcionales vacías.

**Límites:** aplicación de merge y transforms en memoria, timestamp fijo sintético e incremento numérico acotado; no servidor Firestore. No persistencia, reglas/claims, transacción, concurrencia, atomicidad, red, notificaciones ni despliegue certificados. El stub add del historial usa set/merge y sólo acredita payload/secuencia modelados, no la precondición create real. El lector no hidrata imágenes ni lee hub_clients; sus datos se observan aparte. Las sondas de contraste no son una implementación del endpoint ni sustituyen la mutación futura del handler reparado. Contrato futuro y checks de historial más precisos en PROPUESTA; expectativas basales congeladas en [ORACULO-FUTURO](ORACULO-FUTURO.json).

## Cierre de preparación

P0 fuentes/preimágenes/islamiento; P1 RED completo; P2 SDK positivo/negativo, conservación y refutación; P3 propuesta y registros. 4/4. Sin BLOCKERS de preparación. 285 archivos src intactos; 546 artefactos comparativos/de implementación W-NEXT verificados por huella, aceptación también intacta. No se repitieron sus pruebas ni otras entregas aceptadas.

Consumo observado 82% TOTAL compartido (inicio82), techo85%, sin resets. N03 abierta; L01, otros escritores L02, L12 y demás BALANCE intactos. N04/N08/N10 conservan validaciones reales y antes del despliegue se mantienen identificación de tenants/prestaciones, evidencia y decisión de Liam sobre excepciones. Sin push/deploy ni efectos externos. Pendiente autorización de reparación local; no aceptación anticipada de GREEN producto.
