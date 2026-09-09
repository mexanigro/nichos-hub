# L05 servidor — GREEN exclusivamente local

Se completó el guard servidor de N03: sólo active/trial/maintenance comprobados permiten; suspended/archived conservan423; estado ausente/inválido/imposible de verificar503 genérico. El plazo completo1500ms comienza antes de token/SDK; caché30s desde inicio; peticiones concurrentes comparten operación y plazo, sin permiso vencido ni caché por respuesta tardía.

P0/P1/P2/P3 alcanzados,4/4. Autorización de política, implementación y retoma incorporadas; [freeze previo](FREEZE.md), [decisión](DECISION-APROBADA.md), [revisión y corrección del oráculo](REVISION-CIERRE.md). No se reabrió reconocimiento ni sondeo válido. Se conservan resultados anteriores, incluyendo errores del instrumento.

Sólo cambian server.ts, api/index.ts y nuevo src/lib/api/tenant-access.ts. Guard compartido con lectores Admin/REST que conservan selectores; estado público desde res.locals. Getter/cache de proveedor, pagos/webhook, autenticación, origen, límites, señales de salud y demás cuerpos/registro de rutas conservados. Sin browser, provisioning, documentos reales, precio ni política comercial nueva.

## Acceptance Contract completo

| Criterio | Resultado y evidencia |
|---|---|
| A1 estados/consumidor | Válidos, suspendidos/archivados y desconocidos/ausentes/tipos inválidos, ante el handler realmente registrado en server CLI y API export. Contador del consumidor distingue503 del guard de503 de IA deshabilitada. |
| A2 verificación/fallos | SDK/config/token ausentes o fallidos,HTTP403/500/404/JSON, lectura/SDK/token lentos;503 antes de consumidor. l05-green y l05-config. |
| A3 cache/plazo |24 controles temporales deterministas y HTTP: T0+30000 exacto, error tras vencimiento, recuperación suspended→active, segunda solicitud cerca de deadline, tercera tras timeout sin nuevo lector, tardía no habilita. |
| A4 pagos separados | Getter/cache/cuerpos intactos por AST, provider original10/10 y complemento exacto; webhook de prueba sin firma conserva400 incluso suspended. Ningún cobro. |
| A5 orden/compatibilidad | Estado público con cachés discordantes, auth401, origen403, cuota429 sin nuevo consumidor; health/live independientes y bootstrap fallido503 sin lecturas/consumidor. |
| A6 sensibilidad/conservación | Mutación aislada4 fallos esperados/10 positivos; tipos exit0, paridad3/3, conservación83/83.330 fuentes previas template y6 fuentes lint hub intactas. |

[Aceptación consolidada](ACEPTACION-FINAL.json):105 controles HTTP retenidos,24 temporales,83 conservación y3 paridad. Tipos0. La corrida l05-green conserva65/66: su oráculo incorrecto se reemplaza sólo por comprobación exacta sobre original/final, con explicación en revisión; no se esconde ese resultado ni se declara la corrida original enteramente verde. Sensibilidad no cuenta sus fallos esperados como tests de producto aprobados.

Corridas HTTP en Docker local existente, network=none/read-only/cap-drop, env saneado sin .env ni claves reales; credenciales sintéticas y fixtures. Contadores y bloqueo de salidas del preload conservado, sin red externa real. Arranque real acreditado, no persistencia/transacciones/SDK remoto. No se repiten suites book/support/stock/D05 intactas; sólo controles afectados por el nuevo guard y conservación por huellas/AST. Paridad usa tres controles pertinentes sin modificar excepciones.

[Huellas finales](FUENTES-FINALES-L05.json) y copia coincidentes. Fuentes de evidencia por corrida en resultados; cada una conserva exit, stdout/stderr y disposición. No hay soluciones temporales ocultas ni servicios propios pendientes; el mutante permanece sólo en el expediente aislado.

N03 continúa. Cierre de esta entrega para revisión de Liam, no aceptación del usuario anticipada. Navegador/directo Firestore y certificación remota pendientes; resto del balance intacto. Antes de despliegue deben presentarse tenants/servicios a conservar con evidencia y decisión de Liam sobre excepciones; no inferir compromisos de claves/planes. Sin instalaciones, operaciones remotas, commit, push, deploy ni resets. Techo80% TOTAL N03, último checkpoint75%; consumo final se conserva en CONSUMO-CIERRE.json.
