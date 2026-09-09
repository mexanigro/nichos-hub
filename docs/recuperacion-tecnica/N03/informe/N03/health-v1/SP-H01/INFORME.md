# SP-H01 resuelto — health-v1, misma N03

GREEN exclusivamente local; P0→P1→P2→P3, 4/4. Autorización expresa para reabrir health-v1 e incorporar SP-H01 al contrato. El contrato vigente es [A1–A6 anterior](../PLAN.md) con la precisión y condiciones S1–S5 de [esta adenda](PLAN.md): readiness200/503 para solicitudes permitidas, exceso429 antes de la sonda. [Freeze](FREEZE.md) y [huellas](CONTRATO-HUELLAS.json).

## Corrección y política

Se reutiliza exactamente rateLimit de cada runtime, con sus variables API_RATE_LIMIT_MAX y API_RATE_LIMIT_WINDOW_MS (defaults60/60000), clave IP+ruta e identificación IP originales. Las señales viven en Router montado bajo /api, conservando req.path /health como el montaje anterior. Orden efectivo: headers públicos→limitador→readiness; queda antes del bootstrap funcional y del control de tenant. El rechazo429 termina sin cargar ni consultar nuevamente Firestore y conserva el mensaje genérico original. No se aplica dos veces la cuota a health.

/api/live queda explícitamente sin cuota: siempre200 si el proceso atiende, respuesta constante sin DB ni consumo de cuota de health. También funciona con bootstrap incompleto/fallido y después del exceso de health. No declara capacidad operativa.

Sólo cambiaron src/lib/api/runtime-health.ts y el argumento pasado a installRuntimeHealth en server.ts/api/index.ts. Función del limitador, defaults/configuración, getClientIp, loaders y otras rutas intactos. No se normalizan case/trailing ni se modifica la política de confianza IP. Protección por memoria/instancia, sin promesa distribuida o remota.

## Evidencia de las siete fases

- Reconocimiento acotado: huellas previas verificadas, SP-H01 confirmado en el orden actual. Sin reiniciar análisis general.
- Plan P0–P3 y aceptación S1–S5 guardados antes de producto; tipado incluye vite-env original.
- [RED](resultados/sph01-red/RESULTADOS.json):17PASS/4FAIL. GET excedido y alias/API devolvieron200 con dos nuevos pares loader/read; HEAD excedido agregó otro par, en ambos runtimes completos.
- Refutación independiente: sondeo por live sin cuota y HEAD automático incorporados antes del [freeze](FREEZE.md). [Procedencia y revisión](REVISION.md).
- P1: Router + limitador real antes de la sonda, sin mover señales detrás del bootstrap/tenant.
- P2: [89/89 cuota](resultados/sph01-green/RESULTADOS.json), [19/19 inicialización incompleta](resultados/sph01-incompleta/RESULTADOS.json), [99/99 regresión afectada](resultados/sph01-regresion/RESULTADOS.json):207 controles GREEN. Casos por defecto/configurados, ventana expirada, IP independiente, prefijo/API, HEAD, dependencia caída, bootstrap temprano/tardío/incompleto, readiness correcta y liveness sin cargas. [Mutación](resultados/sph01-mutacion/RESULTADOS.json):17 positivos PASS y4FAIL esperados al retirar sólo el limitador en copia. Falla específicamente exceso GET/HEAD, con cargas/lecturas nuevas, no por fallo de arranque.
- P3: [tipos exit0](resultados/TIPOS-ESTADO.json), [paridad3/3](resultados/PARIDAD.txt), [conservación](CONSERVACION.json), [fuentes finales](FUENTES-FINALES.json), [custodia](CUSTODIA.json), [sello](SELLO-CIERRE.json). Cada corrida conserva stdout/stderr, exit, timeout y disposición; sin sobrescribir evidencia anterior.

La revisión previa omitió comparar las protecciones atravesadas por los middleware antes/después del traslado. Single-flight cubría concurrencia pendiente, no solicitudes sucesivas. El revisor independiente reconoció la omisión; SP-H01 invalida aquella conclusión de suficiencia hasta esta reparación. No invalida las pruebas ajenas al cambio. La nueva revisión cubre orden/efectos, consumidores/política y conservación/claridad; sin BLOCKERS ni MATERIAL pendientes. No hubo ciclos repetidos sin avance.

## Conservación y límites

Las otras37/40rutas, política del limitador y loaders coinciden por AST.328fuentes previas conservadas en bytes, incluidas book-v1/support-v1/stock-v1 y consumidores. El cuerpo de readiness/probe/respond y complete/fail también se conserva: la evidencia de su mutación anterior sigue vigente. La copia ejecutada coincide en bytes con los tres archivos de producto finales. Contrato congelado sin modificación posterior. HEAD y status conservan trabajo previo.

Runtime completo probado mediante server.ts CLI y export real api/index.ts en Docker local, red externa bloqueada, configuración sintética, sin.env ni credenciales reales. Cero intentos externos observados durante los recorridos; control del observador conservado. Esto no certifica SDK/persistencia remotos ni todas las funciones base. Sin instalaciones, operaciones remotas, commit, push, deploy o resets. [Consumo final](CONSUMO-CIERRE.json), dentro del techo total74%.

No queda pendiente local de SP-H01. Health-v1 vuelve a cerrarse exclusivamente con esta adenda; N03 sigue en curso. Las entregas book-v1, support-v1 y stock-v1 se conservan. No se abre otra reparación.
