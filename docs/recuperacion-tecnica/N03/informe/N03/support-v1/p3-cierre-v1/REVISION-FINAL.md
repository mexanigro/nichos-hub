# P3 — revisión final y procedencia del contraste

Autorización: mensaje directo de Liam en esta conversación, continuar support-v1 desde P3, agregar únicamente la declaración Vite al arnés y completar validaciones/revisión sin cambiar producto/contrato ni ejecutar remoto. Es continuación del mismo ID tras STOP; no reinicio del reconocimiento.

Procedencia del segundo contraste integrado: agente interno independiente `/root/refutar_soporte`, de esta misma conversación. Entregó refutación preparatoria y volvió a revisar claridad/alcance de producto frente a las cuatro preimágenes durante P3, exclusivamente en lectura. No se presenta como segundo pensamiento externo de Liam: no se recibió aquí una revisión externa adicional. Su opinión no sustituye evidencia ni autorización.

Refutación preparatoria y resolución:
- 503 requiere auth satisfecha; lookup de permisos puede denegar403 sin DB. Contrato y comportamiento conservados, control local condicionado explícitamente.
- Firebase auth puede ser nulo; consumidor debe detenerse sin usuario/token o ante fallo. Casos del contrato conservados.
- VM podría esconder imports faltantes o dejar lógica inline. Contrato incluye imports reales de auth/factory y ambos registros; tipos P3 resolvió fuentes reales incluyendo declaración Vite.

Devolución final interna recibida: BLOCKERS ninguno; MATERIAL ninguno demostrado. Factory usada por ambos registros; cuatro dependencias consumidas; sin funciones, ramas o campos muertos añadidos. Auth antes de almacenamiento, sanitizado/límite5000, errores y campos originales preservados. Tenant del runtime. Consumidor usa auth real y falla sin enviar si falta token. Diff limitado a extracción/registro de soporte, autenticación del consumidor y retirada de la única excepción soporte. /api/book y otras excepciones no modificados.

Comprobación del integrador: lectura completa de support-handler.ts y support.ts; diff completo de los cuatro archivos frente a preimágenes; confirmación del único nuevo módulo y de sus usos. No cambios de producto en P3. ProviderMessageStatus ya era un import sin uso antes de soporte: NON-BLOCKING preexistente, no se introduce ni se corrige para ampliar alcance. Nombres/docstring del módulo nuevo describen su contenido real; dependencias sólo de tipos en importación. No quedan soluciones temporales de producto ocultas.

Cinco pasadas sobre la versión final: implementación previa conservada; medición29casos+mutación previa por huellas y tipos/paridad nuevos; lectura de módulos y diff; auditoría independiente e integración por fuentes; revisión de prosa que distingue mocks/cuerpos reales de HTTP/bootstrap/SDK/remoto. Sin BLOCKERS para el cierre local de esta entrega.

Límites: no probaron autenticación criptográfica Firebase, permisos remotos, HTTP alojado ni persistencia real. Siguen en etapas N04/N06/N10 y no forman parte del contrato local congelado support-v1. N03 general continúa en curso.