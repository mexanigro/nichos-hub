# D05 — política aprobada, preparación local

Procedencia: mensaje de Liam en esta tarea, 2026-09-09. AI_ENABLED y AGENT_ENABLED son permisos independientes del entorno servidor del tenant. Sólo `true` exacto habilita; ausencia, false y cualquier otro valor deniegan. Credenciales, navegador, cuerpo, query, preferencias y configuración pública no autorizan. La base nueva carece de ambos permisos.

Antes de desplegar: presentar tenants y servicios que deben conservar prestaciones, evidencia y decisión de Liam sobre excepciones. No inferir compromisos de claves ni planes históricos. Esta condición no bloquea construir localmente.

Plan finito actualizado: P0 contrato ejecutable, refutado y congelado; P1 controles compartidos de IA/agente en server.ts, api/index.ts y notify-agentkit.ts, conservando orden de protecciones; P2 recorridos reales aislados, notificaciones y mutación; P3 tipos, paridad, revisión de claridad/conservación y registros. Total cuatro gates. Sin producto hasta P0.

Contrato C1: permisos ausentes, false, TRUE, ` true ` e inválidos, con/sin credenciales sintéticas: cero intentos IA/agente; visitante no autoriza. C2: cada permiso exacto true habilita sólo su servicio; configuración incompleta no produce éxito del servicio; dependencias simuladas permiten resultado positivo. C3: contacto persistido, reserva confirmada y notificaciones de reserva/CRM booked-cancelled-rescheduled conservan resultados base y notificaciones incluidas sin agente. C4: rutas opcionales directas no eluden permisos; auth/origen/cuota/tenant existentes siguen efectivos. C5: proceso completo de ambos runtimes en Docker sin red, entorno vacío sin .env, observador positivo y guard desarmado sólo en copia. C6: tipos con vite-env, paridad y regresiones afectadas; preimágenes y entregas aceptadas conservadas. Los dobles de DB/proveedores no certifican persistencia remota ni entrega real.

Refutación independiente recibida de /root/refutar_soporte (Harvey), revisión de esta continuación: MATERIAL probar valores exactos e independencia; resolver canales base antes de cache/config; observar destinatario/evento y esperar efectos fire-and-forget; acotar población a contacto/reserva/CRM sin afirmar reminder/staff completos; verificar protecciones en habilitado y denegado. Incorporados en C1-C6. No freeze todavía: completar contrato ejecutable y comprobar conexiones base.

Hallazgo material al cerrar población: appointment-notify-client no envía token ni define customerEmail; sus consumidores reales envían teléfono y omiten email. server.ts exige auth en esa ruta. Además el documento creado por booking-handler conserva serviceId, mientras notify-booking de server.ts exige serviceName/service. No se debe fabricar un email ni enriquecer fixtures para ocultar estas desconexiones. Determinar reparación mínima o límite de alcance antes de freeze. No tocar las entregas aceptadas para hacer pasar evidencia inventada.

Presupuesto checkpoint: 72% de 74% TOTAL N03; sin resets.
