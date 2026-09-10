# Única siguiente acción vigente — N03

**L02 client-info: preparación GREEN4/4 para revisión; producto RED, NO reparado ni descontado.** Liam autorizó únicamente preparación del endpoint.21escenarios locales con SDK/lector reales, máscaras/transforms capturados sin DB; defecto de claves literales reproducido. Propuesta mínima: mapas anidados explícitos sólo en configUpdate/hubUpdate, sin ramas opcionales vacías ni cambiar defaults. Pendiente autorización de implementación y contrato GREEN/mutación del handler. W-NEXT aceptada localmente y demás entregas intactas. N03 abierta; resto L01/L02/L12, etapas posteriores y condición sobre prestaciones por tenant antes del despliegue conservadas. Consumo82%/techo85% TOTAL compartido,sin resets,push/deploy/externos. Esta adenda sustituye sólo el estado de preparación L02 de los cortes inferiores. [Evidencia y límites](../L02-client-info-v1/INFORME.md). [Solución para autorizar](../L02-client-info-v1/PROPUESTA.md).


**W-NEXT aceptada exclusivamente local y descontada de pendientes N03.** Liam aceptó el renombrado idéntico;revisión externa recuperada de “Supervisar cierre N03 en Nichos” confirma evidencia y limita su conclusión a alcance local. Actas/controles/resultados anteriores se conservan sin reejecutarlos. N03 sigue abierta. Única siguiente propuesta:no implementar ahora;preparar L02 del endpoint client-info,parches con puntos y representación anidada,con defaults actuales y hojas fuera del patch preservados. Resto de L01/L02/L12 y entregas aceptadas intactos. Techo85% TOTAL compartido,observado81%,sin resets,push/deploy. Etapas posteriores y condición de prestaciones por tenant antes del despliegue conservadas. Adenda vigente;los estados inferiores de W-NEXT pendiente/para revisión son históricos. [Aceptación y límites](../W-NEXT-v1/aceptacion-local/ACEPTACION-Y-REVISION-EXTERNA.md). [Única propuesta](../W-NEXT-v1/aceptacion-local/SIGUIENTE-ACCION.md).

## Corte histórico: lint ya aceptado, no ejecutar

# Única siguiente acción propuesta — N03, lint heredado

Defecto comprobado: ESLint instalado, con configuración diagnóstica N02 conservada, reproduce1error no-explicit-any y12advertencias no-unused-vars. Corrida acotada a seis archivos; exit1. No se invocaron handlers, proveedores o Firestore. No afirmar que el GET falla funcionalmente por ese any.

| Archivo hub que cambiaría | Diagnósticos | Consumidor / preservación |
|---|---|---|
| src/app/api/prospects/follow-up/route.ts |1error, Record<string, any> línea41 | GET alimenta src/app/seguimiento/page.tsx:98 y badge de src/components/sidebar.tsx:65. Preservar serialización timestamps, filtros status/pending, orden, campos y withOwner. |
| src/app/api/api-costs/fetch/route.ts |3 argumentos sin uso línea66 | POST de src/app/api-costs/page.tsx:220. Quitar sólo argumentos innecesarios sin ejecutar fetch de costes real ni alterar withOwner. |
| src/app/api/appointments/[id]/cancel/route.ts |import parse sin uso | Contrato PATCH existente de cancelación; no afirmar consumidor UI nuevo ni alterar fechas, auth o notificación. |
| src/app/api/upload/[clientId]/route.ts |import NextRequest sin uso | ImageUploadField, transparent-png-uploader y brand-package-import. No cambiar validación/storage/permisos. |
| src/lib/contracts.ts |PLAN_TABLE y5 parámetros plan sin uso | Pago/onboarding consumen getContract. Mantener firmas compatibles y textos exactos por idioma/entrada; no decidir compromisos. |
| src/lib/pricing.ts |parámetro _isInitial sin uso | getPaymentAmount conserva firma/resultado; consumidores pricing de pago/onboarding/tiers. No alterar importes ni planes. |

Plan finito propuesto: P0 leer completamente esos seis archivos y consumidores pertinentes; preparar aceptación/regresión y refutar/freeze. P1 tipado preciso del resultado de seguimiento y retiro de imports/argumentos internos sin uso; no cambiar las firmas públicas usadas. P2 verificar lint cero diagnósticos con reglas intactas, tipos pertinentes y conservación del contrato del GET y outputs pricing/contracts con entradas sintéticas. P3 revisión independiente, preimágenes, huellas y registros; cerrar sólo esta reparación. Ningún cambio de middleware, selector, precio, texto comercial, UI o DB.

GREEN observable: seis archivos con0errores/0advertencias; GET de seguimiento conserva lista, timestamps y pendiente/status en casos válidos/adversos controlados y acceso owner; outputs/signaturas de pricing/contracts conservados. Sensibilidad: restaurar any en copia hace fallar el criterio lint. No ejecutar notificaciones, cobros, subida o fetch de proveedores; comparar lo no modificado mediante AST/huellas y no repetir suites aceptadas.

RED inicial de lint ya disponible en LINT-ACTUAL.json y LINT-ESTADO.json. Regresión funcional, tipos y mutación de esta reparación todavía NO EJECUTADOS; no declarar Acceptance Contract completo o congelado. Esta orden autoriza preparación, no implementación.

Retoma exacta: leer BALANCE.md y esta propuesta; consultar cuota73/techo TOTAL74 N03; cotejar huellas; obtener orden de implementar esta reparación si Liam desea continuar; completar P0 y las siete fases sin reabrir book/support/stock/health/D05. Conservar margen de cierre, sin resets. Si se alcanza74, registrar retoma y detenerse. No volver a solicitar el mismo presupuesto.

N03 seguirá abierta tras este arreglo por las obligaciones locales/decisiones del balance. Condición previa al despliegue sobre prestaciones por tenant intacta.
