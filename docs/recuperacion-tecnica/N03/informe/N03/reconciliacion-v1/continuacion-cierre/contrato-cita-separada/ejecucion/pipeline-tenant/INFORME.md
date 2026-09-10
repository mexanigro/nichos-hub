# Bloqueo anterior a la ruta CRM con proyectos separados

**Compatibilidad funcional RED.** La caracterización r2 pasa 14 comprobaciones, exit 0, precisamente porque reproduce el bloqueo. No es GREEN de la conexión.

Se extrajeron del API actual el initializer de enforceClientActive, su app.use('/api',...) y la factory/registro GET de crmAgenda. El orden AST confirma middleware antes del registro. Se ejecutaron createTenantAccessGuard y el handler CRM actuales en Express real por HTTP loopback dentro de Docker sin red. Token y respuesta REST de clients son sintéticos; auth CRM y DB de citas se interceptan para observar si se alcanzan.

| Caso | HTTP | Lectura clients | Autenticación CRM / lectura citas |
|---|---|---|---|
| VITE/ADMIN/REST project coincidentes | 200 | URL backend-project/backend-db/clients/tenant-local; active | Ambas alcanzadas |
| VITE browser-project, ADMIN/REST backend-project | 503 Tenant state unavailable | Ningún fetch: la guarda de compatibilidad lanza antes | Ninguna alcanzada |

La traza separada sólo obtiene el token sintético. El middleware convierte el fallo de loadStatus en rechazo por estado no comprobado. No se modificó ni desarmó el guard, no se repitió su aceptación anterior ni se afirma que ese rechazo sea un defecto aislado suyo.

## Corrección de atribución

Los contratos anteriores ejecutaron registro/handler de book o CRM y consumidores de manera aislada. Omitieron el app.use global del API. Sus comprobaciones siguen acreditando sus unidades y la lógica de conexión si la ruta se alcanza, pero **no acreditan el recorrido HTTP efectivo con proyectos separados**. Esta nueva evidencia impide atribuir esa garantía al conjunto.

## Decisión funcional necesaria

Debe fijarse qué documento `clients/{CLIENT_ID}` gobierna el acceso/estado operativo de esta API cuando navegador y backend tienen proyectos separados: el clients del destino seleccionado actualmente desde navegador, o el clients del backend que crea y sirve citas. Elegir autoridad de citas o confiar en issuer browser/admin_users no resolvió por sí solo la autoridad del estado del tenant.

No retirar la guarda, declarar active por defecto, copiar estados ni decidir unificar proyectos como corrección implícita. La decisión debe preservar suspensión/archivo y la semántica de estado no verificable. Tras adjudicar autoridad, hará falta un contrato del pipeline que distinga estado activo, bloqueado y no verificable antes de acceso a citas; no basta cambiar selector y repetir sólo callbacks.

## Custodia y límites

resultados-r2/PIPELINE.json contiene respuestas, trazas, orden de registros y hashes de fuentes; COMANDO.json y exit.txt conservan ejecución exacta. Primera corrida falló al parsear una llave faltante del stub DB; resultados iniciales y contrato-r1-preimagen.cjs preservados. Una corrección puramente instrumental produjo r2; expectativas iguales.

Este montaje aísla el middleware señalado; no ejecuta todos los demás middlewares globales, SDK/Auth/Firestore remotos, reglas ni render. El positivo sólo acredita llegada a ese handler a través de ese control. No se efectuaron modificaciones de producto.
