# Revisión independiente — conexión de precio y cierre local N03

2026-09-10. Revisor: `refutacion_wnext`. Sólo lectura de producto, diff, contrato, instrumento, resultados y balance vigente; sin ejecutar suites nuevas. Esta acta sucede al bloqueo de precio consignado en `integracion-final/ACTA-REVISION-FINAL.md`, que se conserva como evidencia histórica.

**Conclusión: sin BLOCKERS técnicos identificados en la reparación autorizada ni en la disposición local de las siete filas revisadas.** El impedimento concreto book→checkout queda resuelto localmente, sujeto a registrar la decisión y el resultado en el balance/retoma. No equivale a certificación operativa ni aceptación nueva del usuario de cada familia.

## Cambio, efecto y conservación

El diff frente a `booking-pre.source` añade únicamente la lectura del catálogo `config/{clientId}` desde el mismo Admin SDK y la asignación de `priceCents` a los campos de la reserva. El precio del body no participa. Para pago online se exige servicio único, permitido por la lista de visibilidad y precio numérico representable dentro de los límites; un override explícito tiene prioridad y no cae silenciosamente al precio base si es inválido. El rechazo precede a `createBookingWithManifest` y al alta de cliente. No se reescriben citas históricas. La reserva no online conserva la ausencia de precio asignado por esta lógica.

El instrumento incorpora catálogo en config; no inserta precio en las citas creadas por el recorrido. Observa el precio persistido por book, lee y modifica la misma cita por CRM y la entrega al checkout real. Las citas `prepriced` siguen siendo una población separada para controles de política/destinos. Se conserva la distinción entre esa población y la reserva nueva.

Resultados leídos: RED previo **78 casos / 452 controles / 100 fallos**; GREEN final **78 / 452 / 0**; mutante que omite exclusivamente la asignación del precio **78 / 452 / 60 fallos**. El mutante verifica el efecto de la conexión, no sólo el aspecto del código. Tipos exit 0 registrado. No repetí estas corridas.

Custodia: `CONSERVACION.json` y su script comparan las diez fuentes del pipeline anterior y encuentran sólo `src/lib/api/booking-handler.ts` cambiado; preservan cuarenta entradas de selección/archivos ajenos. No se utiliza el conteo informal anterior de diecisiete archivos. Verificación independiente de lectura/huellas en `REVISION-HUELLAS.json`: diez fuentes del GREEN vigentes, diez fuentes del manifiesto final de integración sin cambios y tres objetos congelados idénticos. Estos conjuntos se solapan y no deben sumarse como población de archivos únicos.

## Contraste con las siete filas del balance

| Familia vigente | Disposición de esta revisión |
|---|---|
| Proyecto/base y conexión de agenda | Conserva evidencia de middleware real, autoridad backend, lectura/acción de la misma cita y controles de identidad; no exige unificar navegador/backend. |
| L02/L12, D03/D04 | Reutiliza reparación/aceptaciones y población local ya adjudicadas; el cambio de book no altera escritores, merge/SAFE ni el consumidor visual. |
| H01/ES-A | Banner y límites lingüísticos permanecen; ninguna modificación en esta reparación. |
| D13/NOT-A | Conserva corrección de promesa visible y disposición de avisos ya adjudicada; no afirma entrega ni decide oferta comercial digest. |
| L04/L08, COB-A | El único bloqueo local expreso del balance, autoridad/conexión del precio, tiene decisión nueva y evidencia GREEN sensible. Cardcom permanece bloqueado por decisión; cobro/webhooks reales siguen en su etapa, sin atribuirlos a este GREEN. |
| Excepciones de paridad | Conserva caracterización y mutaciones existentes; no se amplían las afirmaciones de disponibilidad o routing alojado. |
| H07 recepción | Conserva las nueve disposiciones documentales y sus límites; no convierte documentos históricos en contratos operativos. |

No se abrió nueva auditoría ni se transfirió una reparación local pendiente a una etapa posterior para simular cierre. La tabla vigente ya tenía las restantes seis filas acreditadas/dispuestas localmente con sus límites; esta revisión no vuelve a aceptarlas ni repite pruebas.

## Hallazgos y condición documental

- **BLOCKER técnico:** ninguno identificado en el alcance revisado.
- **MATERIAL documental antes de declarar cierre:** el BALANCE leído aún afirma que Liam dejó pendiente la autoridad, prohíbe modificar book y mantiene dieciséis fallos. El integrador debe sustituir ese estado vigente por la nueva decisión, el cambio autorizado y este resultado, preservando las preimágenes. No borrar el RED histórico ni presentarlo como vigente.
- **Límites conservados:** HTTP/SDK local con almacenamiento, certificados y proveedor interceptados; no prueba servicio remoto, IAM/rules, concurrencia, importes históricos, renderer completo, webhook ni cobro real. El catálogo backend debe existir para habilitar esa reserva online; su ausencia se rechaza y no se suple con preset del navegador. Etapas posteriores y condición de prestaciones/tenant antes de despliegue intactas.

Recomendación: integrar esta revisión y los resultados en el cierre local N03, una vez actualizados balance/retoma/custodia. No hay motivo técnico nuevo, dentro del alcance revisado, para mantener como pendiente la conexión local del precio. Push/deploy quedan sujetos a sus autorizaciones y garantías separadas.
