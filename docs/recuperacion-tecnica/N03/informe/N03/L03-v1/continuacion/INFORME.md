# L03 — preparación local para revisión

Premisa aprobada por Liam: conservar D05; sin agente, los cinco avisos base por email se mantienen aunque los toggles estén apagados. No autorizó revisar su supresión. Esto resuelve la decisión previa, cuyo expediente permanece histórico.

## Efecto comprobado

| Control | Efecto del editor | Efecto en los cinco canales incluidos |
|---|---|---|
| Notificaciones habilitadas | Cambia notifications.enabled del estado y payload PUT | Ninguno observado |
| Alertas de reserva | Cambia notifications.bookingAlerts del estado y payload PUT | Ninguno observado |
| Consultas de contacto | Cambia notifications.contactInquiries del estado y payload PUT | Ninguno observado |

ToggleField real representa ausencia como apagado; un click la convierte en true. Los defaults existentes de configuración nueva son true. No se propone cambiar esa política de datos. Nueve casos de ToggleField/updateNested/handleConfirmedSave reales, extraídos por AST: tres flags x ausencia/false/true, click y captura PUT sin envío real. Se conservan channels y hermanos en el payload.

## Matriz y alcance de prueba

Los getChannelConfig actuales de server.ts/api/index.ts se extrajeron por AST y comprobaron idénticos a sus funciones en la copia aceptada D05. Se reutilizó fixture-recorridos.mjs de D05 para la frontera Admin en memoria; la frontera REST entrega el mismo mapa sintético como fields. Resolución de canales y política base son módulos reales actuales. No se modifican funciones para introducir lecturas de flags.

27 combinaciones de true/false/ausencia para los tres toggles x2estados de agente x2selectores =108casos. Por caso se inspeccionan los cinco eventos y lectura de configuración: sin agente, cero lecturas de preferencias; con agente, una. Fixture D05 con new_lead_owner/new_booking_owner=both y defaults de cliente=whatsapp:

| Evento / destinatario | Sin agente, cualquier combinación | Con agente, cualquier combinación |
|---|---|---|
| Confirmación / cliente | email | whatsapp |
| Cancelación / cliente | email | whatsapp |
| Reprogramación / cliente | email | whatsapp |
| Nuevo contacto / dueño | email | both |
| Nueva reserva / dueño | email | both |

Los resultados con agente reflejan esa configuración sintética, no una política obligatoria de WhatsApp. Cuatro controles positivos adicionales cambian channels a email: con agente el selector cambia; sin agente continúa email. Esto demuestra sensibilidad a canales y evita confundir un selector constante con falta de efecto de toggles.

[Resultado crudo](resultados-r2/RESULTADO.json), [comando](COMANDO-r2.json), [exit0](resultados-r2/EXIT.json), [instrumento](sondeo.mjs). R1 tuvo un error sintáctico instrumental, no un RED de producto; fuente previa/stdout/stderr preservados. Se corrigió la construcción del fixture REST y r2 completó108+4+9 casos sin modificar expectativas ni producto.

Se reutilizan los recorridos HTTP y observación de destinatario/evento aceptados de [D05](../../D05-v1/INFORME.md), sin repetirlos ni alterar su aceptación. Esta corrida nueva prueba selectores y fragmentos reales del editor, no HTTP completo, navegador montado, DB, entrega, cache caliente/TTL, reglas o persistencia. Por eso se afirma «sin efecto observado sobre estos cinco canales», no inutilidad universal de los flags ni entrega certificada.

## Resultado y gates

P0 premisa D05 resuelta/alcance fijado; P1 matriz y efecto UI caracterizados; P2 contraste y propuesta mínima; P3 evidencia/registros/conservación. Preparación4/4 para revisión; producto sin cambios y L03 no descontada. [Propuesta concreta](PROPUESTA.md). No se necesita ni se propone reparación de envío: sólo retirar una promesa interactiva no respaldada en esta superficie.

N03 abierta, entregas aceptadas conservadas. Etapas posteriores y condición de prestaciones por tenant antes del despliegue vigentes. Consumo inicial84%/techo85% TOTAL compartido,sin resets,instalaciones,efectos externos,push/deploy.
