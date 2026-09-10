# N03 — balance vigente de cierre tras aceptar L01

**Proyecto/base Admin↔REST general: preparación local GREEN 4/4, pendiente revisión y decisión de política.** 35 casos/175 capturas/556 comprobaciones, SDK real con operaciones interceptadas y tres mutantes RED. Compatibilidad condicionada; app existente ajena usa su proyecto y REST conserva el propio. No hay política vigente que autorice imponer unificación. Recomendación acotada: exigir destino compatible y rechazar incompatibilidad antes de operar; pendiente decisión de Liam. Ninguna reparación ni descuento. 623 archivos de producto conservados. Sustituye sólo la propuesta de preparar este contrato; entregas aceptadas y siete familias residuales siguen vigentes. N03 abierta, techo90%TOTAL compartido, observado87%, último10%N04; sin resets/instalaciones/credenciales reales/externos/push/deploy. Etapas posteriores y condición por tenant antes del despliegue intactas. [Matriz, límites y decisión](../proyecto-base-v1/INFORME.md).


**N03 sigue abierta. L01 se descuenta sólo en la conexión local de los dos consumidores aceptados.** [Aceptación y límites](../L01-v1/aceptacion-local/ACEPTACION.md). Este balance actualiza estados desde las adjudicaciones y aceptaciones existentes; no es una investigación nueva ni una lista de defectos recién demostrados. Conserva el corte anterior completo en las preimágenes de esta aceptación.

## Entregas locales descontadas

Book, support, stock, health/SP-H01 y D05 permanecen aceptadas en sus alcances. También [lint-v1](../lint-v1/ACEPTACION.md), [L05 servidor](../L05-v1/ACEPTACION-USUARIO.md), [L05 navegador](../L05-browser-v1/ACEPTACION-USUARIO.md), [clientId-v1](../clientId-v1/ACEPTACION-Y-REVISION-EXTERNA.md), [appointment-notify-auth](../appointment-notify-auth-v1/ACEPTACION-Y-REVISION-EXTERNA.md), [L06 conexión language](../L06-language-v1/ACEPTACION-Y-REVISION-EXTERNA.md), [W-NEXT](../W-NEXT-v1/aceptacion-local/ACEPTACION-Y-REVISION-EXTERNA.md), [L02 POST client-info](../L02-client-info-v1/aceptacion-local/ACEPTACION.md), [L03 interfaz](../L03-v1/aceptacion-local/ACEPTACION.md) y ahora [L01 conexión local](../L01-v1/aceptacion-local/ACEPTACION.md).

No quedan como reparaciones locales pendientes L05, la población de 13 diagnósticos lint heredados, el selector clientId aceptado, language del onboarding, los tres controles L03 ni la conexión L01. Sus límites y certificaciones posteriores siguen vigentes; no se reabren sus pruebas.

## Qué todavía impide cerrar N03

Son siete familias residuales del balance ya adjudicado, **no siete reparaciones demostradas ni una nueva cuenta de endpoints**. Algunas requieren contrato o delimitación, no necesariamente código. Ninguna se da por resuelta sólo por tener un destino posterior.

| Pendiente adjudicado | Qué falta localmente para cerrar N03 | Lo que permanece después |
| --- | --- | --- |
| RE-EXT-02/03, RE-01, AR-N01: proyecto/base y coherencia residual por consumidor | Contrato/reconciliación de selección de proyecto y databaseId; clientId-v1 no certifica proyecto/base ni toda coherencia browser/Admin/REST. No unificar por preferencia. | N04: identidades, SDK/reglas/aislamiento y variables reales. N08: propagación. N10: integración. |
| Resto L02/L12, D03/D04: patches, merge/override, build/preset y rutas | Cerrar el contrato local restante: L02 sólo POST client-info está aceptado; L12 conserva visibleServices vacío/desconocido, null/merge/SAFE y accesibilidad de rutas frente a flags. L01 reparada no resuelve estas propiedades. Comprobar antes de decidir si requiere reparación. | N04 identidad/claims; N08 ciclo y configuración real; N10 seis nichos/modos. Sin migración autorizada. |
| H01/ES-A residual | Reconciliar la promesa/fallback de interfaz con español interno conservado y he/en/ru/ar; no repetir la conexión language de L06 ya aceptada ni exigir traducción española completa. | N08 propagación real; N10 completitud de los cuatro idiomas y RTL/LTR. |
| D13/NOT-A residual | Delimitar el contrato/conexiones locales todavía adjudicados fuera de los cinco eventos D05 y la interfaz L03. Resolver o asignar con fundamento los eventos/proveedores/compromisos restantes; no asumir defecto en los eventos aceptados ni exigir aquí toda entrega remota. | N01/Liam compromisos/excepciones; N06/N07 reminder y staff cuando aplique, entrega, idioma, dedup/retry; N04 identidad; N05/N08 recorridos. |
| L04/L08, COB-A | Contrato y guardas locales de moneda/depósito/provider/importe request en los runtimes, según prestaciones existentes adjudicadas. Checkout diferido para nueva base no autoriza retirarlo ni aceptar precio del visitante. Definir alcance pertinente antes de reparar. | N01/Liam compromisos; N05 manual/CSV; N06 relación cita/importe; N07 proveedor, cobro/webhook e idempotencia reales. |
| Excepciones de paridad restantes | Justificar contrato/población de GET * SPA, daily-digest cron y rutas exceptuadas services/availability/bookings-validate. Ausencia de llamadas en el src examinado no prueba ausencia universal ni exige copiar handlers. Book/support/stock ya descontadas. | N01/N07 evento/entrega; N09 scheduler; N06 reservas. |
| H07 / recepción documental y funcional | Reconciliar las garantías/prosa recibidas y adjudicar las obligaciones de conexión funcional de esa recepción antes de cerrar; las nueve rutas documentales no equivalen a nueve endpoints por reparar. No abrir otra auditoría general. | N01/Liam compromisos/precios; N10 usabilidad funcional, a11y/RTL/móvil. Estética después del cierre técnico. |

Fuentes conservadas: [deuda adjudicada](../../N01/SA-01-L-v1/DEUDA.md), [decisiones vigentes](../../N01/decisiones-alcance-v1/DECISIONES.md), [reconciliación por evento](../../N01/decisiones-alcance-v1/RECONCILIACION.md), [traspasos N02](../../N02/cierre-local-revisado-v1/TRASPASOS.md) y [ficha N03](../../../indice/tareas/N03.md). Se descuentan sólo aceptaciones posteriores; no se inventa cumplimiento de familias completas.

## Única siguiente acción

Resolver únicamente la decisión de compatibilidad del contrato ya preparado: [evidencia, límites y recomendación](../proyecto-base-v1/INFORME.md). Preparación ejecutada por autorización; no se implementó reparación ni se descontó el subconjunto. No reabrir clientId-v1 ni entornos reales.

## Fronteras conservadas

N04 mantiene R04-ENV/R04-SDK/A09, reglas/Auth/Storage/claims/DB e identidades y las partes recibidas L07/L09/L10/L11/L13. N05/N06/N07 conservan CRM/manual/CSV, reservas/concurrencia e integraciones reales; N08/N09/N10 provisioning, publicación/monitor/recuperación y certificación integral. Son trabajo posterior, no nuevas reparaciones agregadas aquí. Tampoco sustituyen las condiciones locales pendientes de la tabla.

Antes del despliegue siguen exigidos tenants/prestaciones que conservar, evidencia y decisión de Liam sobre excepciones. No inferir compromisos de nombres de claves o planes ni modificar entornos. Techo90% TOTAL compartido N03; observado86%, último10% reservado N04; sin resets, instalaciones, efectos externos, push/deploy.
