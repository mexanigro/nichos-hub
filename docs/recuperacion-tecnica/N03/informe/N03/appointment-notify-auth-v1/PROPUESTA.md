# N03 — appointment-notify-auth-v1: propuesta única

Preparación autorizada; implementación todavía NO autorizada. N03 sigue en curso. Techo 80% TOTAL, sin resets. No se modifica producto en esta etapa.

## Defecto y consumidor

POST /api/appointment/notify en api/index.ts entra directamente a procesar booked, cancelled y rescheduled; server.ts llama primero a requireAdminAuth y retorna si no autoriza. CRM: CustomersTab crea reservas; AdminDashboard cancela/reprograma; los tres exports de src/lib/appointment-notify-client.ts obtienen getIdToken y envían Authorization Bearer. Si no tienen token, no envían. El servidor debe impedir que una llamada directa evite esa protección del consumidor.

Reparación propuesta: añadir exclusivamente al inicio de ese handler de api/index.ts, antes del try y del procesamiento del cuerpo, las mismas dos instrucciones de server.ts: `const auth = await requireAdminAuth(req, res);` y `if (!auth) return;`. Reutilizar wrapper y guard compartido actuales. Ningún cambio al navegador, server.ts, selectores, autenticador, canales, payload, textos, límites, orden general, rutas hermanas o política de roles.

El guard existente valida JWT Firebase, email_verified y admin_users del tenant actual. owner/manager/staff son roles admitidos; removed deniega, pending no se endurece aquí y el fallback actual de estado administrativo desconocido tampoco se cambia. No hay fallback efectivo a ADMIN_EMAIL ni siteConfig.adminEmail; comentarios heredados no son prueba de autorización. Las diferencias REST/SDK del lookup se conservan.

## Plan finito y gates

| Gate | Cambio / dónde / necesidad | Resultado observable |
|---|---|---|
| P0 | Medición, referencia de payloads, contrato y refutación en este expediente; autorización de Liam y freeze antes de producto | RED funcional reproducido, instrumentos válidos, ningún BLOCKER de construcción |
| P1 | Preimagen física de api/index.ts y copia de prueba; añadir las dos instrucciones exclusivamente en el handler | Rechazo anterior a las notificaciones; diff exacto, sin otras modificaciones |
| P2 | Ejecutar el mismo control en runtimes registrados y cotejar positivos contra baseline por runtime/canal/acción | Contrato GREEN; tipos y paridad pertinentes aprobados |
| P3 | Retirar esas instrucciones sólo en copia aislada, ejecutar el control; revisar claridad/conservación y registrar cierre | Mutación falla por acceso indebido, producto intacto, entrega local para revisión |

Esta preparación completa medición/contrato/refutación, pero no congela ni alcanza P0 de implementación hasta la autorización. No se repiten suites aceptadas de book/support/stock/health/L05/clientId sin dependencia afectada.

## Contrato de aceptación propuesto

1. En ambos runtimes realmente registrados, booked/cancelled/rescheduled sin token o con token inválido: 401 Unauthorized; JWT válido de tenant ajeno o usuario sin registro, o email no verificado: 403 Forbidden. Cero agente, email, IA o escritura de negocio observada. Lecturas necesarias para autenticar/verificar tenant no se consideran efectos prohibidos.
2. Los tres exports reales del consumidor conservan método, ruta, cuerpo y Bearer. Usuario legítimo y configuración sintética completa: éxito y notificaciones correspondientes. Comparar respuesta y eventos completos por runtime/acción contra preimagen; no exigir igualdad entre diferencias ya existentes de ambos runtimes. Agente true y false por separado: comprobar agente opcional y notificaciones email base; false nunca intenta agente.
3. Origen ajeno sigue 403 sin efectos para las tres acciones. Middleware de tenant, bootstrap, limitador y auth actual conservados por diff; no se traslada la ruta ni se modifica su registro o middleware global.
4. Observador positivo: recoge los destinos simulados de los casos legítimos; ningún intento externo permitido. Docker --network=none, imagen/dependencias/montajes existentes, env saneado sin .env ni credenciales reales. Un fallo de arranque/importación es NO VERIFICADO, nunca RED funcional.
5. Mutación preparada: quitar sólo las dos instrucciones del handler API en copia física de la versión final (ancla única y comparación exacta); exigir arranque y fallos 401/403 y cero efectos en los casos adversos API. Server conserva sus positivos. No basta un exit distinto de cero. Producto y evidencia previa intactos.
6. Tipos con arnés clientId-v1/tsconfig.json que incluye vite-env; paridad existente pertinente sin cambios de excepciones. Conservación por huellas de fuentes no afectadas y diff exacto del handler. P3 revisa claridad y alcance. No se certifica autenticación remota, entrega efectiva, reglas Firestore o identidad real mediante estos mocks.

RED: cualquiera de los rechazos previstos no ocurre o produce efectos, o se pierde un resultado legítimo de referencia. GREEN de reparación exige todos los criterios sobre producto final y mutación sensible. Esta propuesta por sí sola no da GREEN a la reparación.

## Infraestructura y evidencia

Se reutilizan ejecutar.ps1, copia de 333 fuentes, node_modules vacío como punto de montaje, dependencias N02, api-worker, preload-recorridos, hooks y fixture de clientId-v1. Control nuevo acotado: ../clientId-v1/runner-auth-prep.mjs; preload-auth.mjs agrega captura completa del cuerpo email sin cambiar los preloads aceptados. FUENTES-P0.json compara las 333 fuentes actuales y copia contra FUENTES-FINALES.json aceptado. Salidas nuevas auth-preflight-v1 y auth-baseline-v1 conservan todo resultado anterior. auth-reference-v1 repite sólo positivos para fijar cuerpos email completos sobre preimagen; se compararán en selección full tras implementar. No afirma conservación de campos no capturados por el baseline anterior.

La mutación ejecutable está preparada en ../clientId-v1/preparar-mutacion-auth.cjs. --check comprueba el ancla sobre server vigente en memoria y la ausencia de guard en API original, sin escribir producto. --create queda para P3: crea copia-auth-mutacion nueva, conserva preimagen del archivo final y retira únicamente el guard; rechaza un diff ajeno y fuentes no coincidentes. Futuras pruebas GREEN usarán copia-auth-green nueva, preservando copia y evidencia aceptadas de clientId-v1. Ejecutar el lanzador existente con -Copia copia-auth-green o copia-auth-mutacion -Runner runner-auth-prep.mjs -Seleccion full y nombres nuevos. Tipos/paridad usarán sus instrumentos existentes; no se reconstruyen dependencias.

La reparación local pertenece a N03; se corrige la adjudicación anterior que la dejaba íntegramente en N04. N04 conserva certificación de identidad/entorno reales y acceso a datos. Condición previa al despliegue por prestaciones de tenant, evidencia y decisión de Liam permanece intacta. Sin instalaciones, remoto, cambios reales de entorno, commit, push o deploy.

Única siguiente acción solicitada: autorizar esta reparación de dos instrucciones y la ejecución P0→P3, con este contrato y sin ampliar alcance.
