# N03 — integración de agenda y cobro, corte local para continuar

## Resultado y condición original

N03 sigue **RED / ABIERTA**. La decisión de identidad cruzada quedó aprobada e implementada; los handlers y consumidores locales ya conservan las dos fuentes y acciones por origen. **La conexión alojada completa no está resuelta**: un middleware anterior al handler en Vercel rechaza los proyectos separados. No se descuenta esa obligación por sus controles aislados GREEN.

Las decisiones de seña, bloqueo Cardcom y precedencia de credenciales quedaron aprobadas y reparadas localmente. Desaparecen los defectos demostrados de seña gobernada por request/importe total y mapa de credenciales no consumido. Esto no cierra COB-A: falta disposición de controles sin efecto, fallback de proveedor, promesa visual y conexión de destinos previa a pagos. Cardcom queda explícitamente bloqueado; no certificado como proveedor operativo.

## Autorizaciones integradas

- Identidad: proyecto Auth navegador configurado por servidor, firma/issuer/aud/vigencia, email verificado ligado a admin_users backend del tenant y rol. Sin alta automática ni fallback de emisores tras rechazo. No implica que toda identidad browser tenga acceso backend.
- Lectura/acciones: backend fuente de citas que crea /api/book; históricas navegador permanecen allí. Referencia origen+ID, sin migrar/copiar/fusionar documentos. Coincidencia física deduplica sólo la segunda representación del mismo documento; browser conserva prioridad operativa de filas presentes en ambas lecturas.
- Cobro: modo/seña desde config tenant, entero en unidades menores, rango y <=total. Sin 2000 ni cobro total como fallback del servidor. Cardcom sin mapeo demostrado se rechaza antes de resolver gateway. Credentials presente autoritativo, legacy sólo ausente, apiName independiente.
- Orden único de cierre: agenda/autorización → cobro → revisión integrada del BALANCE y acta. Techo100% TOTAL, últimos2puntos reservados; última observación93%. Sin resets, instalaciones, efectos externos,push/deploy,ramas/worktrees.

## Evidencia nueva y límites

| Obligación | Resultado local | Límite que permanece |
|---|---|---|
| Identidad cruzada | Auth real RSA:38casos65checks GREEN; mutante issuer RED2. Lookup real ambos runtimes26casos130checks GREEN, tenant/rol/status; registros110checks GREEN. | Certificados/token sintéticos; sin FirebaseAuth/IAM/rules remotos ni revocación real. |
| Conexión y acciones | Book real + Admin SDK/namespace, handlerHTTP:34checks GREEN; guarda tenant desarmadaRED2. Servicio/callbacksUI:34GREEN; origen desarmadoRED1, dedup incorrectaRED4, quitarhistóricoRED6. | OperacionesDB/transportes interceptados. HTTP del contrato básico registra handlers; no incluía middleware global. |
| Conservación visual | Calendar real SSR4checks; banner JSX real3checks. Etiquetas de origen, errores porfuente/datos sin actualizar. | No montaje completo navegador, drag DOM ni certificación CRM/métricas completas. |
| Pipeline previo Vercel |14checks de caracterización válidos: coincidenteHTTP200; proyectos separados503 antes de auth/lecturaCRM. | **Bloqueo funcional real**. Estado clients/{tenant} sigue seleccionando VITE y guarda contradicción; requiere decidir autoridad/ruta antes de modificarla. |
| Credenciales | Editor→PUT real→serializaciónSDK→dosloaders:22recorridos37checks GREEN; mutante volveralplanoRED16. | Representación/conservación, no permisos reales ni compatibilidad física de credenciales en proyectos separados. Builders y caché previos conservan bytes como prefijo exacto. |
| Seña/Cardcom |23casos366checks GREEN en ambos registros reales; mutantes importeRED6/modovisitorRED146/CardcomsinbloqueoRED6. | Gateway interceptado. No mapeoCardcom, cargo, webhook o conciliación real. |
| Tipos/lint | tsc hub y template exit0. Linteditor1error antes y1después, mismo efecto de fetchCredentials desplazado6líneas; no error nuevo. Template lint es tsc. | Error heredado react-hooks/set-state-in-effect no reparado; runner de comparación literal exit1 por números de línea, no se presenta lint global limpio. |
| Conservación | Censo template337:330idénticos,7modificados autorizados y2archivos nuevos. Hub cambia sólo editor dentro de esta ejecución, con preimagen propia. | No afirmar censo universal fuera del espacio examinado. Entregas aceptadas y código ajeno conservados. |

Fuentes: [ejecución de agenda](contrato-cita-separada/ejecucion/), [pipeline previo](contrato-cita-separada/ejecucion/pipeline-tenant/INFORME.md), [credenciales](credencial/reparacion/CONTRATO.md), [seña/Cardcom](cobro-politica/CONTRATO.md).

## Refutación y causa de omisión

P0 fijó oráculos y RED antes de producto; revisión independiente detectó filtro fijo del instrumento y falta de controles de PATCH/sesión/registro, corregidos antes del freeze. La revisión integrada descubrió una omisión adicional: tanto el diagnóstico heredado como el nuevo HTTP registraban rutas sin ejecutar app.use('/api',enforceClientActive). Esos GREEN no prueban que Vercel alcance el handler con proyectos separados. La nueva prueba ejecuta callback/guard/registro real y muestra bloqueo503; se conserva evidencia anterior con su límite, sin invalidar seguridad aceptada de la guarda.

El resultado es **P0/P1/P2 locales avanzados, P3 de conexión detenido**. No se modifica la guarda para conseguir GREEN. No se cambia su autoridad de estado por inferencia. Esto no es un STOP por presupuesto ni por actividad repetida: falta una decisión de política/superficie sobre un impedimento reproducido.

Correcciones instrumentales preservadas: auth y pipeline tuvieron un error sintáctico preparatorio con preimagen y corrida posterior válida; conexión corrigió interpretación query antesfreeze. Después se reforzó sensibilidad de escritura cruzada y captura de prerrequisitos ausentes en mutantes, sin debilitar expectativas; control positivo final34GREEN. SSR banner requirió exports CommonJS explícito, preimagen/error conservados y7checksfinales. Verificador de conservación corrigió un nivel de ruta antes de dar resultado; primerENOENT no contado como prueba. Cada corrección tuvo información concreta, sin reconstrucción de herramientas.

## Decisiones nuevas solicitadas, no aplicadas

1. Autorizar conexión previa acotada: estado clients del backend para /api/book/agenda y configuración/credenciales de sus pagos desde backend, preservando guardas y destinos navegador. Actualmente callbackestado/proveedor/credentials API usa VITE y contradicción backend rechaza. No retirar guardas ni adoptar documentos automáticamente; definir esa autoridad es distinto de aprobar issuer o lectura de citas.
2. Disposición mínima del pendiente L04 ya adjudicado: retirar acceptCash/depositRequired sin función conservando datos; explicar autoridad payment.mode; proveedor explícito manual/none sinonline, inválido rechaza y legacy sólo si campoausente; quitarfallbackvisual2000. No aplicada sin respuesta. No son otra auditoría ni nueva familia.

Las preguntas fueron presentadas juntas mientras avanzaba lo independiente. Hasta respuesta: congelar producto actual, no implementar esta ampliación ni declarar cerradas agenda/COB-A.

## Qué falta exactamente para cerrar N03

- Resolver la política del middleware/destinos previos y comprobar el recorrido con la cadena completa, conservación de suspensión/archivo/no-verificable y rechazo antesefectos; no repetir diagnóstico base.
- Aplicar sólo la disposición de cobro que Liam autorice; acreditar UI/provider/credenciales/checkout coherentes en el alcance elegido. Cardcom no operativo debe seguir explícito y no convertirse en soporte certificado.
- Revisión integrada de las siete filas del BALANCE, controles pertinentes finales, aceptación/custodia y acta. L12/H01/paridad/H07 y aceptaciones existentes se reutilizan, no se reabren sin evidencia invalidante.
- N04 conserva roles/identidades/reglas/variables reales; N05 manual/CSV; N06/N07 reservas/proveedor/webhook/idempotencia/entrega; N08propagación; N09operación; N10recorridoscompletos. No se traslada a ellas el bloqueo local mostrado. Prestaciones por tenant y decisión antes del despliegue intactas.

RESULT: RED
TASK: cierre completo N03 con balance existente
GATES: agenda P0–P2 locales avanzados/P3 bloqueado; cobro subset aprobado verificado, familia pendiente; cierre original pendiente
TESTS: locales y mutaciones detallados arriba; pipeline separado incompatibilidad503
BLOCKERS: autoridad previa clients/config/credentials y disposición L04 consultadas
CHANGES:10archivos producto (7existentes template+2nuevos+1editorhub), instrumentos/preimágenes/registros
REMAINING: resolver bloqueos, integración y acta; N03 abierta
