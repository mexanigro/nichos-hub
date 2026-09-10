# Revisión acotada de cambios posteriores

Revisor interno independiente, sin modificación de producto ni ejecución de suites. Objeto: checkout compartido, L12 site y aviso ES-A; vigencia de caracterización de excepciones de paridad. Fuentes actuales y hashes por archivo/registro en REVISION-CAMBIOS-HASHES.json, producido por revisar-cambios.cjs (sólo lectura AST y escritura de informe local).

## Hallazgos

- MATERIAL: api/index.ts:1 importa checkout-handler sin extensión .js. Las demás factories del runtime usan .js y el contrato técnico existente de api-parity explica que Vercel ESM requiere esa forma. checkout.cjs inyecta la factory transpilada y no carga ese import; GREEN no acredita su resolución. Corrección mínima propuesta a root: ../src/lib/api/checkout-handler.js. No cambiar import server por este hallazgo. RESUELTO: lectura posterior confirma import ../src/lib/api/checkout-handler.js; preimagen de esta revisión conservada y hashes finales refrescados. No se ejecutó proveedor ni Vercel para afirmar un error remoto observado.
- Ningún otro BLOCKER/MATERIAL demostrado en los cambios examinados. Esta afirmación no acepta el producto ni elimina las obligaciones residuales.

## Checkout y conservación

Comparación AST del cuerpo del callback basal de server frente al cuerpo de la factory: idénticos al normalizar CRLF y sustituir exclusivamente la expresión de baseUrl por su dependencia getBaseUrl. Ambas rutas suministran la expresión basal APP_URL || localhost:port; API adapta loadAdminFirestore al mismo contrato db/null. Validadores, colección appointments/doc appointmentId, preferencia priceCents/legacy, rechazo tenant explícito ajeno, modos, URLs, provider y redacción de errores quedan conservados. La aceptación local no extiende autorización a documentos sin clientId ni certifica depósitos/moneda/proveedor reales.

La observación material anterior del test se incorporó antes del freeze final: ahora afirma reads y appointmentId/email/name/successUrl/cancelUrl. Evidencia existente leída: checkout-green 22 casos/320 controles GREEN; mutante de precio request RED16. No se repitió. La redacción del error es la del server heredado; no se presenta como saneamiento de todos los logs.

## L12

Diff contra preimagenes/producto/src/config/site.ts limitado a tres correcciones: filtro Array.isArray incluyendo vacío/desconocidos sin recuperar preset; conservación price/duration/image al cambiar idioma dejando textos en el preset lingüístico; imagen override por índice de servicio incluso cuando el preset no tenía imagen en ese índice. El índice procede del map de servicios efectivos, por lo que no añade servicios ni cambia la allow-list. Ausencia/null, reglas SAFE, modo y resto del merge no fueron modificados por el diff. Los resultados de root se reciben con sus límites de fixture/SSR; no se ejecutaron suites en esta revisión.

## ES-A

Diff del banner frente a preimagen: sólo añade span condicional current===es con explicación fallback inglés y conservación del español del hub/contenidos. No cambia enum, normalización, callbacks, PATCH, confirmación ni guardado. El instrumento existente comprueba render para he/en/ru/ar/es y mutante que restaura ausencia del aviso; GREEN y RED1 leídos. No acredita interacción completa en navegador ni traducción íntegra.

## Vigencia de paridad

Comparación AST literal con preimágenes usadas por el contrato de paridad: los 45 registros app.* no-checkout de server y los 46 de API son idénticos por texto/hash y orden. Incluye get/post/put/delete/patch/use/all; captura wildcard y comillas simples. Por tanto los cinco registros/callbacks de las excepciones no cambiaron y no corresponde repetir su suite aceptada como caracterización local. Los hashes completos de server/API cambian por extracción de checkout, sin invalidar por sí solos aquellas pruebas.

Límites conservados: evidencia paridad sobre Express real con callbacks extraídos y upstream simulados; no startup completo, middleware global, import ESM alojado, cron efectivo ni entrega real. Revisión documental/AST no reemplaza tipos y mutaciones que ejecuta root. No se modificó BALANCE ni se declararon nuevas aceptaciones.
