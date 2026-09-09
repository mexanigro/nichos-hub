# L05 navegador — contrato de implementación aprobado

Liam aprobó expresamente PROPUESTA.md y la sustitución de la apertura estática implícita sin Firebase. La promesa de AGENTS.md:23–24 queda sustituida para el montaje por esta decisión, sin editar instrucciones fuera de los seis archivos autorizados ni inferir compromisos de tenants reales. Techo80% TOTAL N03, sin resets.

Objetivo: verificar el estado antes del montaje, independientemente de config opcional. Sólo clients/{clientId} obtenido mediante getDocFromServer con active/trial/maintenance exactos permite App. suspended/archived mantienen vista existente. Firebase ausente, documento/estado ausente, valor inválido, error u operación vencida dan indisponibilidad temporal y recarga manual. Sin polling, permiso persistido ni habilitación por visitante. Config mantiene getDoc y merge/normalización/selectores existentes; fallida/ausente/vencida permite preset únicamente con estado permitido.

Ambas lecturas se inician en paralelo y cada plazo es1500ms desde su inicio. Al alcanzar el plazo la operación ya no es válida. Estado bloqueado/no verificable se comunica sin esperar config. Config temprana no se aplica si finalmente no hay permiso. Ningún resultado tardío monta App ni modifica overlay. Los plazos no cancelan necesariamente el SDK. Se conserva el JSX de providers y vista de suspensión.

## Gates finitos

- P0: decisión incorporada, arnés completo preflight, aceptación completada/refutada y freeze. RED vigente: SONDEO.json,20 escenarios del consumidor real; no se repite. Controles nuevos completan tiempo y commit DOM que aquel sondeo no certificaba.
- P1: cambios mínimos exclusivamente tenant.ts/main.tsx y locales en/he/ru/ar, con seis preimágenes físicas verificadas. Resultado: acceso verificado, indisponibilidad diferenciada, plazos independientes y recarga manual.
- P2: browser-contract.cjs sobre main/tenant/site/locales actuales, React/ReactDOM y Chromium instalados. Casos exactos/adversos, caché no autorizante, config temprana/pendiente/error, límites/tardíos, recarga real y pérdida del permiso anterior, merge real. GREEN requiere cada control positivo, sin errores de página ni intentos externos.
- P3: mutación aislada de las salidas de indisponibilidad hace fallar casos negativos; tipos pertinentes con vite-env.d.ts, conservación de fuentes y JSX/merge/suspensión, claridad/refutación final, registros. Cerrar sólo esta entrega local y detener revisión. N03 sigue en curso.

## Instrumento y evidencia

fixture.cjs simula db/selector/lecturas sin SDK ni secretos. Se distinguen lectura de servidor y getDoc con active cacheado+servidor rechazado. browser-contract.cjs compila main,tenant,site,presets y locales reales; usa React/ReactDOM reales, App marcador con commit DOM real, wrappers/SEO/theme/Firebase/env controlados. No certifica el contenido completo de App, efectos de sus imports, accesos Firestore directos ni reglas remotas. Chromium sólo recibe origen loopback, cualquier otra solicitud de contexto es bloqueada y contada. No instalaciones ni servicios remotos.

Antes de escenarios: node --check de todos los .mjs/.cjs activos del directorio, importación/resolución/bundle de47 fuentes y control independiente de renderer React en Chromium; fixture con positivo, ausente, rechazo, pendiente/liberación y selector ajeno. Primer preflight falló por expresión inválida de esbuild define, preservado en INSTRUMENTO-FALLO-p0.json. Única corrección: referencia al objeto sintético; PREFLIGHT-p0-r2.json confirmó avance verificable y montaje positivo. Los nuevos controles de caché/overlay se verifican en preflight final antes de producto.

## Refutación previa

Procedencia: revisión interna sólo lectura de /root/refutar_soporte (Harvey), recibida en esta continuación; distinta de revisión externa de L05 servidor trasladada por Liam. Sin BLOCKERS de decisión. MATERIAL resueltos en contrato: config temprana no autoriza ni aplica overlay ante rechazo; diferenciar caché de getDocFromServer; commit DOM real sin contar invocaciones StrictMode como montajes; documento nuevo en recarga. Se cubren con casos explícitos. NON-BLOCKING: efectos completos de App y reglas remotas quedan fuera, no se presentan como certificados.

Sin nueva política comercial, selectores, reglas, mezcla, pagos o diseño general. Prestaciones por tenant con evidencia y decisión de Liam antes de despliegue permanece vigente. Evidencia previa aceptada no se repite. Freeze se registra tras preflight final con huellas de este contrato y arnés, antes de producto.
