# N03 — stock-v1 cerrada localmente

RESULT: GREEN
TASK: Dar contratos coherentes y comprobados a POST /api/stock/add y GET /api/stock/items en ambos runtimes, preservando autenticación, tenant, validaciones y comportamiento.
GATES: 4/4; P0 contrato/refutación/RED, P1 handlers compartidos, P2 aceptación/mutación, P3 tipos/paridad/revisión/registros.
TESTS:72/72PASS, tipos final exit0, paridad pertinente3/3PASS; mutación aislada4casos con2PASS y2FAIL esperados. RED previo reproducido. Book/support no repetidos.
BLOCKERS: ninguno para la entrega local congelada.
CHANGES: módulo compartido stock-handlers.ts; registros en server.ts y api/index.ts; retiradas únicamente las dos excepciones de stock. POST agrega resultado exitoso sólo después del commit, sin duplicados por reintentos.
REMAINING: ninguno de stock-v1 local. N03 sigue en curso y no se abrió otra reparación.

## Acta, autorización y versión
Liam autorizó preparar/refutar/implementar las dos rutas y luego sustituyó el presupuesto únicamente para stock-v1 por69→máximo74, sin resets. Se continuó desde el reconocimiento guardado. [Corte anterior preservado](ejecucion-v1/preimagenes/registro__informe__N03__stock-v1__INFORME.md).
[Plan A1–A5 y gates](ejecucion-v1/PLAN.md), [refutación y freeze](ejecucion-v1/FREEZE.md), [huellas del contrato](ejecucion-v1/CONTRATO-HUELLAS.json). [Fuentes finales](ejecucion-v1/FUENTES-FINALES.json) identifica los4archivos; HEAD anterior en ejecucion-v1/HEAD.txt y preimágenes en [custodia](ejecucion-v1/CUSTODIA.json). Acta de esta versión local sin commit, push ni despliegue. Veredicto completa exclusivamente stock-v1.

## Estado real y corrección
StockTab y su servicio Firestore permanecen intactos. La búsqueda/lectura registrada no encontró que usaran estas rutas; se retiró del bloque cambiado el comentario que atribuía uso de POST a la UI. El objetivo cumplido es paridad/contratos de endpoints, no una migración o reparación de UI.
Antes: API no tenía ambas rutas y parity las exceptuaba. POST añadía éxito dentro del callback transaccional: un commit rechazado generaba éxito+error para una entrada; un reintento acumulaba dos éxitos, con cantidades de intentos distintos. Ambos defectos se reprodujeron antes de implementar.
Después: ambos registros usan las mismas factories. Cada callback devuelve su resultado; sólo el await exitoso permite incorporarlo a la respuesta. Error de commit produce una fila fallida; retry produce una fila del último intento. Layout flat/legacy, auth, tenant, coerción, auditoría y códigos conservados. GET conserva selección flat, consulta filtrada por tenant, fuzzy, cap50 y total previo al recorte. No se añadió fallback ni dependencia de IA; helpers existentes se inyectan, imports del módulo nuevo son sólo de tipos.

## Evidencia y aceptación
- [Tipos previo](ejecucion-v1/TIPOS-PREVIO-ESTADO.json):exit0 con src/vite-env.d.ts desde el primer arnés. Extiende configuración original sin relajar opciones.
- [RED-FREEZE](ejecucion-v1/RED-FREEZE.txt):72casos,33PASS/39FAIL, exit1. API36fallos por rutas ausentes; server commit/retry y falta factory. Resultado previo a producto.
- [Contrato final](ejecucion-v1/GREEN.txt):72/72PASS,0omitidos/cancelados, exit0. Código en [acceptance.cjs](ejecucion-v1/acceptance.cjs), registro real por AST. Auth denegada/tenant ajeno, validaciones, flat/legacy, auditoría, commit/retry/batch, DB ausente y fallos, GET filtrado/fuzzy/cap y parser JSON16kb.
- [Mutación](ejecucion-v1/MUTACION.txt):guard flat-tenant desarmado sólo en lectura en memoria;2positivosPASS y2adversosFAIL con200 frente a207 esperado, exit1. Assert exige encontrar la decisión real antes de modificarla. No se mutó producto de disco.
- [Tipos final](ejecucion-v1/TIPOS-FINAL-ESTADO.json):exit0, ambos runtimes y nuevo módulo importado, declaraciones Vite incluidas. [Paridad pertinente](ejecucion-v1/PARIDAD.txt):3/3PASS, exit0 (rutas, imports compartidos, ausencia duplicados inline); no se presenta como suite completa de19pruebas de api-parity.

Instrumento: Node/TypeScript/Express existentes, sin instalaciones; handlers y helpers de consulta/fuzzy reales extraídos por AST/VM, auth/DB/Timestamp controlados. Mock separa callback, escrituras preparadas y commit; reintento usa cantidad20en segundo intento. HTTP loopback comprueba parser y handler registrado en miniapp, no servidor completo. Los mocks no certifican transacciones, contención ni persistencia real. Comandos y resultados están en ejecucion-v1: node --test acceptance.cjs; STOCK_MUTATE=tenant con selección flat válido/ajeno; tsc --noEmit -p tsconfig.json; tsx --test con selección de paridad indicada.

## Revisión, conservación y evolución
[Revisión final independiente/integrador](ejecucion-v1/REVISION-FINAL.md) integra procedencia y hallazgos sin atribuir aprobación externa. Cinco pasadas completas y sin BLOCKERS. Contrato no cambiado después del freeze.
[Conservados](ejecucion-v1/CONSERVADOS.json):UI, servicio/helper stock, handler/test booking y handler/servicio soporte iguales por huellas. [Otras rutas](ejecucion-v1/RUTAS-CONSERVADAS.json):36server y39API idénticas en su declaración/cuerpo, incluidas book/support. No se repitieron sus suites válidas. Preimágenes físicas antes de cada escritura; trabajo ajeno conservado, sin limpieza de árbol.
Evolución de código existente: extracción evita divergencia entre runtimes; respuesta transaccional deja de acumular intentos no confirmados; prueba de paridad ya no admite las ausencias reparadas. No se reescribió stock ni se habilitó IA.
Método vivo r2 leído al retomar y huella verificada al cierre, sin cambio de criterio. Consumo observado69% en inicio/checkpoints, máximo74 sólo para esta entrega, sin resets; [lectura final](ejecucion-v1/CONSUMO-FINAL.json). Cuota compartida/redondeada.
N03 general conserva sus pendientes. SDK/reglas/entorno, runtime alojado y certificación integral siguen sus etapas N04/N06/N10; no fueron ejecutados ni certificados aquí.