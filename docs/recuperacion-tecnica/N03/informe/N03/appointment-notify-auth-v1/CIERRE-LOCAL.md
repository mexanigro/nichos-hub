# N03 appointment-notify-auth-v1 — GREEN local para revisión

## Cambio y resultado

Exclusivamente api/index.ts: añadidas74bytes, las dos instrucciones autorizadas al inicio de POST /api/appointment/notify: requireAdminAuth y retorno si no autoriza. Vercel ahora rechaza antes de procesar acciones o emitir notificaciones, siguiendo el guard existente de server.ts. Autenticador, roles, selectores, mensajes, payloads, canales, límites, tenant y orden global intactos. Ninguna otra ruta modificada.

[Contrato aprobado](PROPUESTA.md), [freeze anterior a producto](FREEZE.json), [preimagen y P1](P1.json). P0→P1→P2→P3:4/4. Reparación GREEN exclusivamente local; se entrega para revisión, sin atribuir aceptación final a Liam. N03 sigue abierta.

## Evidencia final

- [Contrato HTTP](../clientId-v1/resultados/auth-green-p2/RESULTADOS.json):270/270,84peticiones,4arranques efectivos (server/API × agente true/false). Token ausente/inválido401; usuario de tenant ajeno/sin registro/email no verificado403. Sesenta peticiones adversas rechazadas sin efectos observados; doce rechazos adicionales de origen ajeno. Cuerpos genéricos exactos comprobados. Doce positivos conservan request,respuesta,eventos y payloads de referencia por runtime/acción/modo.
- [Referencia vigente](../clientId-v1/resultados/auth-reference-v1/OBSERVACIONES.json): tres exports reales de CRM, booked/cancelled/rescheduled, método POST y Bearer; agente habilitado con identidad/payload/auth correctos y deshabilitado con email base conservado. Se reutilizó la referencia54/54 y el RED original; no se repitió preparación ni suites aceptadas ajenas.
- [Tipos](TIPOS-P2.json):exit0, arnés existente clientId-v1/tsconfig.json con vite-env, sin relajar compilador. [Paridad](../clientId-v1/resultados/auth-parity-p2/PARITY.json):19/19,exit0; sin excepciones cambiadas. La paridad estructural no reemplaza prueba de autenticación.
- [Mutación](../clientId-v1/copia-auth-mutacion/MUTACION.json), [HTTP mutante](../clientId-v1/resultados/auth-mutation-p3/RESULTADOS.json): se retiraron únicamente las dos instrucciones en copia nueva.90fallos esperados (30peticiones API indebidas × status/cuerpo/sin efectos) y180positivos. Los4arranques aprobaron, cero fallos de instrumento. Server y positivos legítimos se conservan. API mutante recupera exactamente la preimagen, producto final permanece protegido.
- [Conservación](CONSERVACION-FINAL.json):333 fuentes finales coinciden con copia GREEN;332 permanecen iguales a preparación y API cambia sólo las dos instrucciones. Copia mutante coincide salvo retorno de API a preimagen. README/.env.example intactos, instrumentos congelados sin cambios. [Manifiesto final](FUENTES-FINALES.json). Ambos repositorios siguen main con un único worktree, sin creación de ramas/worktrees.

Docker: imagen/montajes/dependencias existentes, --pull=never,--network=none,read-only,env saneado y credenciales sintéticas. Preflight integrado comprobó sintaxis/imports/dependencias/fixture antes de cada corrida. ESTADO.json acredita exits0 GREEN/paridad y1 esperado mutación, sin timeout; DISPOSICION.json confirma eliminación de contenedores. Ningún envío real, instalación u operación remota. La ventana local de efectos es150ms con dependencias simuladas inmediatas; no se afirma certificación de latencias o persistencia remotas.

## Revisión y avance por gate

P0: fuentes y Git vigentes, autorización/revisión externa incorporadas, refutación previa conservada, contrato congelado. P1: preimagen física verificada, inserción exacta y copia aislada nueva. P2: contrato270 GREEN,tipos0,paridad19. P3: mutación sensible90fallos,conservación/revisión final y registros completos. Cada ciclo produjo avance material; no hubo fallo del arnés ni reintentos durante esta implementación. Fallos históricos permanecen conservados.

[Revisión interna final](REVISION-FINAL.md) y [revisión externa de preparación trasladada por Liam](REVISION-EXTERNA-PREPARACION.md) separadas. Materiales previos del comparador email y mutador por bytes resueltos antes del freeze; sin BLOCKERS/MATERIAL restantes de esta entrega. Las propiedades declaradas en prosa se verifican por consumidor HTTP y guard desarmado; no se amplían conclusiones a otras rutas.

## Límites y retoma

N03 permanece en curso. Esta reparación local satisface el pendiente de conexión del guard; N04 conserva certificación de identidad/entorno reales y acceso a datos. Sigue vigente la condición previa al despliegue: evidencia de prestaciones por tenant y decisión de Liam. No se modifican compromisos, configuraciones reales, reglas Firestore ni pagos.

Consumo: inicio77%,checkpointP2/cierre78%,techo80%TOTAL N03 compartido,sin resets. Sin commit,push,deploy ni operaciones remotas. Ninguna retoma técnica pendiente de esta reparación; detenerse para revisión. No iniciar otra obligación.
