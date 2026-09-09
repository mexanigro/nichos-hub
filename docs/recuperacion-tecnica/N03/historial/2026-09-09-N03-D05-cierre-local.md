# N03 D05 — cierre exclusivamente local

Política aprobada por Liam en esta tarea: AI_ENABLED y AGENT_ENABLED independientes, administrados exclusivamente en el entorno servidor del tenant. Sólo true exacto habilita. Ausencia/false/valor inválido deniega aunque haya credenciales; navegador, petición, preferencias públicas y canales no autorizan. La base nueva mantiene ambos deshabilitados. [Contrato congelado](../informe/N03/D05-v1/FREEZE.md), [huellas](../informe/N03/D05-v1/CONTRATO-CONGELADO.json), [revisión y procedencia](../informe/N03/D05-v1/REVISION-FINAL.md).

## Resultado y gates

P0: reconocimiento previo reutilizado, política aprobada, contrato ejecutable RED, refutación incorporada y freeze antes de producto. P1: seis archivos, controles y conexiones mínimos, tipos0. P2: contrato222/222, observador y mutación sensibles. P3: salud21/21, paridad3/3, auditoría13/13, revisión y registros. Sin BLOCKERS locales. N03 completa sigue en curso.

Permisos compartidos protegen analyze/chat/action/upload y salidas al agente sin desplazar auth, origen, cuota ni tenant. Sin agente, los cinco avisos base examinados usan email antes de cache/preferencias. Con agente habilitado se preservan canales anteriores. El helper CRM transmite token y el email existente; cancelación/reprogramación conservan ese dato. Notify-booking local admite serviceId del documento como respaldo del nombre, conservando destinatario y control tenant persistidos. Book-v1, support-v1, stock-v1 y health-v1/SP-H01 intactas.

## Acceptance y sensibilidad

- [Server94/94](../informe/N03/D05-v1/resultados/green-server-r1/RESULTADOS.json) y [API94/94](../informe/N03/D05-v1/resultados/green-api-r1/RESULTADOS.json): siete escenarios por runtime; sin claves, claves sin permisos, false, inválidos, IA sola, agente solo e incompletos. Arranque completo, salidas simuladas contadas, directo/visitante, auth401, tenant403, origen403, límite429 antes del proveedor, contacto/reserva/CRM y observador. Configuración incompleta produce503 IA y agentNotified=false; no éxito ficticio del servicio.
- [Consumidores34/34](../informe/N03/D05-v1/resultados/green-base-r1/RESULTADOS.json): reserva/commit simulado/documento real del handler, notificación posterior, email al dueño/cliente, helper CRM transp compilado→HTTP→runtime real, evento/destinatario de booked/cancelled/rescheduled, callers por AST y walk-in sin email. [Auditoría13/13](../informe/N03/D05-v1/AUDITORIA-FINAL-r2.json) añade persistencia controlada de contacto, ausencia/fallo de token sin solicitud y conservación física.
- [Mutación](../informe/N03/D05-v1/resultados/mutacion-permisos/RESULTADOS.json): sólo predicado de permisos desarmado en copia aislada;11PASS/18FAIL esperados. Ambos servicios consumen sin permiso y el contrato lo detecta en ambos runtimes; auth/tenant/origen/cuota siguen PASS. Producto no mutado.
- [Regresión salud21/21](../informe/N03/D05-v1/resultados/health-protecciones/RESULTADOS.json): límite configurable antes de sonda, HEAD comparte cuota, exceso sin nueva carga/lectura, live sin cuota/DB. Bootstrap incompleto/fallido y demás evidencia de health conservados por huella/cuerpos AST sin repetir lo vigente.
- [Tipos0](../informe/N03/D05-v1/resultados/TIPOS-P1-r2-ESTADO.json), incluye Vite desde el inicio sin relajar opciones; [paridad3/3](../informe/N03/D05-v1/resultados/PARIDAD.txt), ninguna excepción nueva. No son la suite completa de paridad.

Cada corrida conserva stdout/stderr, exit, timeout y disposición. Todos los positivos finales exit0 sin timeout; mutación exit1 esperado. Docker con imagen local fija, network none, filesystem readonly, entorno vacío y datos/credenciales sintéticos. Cero operaciones remotas reales. Los mocks no certifican transacciones/persistencia remota, entrega real ni navegador completo.

## Rojo conservado y trazabilidad

[Rojo previo](../informe/N03/D05-v1/resultados/d05-sondeo-origen/RESULTADOS.json)13PASS/4FAIL prueba intentosGemini con claves. Matriz inicial96PASS72FAIL y base inicial14PASS6FAIL incorporaron agente y desconexiones reales. Base refinada19PASS15FAIL conserva emails/argumentos por evento antes de producto. La corrida con Content-Type duplicado es instrumento inválido, conservado y corregido antes del freeze. Auditoría inicial confundía lecturas generales de config con preferencias; r2 verifica orden AST y no altera el contrato ni producto. [Conservación](../informe/N03/D05-v1/CONSERVACION-P3.json), [332 fuentes finales](../informe/N03/D05-v1/FUENTES-FINALES-r2.json), [preimágenes](../informe/N03/D05-v1/PREIMAGENES-PRODUCTO.json). HEAD46345f4505756599d69ae6cbc9d588271aba6b65 sin cambio.

## Condición de despliegue y continuidad

Antes de desplegar, presentar qué tenants y servicios deben conservar prestaciones, evidencia y decisión de Liam sobre excepciones. No inferir compromisos de claves o planes históricos; no se clasificaron ni modificaron entornos reales. Walk-ins sin email mantienen operación; no se inventan destinatarios ni se promete notificación al cliente por otro canal. No se añadieron canales comerciales, precios, facturación o provisioning.

Entrega D05 local cerrada; N03 conserva sus otras obligaciones y validaciones de etapas siguientes. Consumo observado72%, techo TOTAL74% para TODO N03, sin resets ni nuevo pedido de presupuesto. Sin instalaciones, remoto, commit, push o deploy. La preparación histórica se conserva en preimágenes/cierre-01.

[Informe canónico](../informe/N03/D05-v1/INFORME.md).
