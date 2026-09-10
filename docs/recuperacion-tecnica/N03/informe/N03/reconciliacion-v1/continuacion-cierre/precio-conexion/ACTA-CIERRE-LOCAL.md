# Acta de cumplimiento local N03

Resultado técnico: **GREEN local**. La autoridad de precio aprobada por Liam elimina el último impedimento funcional local del balance: reserva → agenda → checkout atraviesa los middleware de ambos runtimes y utiliza el importe escrito por la reserva real. No se declara despliegue ni certificación operativa de etapas posteriores. Publicación Git sigue condicionada a no desplegar.

## Alcance y evolución

Único archivo de producto modificado en este tramo: template src/lib/api/booking-handler.ts. Preimagen física booking-pre.source y FREEZE.json. Antes book omitía precio y checkout rechazaba400. Ahora lee config/{CLIENT_ID} con el mismo db backend, resuelve serviceId único y visible en services, aplica serviceOverrides.price explícito con la precedencia del consumidor vigente y guarda priceCents dentro de la escritura de reserva existente. Precio numérico finito, precisión de unidades menores y límites vigentes del checkout; no toma price/priceCents del body. Reserva online no verificable rechaza antes de transacción/reserva/alta cliente. Config inexistente/error no se convierte en un positivo. Cash/nononline conserva reserva sinprecio. No cambios retrospectivos ni migraciones.

El catálogo debe permitir verificar servicio y precio en config backend. La ausencia de services materializados no se suple con presets del navegador ni con importes del visitante; produce rechazo autorizado. Esto es un límite deliberado de seguridad, no una certificación del catálogo de tenants reales.

## Gates y evidencia

P0 reconocimiento acotado, contrato y refutación: sólo conexión de precio pendiente, fixtures de catálogo enconfig, nunca precio insertado en cita. Oráculos fijados:15000total,2500seña,17500override; intento browser1/99999999 no gobierna. RED78casos452checks100fallos sobre preimagen.
P1 reparación mínima: un handler compartido. Condición de online por configuración, errores previos a efectos, arrays/visibilidad/duplicados, precedencia sin fallback de overrideinválido. Guardas, middleware, validación/reserva/transacción previa conservados.
P2 GREEN78casos452checks0fallos; mutante remove-book-price RED60/452. Tipos/lint template tsc --noEmit exit0. Archivo de checkout, seña/moneda/Cardcom y los dosruntimes sin modificación; pruebas anteriores pertinentes reutilizadas por huellas, no suites repetidas.
P3 conservación, revisión independiente y contraste de balance. CONSERVACION.json verifica las10fuentes del pipeline anterior: sólo booking-handler difiere;40huellas seleccionadas/ajenas iguales. FREEZE inmutable. Revisión independiente en ACTA-REVISION.md. Los resultados identifican las versiones exactas en sourceHashes; el commit posterior no reemplaza esas huellas.

## Cinco ángulos

- Obligaciones: se contrastan las siete filas del balance abajo, sin crear otro inventario o transferir trabajo local.
- Aritmética:39casos×2runtimes=78;452comprobaciones. Los48casos previos mantienen expectativas;30adicionales cubren precio/catálogo/manipulación/conservación. No se cuenta la cita prepreciada como reserva nueva.
- Fuentes: handler y middleware/SDK/accessors reales; preimagen, contrato congelado y SHA256. Config backend fixture, I/O interceptado. El mutante sólo modifica código enmemoria.
- Consumidor: HTTP Express con seis middleware aplicables enorden, reserva→GET/PATCHmisma cita→checkout, destinos iguales/separados y autorización real sintética. Importe decheckout procede de priceCents producido porbook.
- Sensibilidad: quitar conexión provoca RED60; no se redefine expectativa200a400. Bypass de guarda y rechazo indiscriminado mantienen evidencia vigente de24y52fallos adicionales/nuevos del corte anterior, con fuentes sin cambios. Se reutilizan.

## Condiciones originales y balance vigente

| Obligación | Evidencia vigente y resolución local |
| --- | --- |
| RE-EXT-02/03, RE-01, AR-N01: contratos efectivos/destinos | Contratos aceptados2Admin+3REST y métricas; autorización Auth navegador/membresía backend y agenda histórica pororigen; pipeline con middleware acredita acceso y acción. Precio ahora completa checkout de la misma cita, sin unificar destinos. |
| L02/L12,D03/D04: patches/config/SAFE/consumidores | L02aceptada; L12/SAFE/merge y recorridos efectivos adjudicados. Sin cambio actual en esos archivos ni nuevo defecto invalidante. |
| H01/ES-A: promesa idioma | Fallback visible y consentimiento anterior, SSR5idiomas/mutación conservados; no se promete traducción inexistente. |
| D05/D13/NOT-A: base sin agente/avisos | D05cinco avisosbase y L03aceptados, desacople/consumo cero en población local; E-NOT01/digest y delimitación ya adjudicados. No se agregan IA/WhatsApp ni llamadas externas al libro de reservas. Compromisos y entrega real conservan sus responsables originales. |
| L04/L08/COB-A: coherencia cobro | Precio autoritativo nuevoGREEN; seña/modo/moneda delbackend y credenciales anidadas verificadas previamente, providerinvalid/manual/none preservados; Cardcom bloqueado por decisión, sin presentarlo operativo. Ya no queda pendiente la decisión o la conexión del precio. |
| Excepciones hermanas/paridad,D02/D14 | Book/support/stock/health aceptados y población deexcepciones HTTP adjudicada; último recorrido ejercita ambosruntimes con carga/orden middleware real. No se usa sólo igualdad de nombres. |
| H07: recepción/instrucciones | Nueve documentos adjudicados y garantías falsas corregidas/custodiadas; no se hereda readiness global. No nueva auditoría ni cambios ajenos. |

Conclusión del contrato local: las obligaciones originales de N03 sobre contratos base, configuración/habilitaciones y coherencia local de runtimes quedan acreditadas en las poblaciones adjudicadas. No quedan BLOCKERS locales identificados. Los permisos/reglas/identidades reales, transacciones/concurrencia end-to-end remotas, entrega/cobro/webhooks operativos y publicación/monitor son verificaciones que ya pertenecían a N04–N10; no se mueve hacia ellas el precio local ni otro pendiente para cerrar. Cardcom continúa explícitamente bloqueado, conforme a la política aprobada.

## Límites y publicación

No se ejecuta startup completo alojado ni se accede a Firebase/proveedores/notificaciones reales. Sin instalaciones, migraciones, ramas/worktrees ni efectos externos. La moneda y prestación efectiva de cada tenant requieren la condición predespliegue vigente. No hay afirmación de funcionamiento comercial universal, IAM remoto o cobro real.

Push NO EJECUTADO mientras no se acredite que las integraciones Git no despliegan: Vercel conectado y desactivación no verificada; Railway tampoco. No se cambia hosting ni se presume skip-ci suficiente. El cierre técnico local no da permiso de deploy. Commits propios y custodia se registran separadamente.

Presupuesto observado97%, técnicohasta99; último1%reservado para commit/push, sin resets. No se cerró por cuota: se cerró la conexión que mantenía RED y se contrastó el balance.

RESULT: GREEN local N03
TASK: condiciones originales locales de N03
GATES: P0→P1→P2→P3,4/4
TESTS:78casos452checksGREEN; mutanteRED60; tipos0; conservación/revisión
BLOCKERS: ninguno técnico local; publicación bloqueada por condición no-deploy sin acreditar
CHANGES: conexión de precio enhandler compartido; balance/custodia/acta
REMAINING: publicación condicionada; etapas posteriores y prestaciones por tenant intactas
