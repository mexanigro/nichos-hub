# N03 — continuidad de soporte, preparación v1

Orden vigente 2026-09-09: continuar N03, comprobar book-v1 sin rehacerlo y trabajar el siguiente pendiente concreto, local y sin ampliar alcance. Misma tarea N03; no nueva hija. Consumo inicio67%, última lectura68%; objetivo67/freno69/máximo71, sin resets.
Método vivo r2 leído completo; SHA256 F090F5F8E5429BC7FCB74D187E105A14E3D1153D37D40B9036436B0E885B0C7D. Las siete fases de la orden actual gobiernan el avance; esta preparación no congela todavía un contrato incompleto.

## Terreno y deuda
book-v1 conserva igualdad SHA256 en sus cinco archivos finales. Se reutiliza su evidencia local, sin repetir pruebas ni certificar bootstrap/remoto. N02 cerrada exclusivamente local.
Pendiente elegido: soporte del CRM. server.ts:3953 registra POST /api/support/message y exige requireAdminAuth; api/index.ts carece de la ruta; ONLY_IN_SERVER admite su ausencia. src/services/support.ts:67 llama esa ruta sin Authorization. El recorrido exige resolver ambos defectos juntos.
Stock, health, arranque/base sin IA, selección tenant/config y lint siguen en N03; esta entrega no los certifica. SDK/reglas/entorno remoto N04, runtime alojado N06 y certificación integral N10 conservados. Firebase temporal no requerido.

## Plan finito y gates propuestos
- P0: contrato viable/refutado y RED registrado. Cambian controles y expediente N03; observación: detectan ausencia de ruta y autenticación del consumidor. Preparación en curso.
- P1: handler de soporte compartido registrado en ambos runtimes, retirada sólo su excepción. Cambian server.ts, api/index.ts, nuevo src/lib/api/support-handler.ts y tests/api-parity.test.ts. Observación: ruta Vercel resuelve el mismo contrato.
- P2: consumidor transmite autenticación por mecanismo existente y controles de recorrido pasan. Cambia src/services/support.ts y pruebas pertinentes. Observación: mensaje autenticado devuelve id; rechazos no persisten.
- P3: validación completa del contrato, sensibilidad y revisión, registros/huellas actualizados. Observación: evidencia del recorrido local final y límites expresos. DONE sólo de soporte; N03 completa sigue pendiente.

## Acceptance Contract propuesto, todavía no congelado
A1: registro efectivo de POST /api/support/message en ambos runtimes usando handler compartido, sin excepción soporte. RED preliminar: ruta API ausente. No basta contar rutas para GREEN.
A2: ejecutar sendMessage real con usuario autenticado, capturar solicitud y pasarla al handler registrado: Authorization Bearer, cuerpo message y devolución id. Sin usuario/token no emitir solicitud ni escribir. Resolver mecanismo vigente antes de implementar.
A3: autenticar antes de persistencia; inválido400, almacenamiento ausente503 después de auth satisfactoria, fallo de escritura500 sin éxito, válido200 {success:true,id}. clientId/businessName del runtime, ignorar campos ajenos. Preservar sanitizado/límite5000 y sender/status.
A4: mutar decisión de autorización o transporte del token en copia aislada: debe fallar por rechazo/efecto indebido, no por importación. Caso válido y adverso sobre la versión final.
A5: tipos pertinentes, paridad y regresión book sólo si cambia superficie que invalida evidencia; fuentes/copia iguales, trabajo ajeno preservado.

Pruebas de handler/consumidor previstas dentro del aislamiento Docker N02 existente (imagen fijada, sin red ni credenciales, RO, límites y disposición de book-v1); inspeccionar arnés antes de usar. No ejecutar bootstrap con entorno real. Firestore simulado sólo prueba contrato local, no reglas/atomicidad/remoto.
Custodia: guardar bytes y huellas antes de cada escritura sobre archivo existente. Sin commit/push/deploy. Reversa: restaurar sólo preimágenes propias tras comprobar que no hubo escritura concurrente.

## Refutación pendiente
Revisor independiente en lectura: consumidor y autorización, mecanismo existente y riesgo de falso GREEN por agregar sólo ruta. BLOCKER: aceptación que no ejecute consumidor+handler; MATERIAL: falta de token y tenant ajeno; NON-BLOCKING: otras rutas fuera del recorrido conservadas en N03. No implementar hasta contrato viable, refutado y congelado. Al alcanzar69%, STOP y retoma del mismo ID, sin resets.
Refutación y precisión de controles: ver REVISION.md. A2 conecta consumidor y handler con transporte simulado; no promete HTTP real en esta preparación.
