# N03 L05 navegador — preparación, sin implementación

Orden vigente: aceptar e integrar L05 servidor y preparar exclusivamente bootstrapTenantConfig en src/services/tenant.ts y decisión de montaje en src/main.tsx. Techo80% TOTAL N03, sin resets. No nuevas políticas ejecutadas, cambios de selectores/rules/merge/pagos/diseño ni repetición de suites servidor aceptadas.

## Defecto observado en el consumidor

[Sondeo](SONDEO.json):20 escenarios, sin errores de ejecución. Se transpilan completos los dos módulos actuales mediante TypeScript instalado; cada módulo conserva su propio alcance. Se ejecuta el bootstrap real de main.tsx y se intercepta la llamada efectiva createRoot(root).render cuyo árbol contiene App. El resultado no se deduce sólo de TenantBootstrapResult. DOM, renderer React, App e imports externos se simulan; NO se certifica commit de React, navegador real, layout, Firestore remoto ni accesos internos de App.

| Entrada actual | Observación |
|---|---|
| active/trial/maintenance | render de App una vez |
| suspended/archived | no render; se construye pantalla existente de suspensión |
| Documento ausente, status ausente/null/vacío/número/desconocido | render de App una vez, sin estado verificado |
| Error permission-denied u otro error de lectura | render de App una vez |
| Firebase no configurado | render con preset estático, sin lecturas del bootstrap |
| Config falla y estado active | render; este comportamiento debe conservarse |
| Config falla y estado suspended | no render; suspensión existente |
| Config falla y documento de estado ausente | render; config fallida no explica ni justifica el permiso |
| Estado pendiente | durante75ms no render ni vista de suspensión; al liberar active se monta |
| Config pendiente + active | durante75ms no render; al liberar config se monta |
| Config pendiente + suspended | durante75ms tampoco aparece suspensión; sólo al liberar config se muestra |

Promise.allSettled une las dos lecturas y retiene la decisión aunque el estado ya esté resuelto. No hay deadline propio.75ms es ventana de observación del instrumento, no SLA ni prueba de espera infinita. index.html deja root vacío inicialmente. La sensibilidad se acredita desarmando la condición de suspensión sólo en copia compilada en memoria: suspended entonces solicita render de App. Fuente de producto intacta.

## Contratos y funcionamiento estático documentado

AGENTS.md:23–24 promete funcionamiento UI/navegación y booking sin claves/Firebase; tenant.ts:127–130 implementa el fallback estático active. AGENTS.md:44 también advierte que disponibilidad de BookingWizard depende de Firestore y puede mostrarse sin horarios; la promesa no certifica reserva remota. README describe operación multitenant/config, sin definir espera o recuperación ni otra autorización offline. No se identificaron tenants reales ni se deduce compromiso comercial de estas instrucciones.

VITE_DISABLE_FIRESTORE_SITE_OVERRIDE sólo omite overlay; no es permiso de acceso ni justificación para ignorar clients.status. No crear bypass por demo, visitante, query/localStorage o ausencia de credenciales.

SDK instalado: declaraciones @firebase/firestore/dist/index.d.ts:1377–1402 indican que getDoc puede devolver caché o fallar offline; getDocFromServer exige servidor y falla sin red. La comprobación de estado propuesta debe usar getDocFromServer para clients/{clientId}, manteniendo el mismo db y selector. Config opcional puede conservar getDoc y el mecanismo de mezcla vigente. No confundir el tipo ClientStatus (aserción estática) con validación en ejecución.

main.tsx importa App y otros módulos antes de decidir render. src/lib/firebase.ts inicia SDK y una sonda system/ping durante importación cuando hay configuración. El bloqueo de montaje no acredita ausencia de efectos de imports ni protección de datos. No se cambia ese módulo ni se convierte esta entrega en auditoría de imports. Rules/aislamiento real siguen N04; la UI no los sustituye.

## Única propuesta y decisión pendiente

Recomiendo aprobar una política de arranque verificado: sólo estado exacto leído del servidor permite montar App; ausencia de Firebase, lectura fallida/ausente/inválida o vencida muestra indisponibilidad temporal sin App. Esto elimina el fallback estático implícito actualmente documentado: debe aprobarlo Liam expresamente. No se habilita una alternativa estática por inferencia ni se diseña otra oferta.

Lectura de estado y carga opcional de config comienzan en paralelo, con plazos independientes de1500ms desde su propio inicio. El plazo del servidor L05 no se hereda automáticamente al navegador: aquí es una propuesta pendiente. Estado bloqueado/no verificable se comunica sin esperar config. Con estado permitido, config resuelta a tiempo se aplica por el mecanismo actual; config fallida/ausente/vencida permite usar preset, sin cambiar estado de acceso. No aplicar resultados tardíos tras la decisión/montaje. No introducir caché propia de permiso entre recargas.

Recuperación propuesta: mensaje temporal y acción manual de recargar/reintentar mediante nueva carga de página; sin polling ni reintentos automáticos. Durante la espera se muestra una indicación mínima, sin montar App ni usar la pantalla de suspensión para errores técnicos. Se conserva la vista actual para suspended/archived. Los textos nuevos deben usar los idiomas existentes; no rediseño general.

**Decisión única que falta:** aprobar ese paquete de arranque verificado (servidor obligatorio,1500ms independientes,recarga manual y eliminación del fallback estático sin Firebase). Consecuencia: las vistas estáticas/offline sin Firebase dejan de montar App; tenants cuyo estado esté disponible siguen funcionando aun si config opcional falla. Una dependencia lenta puede producir indisponibilidad temporal hasta la recarga; ni el timeout cancela necesariamente SDK ni la pantalla protege Firestore.

## Tabla de aceptación propuesta

| Condición | Estado distinguido | Decisión observable |
|---|---|---|
| Lectura del servidor exacta active/trial/maintenance | acceso comprobado | montar App una sola vez, tras resolver o vencer config opcional |
| Lectura exacta suspended/archived | suspensión/archivo comprobados | no App; pantalla existente sin esperar config |
| Firebase ausente, documento ausente, valor inválido, permisos/red/error o timeout | temporalmente no verificable | no App; mensaje temporal con recarga manual, sin presentarlo como suspensión |
| Config opcional fallida, ausente o tardía, estado permitido | acceso comprobado | preset vigente, sin convertir config en permiso/suspensión; sin overlay tardío |
| Estado pendiente dentro del plazo | verificando | indicación de espera, cero render de App |
| Resultado de estado tardío o sólo de caché no verificada | no verificable | no montar ni cambiar el resultado ya resuelto |
| Recarga manual posterior con estado comprobado | nueva verificación | recuperar montaje sólo por lectura nueva, sin excepciones de visitante |

## Cambio mínimo preparado

- src/services/tenant.ts: resultado discriminado para los tres estados finales; validar los cinco valores exactos; separar resolución de acceso de carga opcional. Cambiar sólo la lectura de estado a getDocFromServer, conservar getDoc de config, selectores/env/db, claves seguras, normalización y función de merge. Mantener resultado tardío sin efectos. No inventar active cuando falte Firebase.
- src/main.tsx: decidir montaje usando ese resultado; conservar suspensión/archivo existentes y providers de App; indicación mínima de espera/no verificable y recarga manual. No cambiar rutas, pagos, reglas o diseño general.
- Textos localizados: src/config/locales/en.ts, he.ts, ru.ts y ar.ts, únicamente mensaje de estado no verificable y acción de recarga; reutilizar a11y.loadingRoute para la espera. LocaleConfig deriva de esos módulos, no exige modificar localeTypes.ts. Superficie propuesta total: dos archivos de comportamiento y cuatro de textos mínimos; no está autorizada su implementación en esta preparación. No reutilizar mensajes de suspensión para errores técnicos, alterar idiomas ni fallback comercial.

Preparación de aceptación: B1 escenarios del sondeo sobre bootstrap y llamada real de montaje; B2 estado de servidor versus cache/ausencia/error; B3 independencia config/estado y sus plazos, incluyendo suspended con config pendiente; B4 lectura tardía y recarga sin permiso viejo; B5 conservación de selector/merge y resultados permitidos; B6 mutación aislada que vuelva a montar con no verificable y sea detectada. Preflight completo de sintaxis/imports/dependencias antes de cada arnés cambiado; tipos con vite-env.d.ts, controles de consumidor real y regresiones sólo afectadas. No certificar reglas o efectos de App con un spy de render: para cierre futuro completar el montaje en navegador local aislado con dependencias controladas, sin externos.

Gates futuros: P0 incorporar decisión, completar/refutar aceptación y freeze; P1 cambios mínimos en los archivos aprobados; P2 controles de montaje/config/plazo/recuperación; P3 sensibilidad, tipos, claridad, custodia y registros. Esta continuación termina en preparación; P0 de implementación no está congelado y no hay producto nuevo.

## Refutación y límites de la preparación

Revisor independiente /root/refutar_soporte (Harvey), sólo lectura: BLOCKER de decisión la promesa estática sin Firebase; MATERIAL getDoc puede devolver caché y los imports anteceden al render. Integrador confirmó ambos en fuente/SDK local e incorporó servidor obligatorio propuesto y límite explícito de montaje. Deadline/retry no estaban decididos para browser; se presentan juntos a Liam. Sin auditoría general ni revisión de clientes reales.

Preflight inicial falló por dos módulos compilados que compartían ámbito léxico (site_1); error conservado, sin ejecución de escenarios. Una corrección autorizada por información concreta encapsuló cada módulo; preimagen guardada. Continuación única: sintaxis e imports/preflight positivos,20 escenarios y observador sensible. Hubo avance material; no nueva estrategia repetida ni producto editado.

N03 permanece en curso. L05 servidor aceptado y revisión externa trasladada por Liam registrados por separado, con huella del objeto verificada. Book/support/stock/health-SP-H01/D05/lint conservadas. Condición previa al despliegue por prestaciones de tenant intacta. Sin instalaciones, remoto, commit,push,deploy ni resets. Detener tras esta propuesta para revisión; siguiente acción única: decisión de Liam sobre el paquete propuesto y su superficie antes de implementar.
