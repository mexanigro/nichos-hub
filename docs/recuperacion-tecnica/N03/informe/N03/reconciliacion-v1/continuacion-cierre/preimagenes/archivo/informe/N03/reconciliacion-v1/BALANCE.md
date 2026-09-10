# N03 — balance vigente tras aceptación local proyecto/base

**N03 sigue abierta. Proyecto/base se descuenta exclusivamente en los dos accesores Admin y los tres helpers REST examinados, incluido su contexto compartido.** [Aceptación y límites](../proyecto-base-v1/aceptacion-local/ACEPTACION.md). Se conserva la dependencia del getter interno projectId del SDK instalado y la prueba local con operaciones interceptadas; no se certifica DB, identidad, permisos ni compatibilidad de futuras versiones. Los estados anteriores de espera de política/revisión quedan sustituidos; preimágenes completas conservadas.

## Entregas locales descontadas

Book, support, stock, health/SP-H01 y D05 permanecen aceptadas en sus alcances. También [lint-v1](../lint-v1/ACEPTACION.md), [L05 servidor](../L05-v1/ACEPTACION-USUARIO.md), [L05 navegador](../L05-browser-v1/ACEPTACION-USUARIO.md), [clientId-v1](../clientId-v1/ACEPTACION-Y-REVISION-EXTERNA.md), [appointment-notify-auth](../appointment-notify-auth-v1/ACEPTACION-Y-REVISION-EXTERNA.md), [L06 conexión language](../L06-language-v1/ACEPTACION-Y-REVISION-EXTERNA.md), [W-NEXT](../W-NEXT-v1/aceptacion-local/ACEPTACION-Y-REVISION-EXTERNA.md), [L02 POST client-info](../L02-client-info-v1/aceptacion-local/ACEPTACION.md), [L03 interfaz](../L03-v1/aceptacion-local/ACEPTACION.md), [L01 conexión local](../L01-v1/aceptacion-local/ACEPTACION.md) y [proyecto/base local 2 Admin + 3 REST/contexto](../proyecto-base-v1/aceptacion-local/ACEPTACION.md).

No quedan como reparaciones locales pendientes L05, la población de 13 diagnósticos lint heredados, el selector clientId aceptado, language del onboarding, los tres controles L03, la conexión L01 ni el subconjunto proyecto/base ahora aceptado. Sus límites y certificaciones posteriores siguen vigentes; no se reabren sus pruebas.

## Qué todavía impide cerrar N03

Son siete familias residuales del balance ya adjudicado, **no siete reparaciones demostradas ni una nueva cuenta de endpoints**. Algunas requieren contrato o delimitación, no necesariamente código. Ninguna se da por resuelta sólo por tener un destino posterior.

| Pendiente adjudicado | Qué falta localmente para cerrar N03 | Lo que permanece después |
| --- | --- | --- |
| RE-EXT-02/03, RE-01, AR-N01: proyecto/base y coherencia residual por consumidor | Resta reconciliar la coherencia local de los consumidores fuera del subconjunto aceptado. Descontados getAdminDb, loadAdminFirestore y Create/Get/Patch REST general con contexto; no otros accesores, browser ni propagación. clientId-v1 sigue aceptado por separado. El getter interno y los límites locales permanecen; no equivalen a certificación global. | N04: identidades, SDK/reglas/aislamiento y variables reales. N08: propagación. N10: integración. |
| Resto L02/L12, D03/D04: patches, merge/override, build/preset y rutas | Cerrar el contrato local restante: L02 sólo POST client-info está aceptado; L12 conserva visibleServices vacío/desconocido, null/merge/SAFE y accesibilidad de rutas frente a flags. L01 reparada no resuelve estas propiedades. Comprobar antes de decidir si requiere reparación. | N04 identidad/claims; N08 ciclo y configuración real; N10 seis nichos/modos. Sin migración autorizada. |
| H01/ES-A residual | Reconciliar la promesa/fallback de interfaz con español interno conservado y he/en/ru/ar; no repetir la conexión language de L06 ya aceptada ni exigir traducción española completa. | N08 propagación real; N10 completitud de los cuatro idiomas y RTL/LTR. |
| D13/NOT-A residual | Delimitar el contrato/conexiones locales todavía adjudicados fuera de los cinco eventos D05 y la interfaz L03. Resolver o asignar con fundamento los eventos/proveedores/compromisos restantes; no asumir defecto en los eventos aceptados ni exigir aquí toda entrega remota. | N01/Liam compromisos/excepciones; N06/N07 reminder y staff cuando aplique, entrega, idioma, dedup/retry; N04 identidad; N05/N08 recorridos. |
| L04/L08, COB-A | Contrato y guardas locales de moneda/depósito/provider/importe request en los runtimes, según prestaciones existentes adjudicadas. Checkout diferido para nueva base no autoriza retirarlo ni aceptar precio del visitante. Definir alcance pertinente antes de reparar. | N01/Liam compromisos; N05 manual/CSV; N06 relación cita/importe; N07 proveedor, cobro/webhook e idempotencia reales. |
| Excepciones de paridad restantes | Justificar contrato/población de GET * SPA, daily-digest cron y rutas exceptuadas services/availability/bookings-validate. Ausencia de llamadas en el src examinado no prueba ausencia universal ni exige copiar handlers. Book/support/stock ya descontadas. | N01/N07 evento/entrega; N09 scheduler; N06 reservas. |
| H07 / recepción documental y funcional | Reconciliar las garantías/prosa recibidas y adjudicar las obligaciones de conexión funcional de esa recepción antes de cerrar; las nueve rutas documentales no equivalen a nueve endpoints por reparar. No abrir otra auditoría general. | N01/Liam compromisos/precios; N10 usabilidad funcional, a11y/RTL/móvil. Estética después del cierre técnico. |

Fuentes conservadas: [deuda adjudicada](../../N01/SA-01-L-v1/DEUDA.md), [decisiones vigentes](../../N01/decisiones-alcance-v1/DECISIONES.md), [reconciliación por evento](../../N01/decisiones-alcance-v1/RECONCILIACION.md), [traspasos N02](../../N02/cierre-local-revisado-v1/TRASPASOS.md) y [ficha N03](../../../indice/tareas/N03.md). Se descuentan sólo aceptaciones posteriores; no se inventa cumplimiento de familias completas.

## Única siguiente acción

Proponer preparar, sin ejecutar todavía, el contrato local de visibleServices vacío o sin IDs conocidos hasta la selección efectiva de servicios del template. Pendiente concreto L12 ya adjudicado; [alcance, reutilización y criterio de descuento](../proyecto-base-v1/aceptacion-local/SIGUIENTE-ACCION.md). No presumir defecto ni abrir modo, rutas staff o null/merge general.

## Fronteras conservadas

N04 mantiene R04-ENV/R04-SDK/A09, reglas/Auth/Storage/claims/DB e identidades y las partes recibidas L07/L09/L10/L11/L13. N05/N06/N07 conservan CRM/manual/CSV, reservas/concurrencia e integraciones reales; N08/N09/N10 provisioning, publicación/monitor/recuperación y certificación integral. Son trabajo posterior, no nuevas reparaciones agregadas aquí. Tampoco sustituyen las condiciones locales pendientes de la tabla.

Antes del despliegue siguen exigidos tenants/prestaciones que conservar, evidencia y decisión de Liam sobre excepciones. No inferir compromisos de nombres de claves o planes ni modificar entornos. Techo90% TOTAL compartido N03; observado88%, último10% reservado N04; sin resets, instalaciones, efectos externos, push/deploy.
