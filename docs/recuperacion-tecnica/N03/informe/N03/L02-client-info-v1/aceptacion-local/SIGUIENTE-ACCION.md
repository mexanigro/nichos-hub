# Única siguiente acción propuesta — preparar contrato local L03

**Preparar, tras autorización, el contrato de los tres toggles existentes de notificaciones: notifications.enabled, bookingAlerts y contactInquiries, frente a sus consumidores y canales.** Una causa y una preparación coherente desde L03/D13/NOT-A del [balance vigente](../../reconciliacion-v1/BALANCE.md); no reconstruir la auditoría ni implementar ahora.

La lectura acotada confirma que el editor hub muestra esos tres controles (`src/components/client-config-tab.tsx`:1138–1140), mientras las selecciones examinadas de server.ts/api/index.ts del template leen notifications.channels. Además, D05 aceptado mantiene email base antes de preferencias cuando AGENT está deshabilitado. Son fuentes existentes de L03, no un nuevo diagnóstico de entrega remota ni prueba de que cada toggle deba bloquear todo email.

## Obligación y resultado mínimo

Obligación local pendiente: establecer y conectar, cuando corresponda, la promesa de los controles visibles con los avisos de contacto/reserva ya presentes. No confundir preferencia del cliente, selección de canal y permiso servidor de IA/agente.

Resultado concreto de la siguiente preparación: matriz fija toggle→evento→destinatario/canal en los recorridos ya cubiertos por D05, distinguiendo true/false/ausencia y agente habilitado/deshabilitado; contrato compatible, reproducción local pertinente y propuesta mínima de conexión con controles de conservación/sensibilidad. Reutilizar editor, selección de canales y arnés D05, DB/entrega simuladas. No ampliar a reminders, scheduler, staff futuro, proveedores ni todos los eventos NOT.

**No fijar RED como “toggle=false y hubo email base”.** D05 aceptado requiere esa base antes de preferencias con agente off. Primero contrastar la promesa del editor y las políticas vigentes; si requiere cambiar esa política, detener ese punto y pedir decisión a Liam antes de congelar o proponer una implementación que la contradiga. No convertir ausencia de lectura de un flag en prueba de defecto de una rama aceptada.

Para descontar posteriormente la parte local L03: contrato explícito y aprobado; GREEN del recorrido real local de los eventos incluidos demostrando la conducta prometida para cada toggle y ausencia de supresiones indebidas; mutación del control efectivo devuelve RED atribuible. Preservar D05/permisos servidor, autenticación, tenant, límite, persistencia de la operación principal y destinatarios, con cero efectos externos. La preparación por sí sola no descuenta L03 ni certifica entrega remota.

Superficie de preparación prevista: componente existente del hub, getChannelConfig/resolución de canales y consumidores de contacto/reserva ya identificados en server.ts y api/index.ts del template, src/lib/notification-channels.ts y controles D05 existentes. Las rutas de producto a modificar no se autorizan ni se fijan sin ese contraste. No crear framework general, nuevos canales, migraciones o redes reales. Ninguna ejecución L03 en esta continuación.

Refutación interna independiente /root/refutacion_wnext: selección válida desde el balance; incorporado MATERIAL sobre compatibilidad con email base aceptado en D05. Sin BLOCKER para proponer la preparación. No revisión externa ni decisión sustitutiva de Liam.

L02 de POST client-info aceptada sólo local y descontada; resto L02/L01/L12 y N03 abiertos. Etapas posteriores y condición de prestaciones por tenant antes del despliegue conservadas. Techo85% TOTAL compartido,sin resets,instalaciones,efectos externos,push/deploy.
