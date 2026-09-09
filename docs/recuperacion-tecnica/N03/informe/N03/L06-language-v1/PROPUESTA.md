# N03 — L06-language-v1: conservar idioma al crear config desde onboarding

Preparación únicamente. Producto sin modificar; implementación pendiente de autorización. Techo80% TOTAL N03, consumo observado78%, sin resets. N03 continúa abierta.

## Obligación original y defecto comprobado

Se toma exclusivamente la parte de L06 recibida en N01/SA-01-L-v1/DEUDA.md: onboarding guarda idioma en hub_clients pero no en config, mientras deploy lee config.language. El balance reconciliacion-v1/BALANCE.md mantiene esta deuda local bajo H01/ES-A/L06. No se reconstruye el balance ni se considera cerrada toda la familia de idiomas.

Consumidor real en código: src/app/onboarding/preview/page.tsx añade `locale = draft.locale || locale` a FormData y hace POST /api/onboarding; el handler lee/recorta ese valor, guarda hub_clients.language, crea config sin language y llama /api/deploy. Esa ruta pasa la identidad a deployToVercel. src/lib/deploy.ts lee config.language y genera VITE_UI_LANGUAGE usando su normalizador existente; si falta, usa he. La rama src/app/api/clients/provision/route.ts ya guarda language en ambos documentos, por lo que no se propone modificarla.

Sondeo ejecutado sobre el POST y deployToVercel actuales, transpilation/VM y dependencias simuladas explícitas: diez entradas. Todas crean config sin language y producen VITE_UI_LANGUAGE=he. Ejemplos: en,ru,ar y es permanecen en hub_clients pero el payload de entorno simulado contiene he; ausencia de locale guarda en en hub pero también despliega he. `  ru  ` guarda ru; EN guarda EN; bad y blanco conservan tratamiento actual. [Datos completos y payloads de preimagen](MEDICION.json), [instrumento comprobado](PREFLIGHT.json), [fuentes y preimágenes](FUENTES.json).

Es una pérdida concreta de configuración entre productor y consumidor. El sondeo no crea proyectos ni hace red: el fetch de onboarding se conecta al deployToVercel real dentro del VM y los cuatro requests del consumidor sólo se capturan en memoria. No ejecuta el endpoint /api/deploy ni certifica sus permisos, ni monta la UI; esos enlaces se contrastaron por lectura. No IA, logos ni credenciales reales. Código de helpers de branding/nicho simulado porque no es objeto de esta reparación.

## Única reparación recomendada

Añadir sólo `language: locale,` al objeto que POST /api/onboarding escribe en `config/{slug}`, antes de disparar el consumidor. Archivo de producto afectado: **src/app/api/onboarding/route.ts del hub**. Mantener sin cambios el valor ya guardado en hub_clients, selectores/normalización de deploy, esquema, permisos, estados, resto de configuración, respuesta y efectos existentes. Sin módulo compartido nuevo, corrección de datos históricos ni cambios de entornos.

Resultado material observable: las altas por este recorrido dejan el mismo idioma en hub_clients y config, y el payload de entorno del consumidor usa el normalizador ya existente sobre ese idioma en vez del fallback por omisión. No es una traducción ni una reescritura de provisioning.

ES-A permanece vigente: es interno se conserva. Con esta corrección, es llega como es al build; resolveUiLanguage del template conserva su fallback existente a en. Esto cambia ese recorrido desde el he accidental a en por fallback, NO incorpora interfaz española ni la certifica. Ausencia de locale sigue el default actual en del onboarding, que ahora llega al consumidor. Valores inválidos/blancos conservan fallback he del consumidor. Estos efectos forman parte de la propuesta a autorizar, sin migrar clientes existentes.

## Plan finito y gates propuestos

| Gate | Cambio, ubicación y propósito | Resultado verificable |
|---|---|---|
| P0 | Completar aceptación a partir de MEDICION y preimágenes, refutación y freeze tras autorización | RED de pérdida de idioma vigente, expectativas de conservación fijadas antes de producto |
| P1 | Preimagen física y una propiedad en el set de config del handler | config.language coincide con hub_clients.language, sin otro diff |
| P2 | Reutilizar sondeo VM del POST→deployToVercel y ampliar únicamente controles del contrato | Idioma propagado y resto de resultados/payloads conservados; tipos/lint pertinentes |
| P3 | Retirar sólo la propiedad en copia aislada, ejecutar control y revisar claridad/registros | Control detecta pérdida de idioma; cierre local de esta parte L06 para revisión |

## Aceptación verificable

1. Para he/en/ru/ar/es, ausencia, espacios alrededor, EN, inválido y blanco: config.language igual al valor que el mismo POST guarda en hub_clients. VITE_UI_LANGUAGE coincide con resolveClientLanguage existente aplicado a ese valor. Esperado en orden de MEDICION: he,en,ru,ar,es,en,ru,en,he,he. No cambiar normalizadores ni defaults para lograrlo.
2. Comparar las escrituras, respuesta, disparo completo (URL/método/headers/body) y requests del consumidor contra referencia-r2/MEDICION.json por caso, permitiendo sólo language añadido a config y el cambio derivado en VITE_UI_LANGUAGE. Preservar defaults de niche/businessMode, statuses, campos de branding/contacto/features, identidad y parámetros de deploy, incluido x-deploy-secret sintético. Ninguna notificación, IA, logo o red real en pruebas.
3. Conservar los rechazos del POST ya medidos en referencia-r2: rate limit429, origen403, entrada inválida400 y fallo específicamente de config.set500. Cero disparos posteriores en los cuatro casos. El fallo de config conserva las dos escrituras previas a hub_clients/clients; no exigir rollback ni introducir transacciones, que sería otro alcance. No hacer una auditoría del autenticador, origen ni demás campos.
4. Comprobar el observador de idioma y destinos con los positivos y retirar la única propiedad en copia: debe fallar el criterio de propagación para en/ru/ar/es/ausencia/ru con espacios/EN; he y fallback inválido/blanco siguen coherentes. Un error de imports o instrumento no es RED funcional.
5. Tipos/lint acotados con configuración/dependencias instaladas, sin supresiones. Diff exacto de una propiedad y huellas de fuentes no afectadas. No repetir suites template aceptadas. Propagación real/build/runtime y completitud lingüística conservan destinos N08/N10; identidad y datos reales N04.

GREEN sólo después de medir estos criterios sobre la reparación y mutación efectiva. Hoy: RED comprobado de propagación; aceptación final, tipos y mutación todavía pendientes de implementación. No freeze ni producto modificado.

Refutación interna: Harvey, sólo lectura, sin BLOCKER del parche. MATERIAL de captura incompleta del disparo resuelto en referencia-r2 (14escenarios aprobados como reproducción del estado actual:10positivos+4adversos; el contrato de idioma sigue RED). Fallo de persistencia localizado en config.set con escrituras previas conservadas. [Informe y límites](INFORME.md). No se atribuye esta refutación a la revisión externa aceptada de appointment-notify-auth.

Única siguiente acción: autorizar esta propiedad y P0→P3, incluyendo los efectos explícitos de ausencia y es descritos arriba. Condición previa al despliegue sobre prestaciones por tenant intacta; sin operaciones remotas, instalaciones, ramas/worktrees, commit,push/deploy ni resets.
