# N03 L05 navegador — GREEN exclusivamente local, para revisión

Liam aprobó la propuesta y la eliminación del montaje estático implícito sin Firebase. [Contrato aprobado](CONTRATO-APROBADO.md), [freeze anterior a producto](FREEZE.json). P0→P1→P2→P3:4/4, sin BLOCKERS. N03 sigue en curso; esta entrega se detiene para revisión y no abre otra reparación.

## Resultado del producto

clients/{clientId} usa getDocFromServer con el db y selector existentes. Sólo active/trial/maintenance exactos permiten montar App. suspended/archived conservan su pantalla. Ausencia de Firebase, documento/estado ausente o inválido, error/offline/timeout muestran indisponibilidad temporal con recarga manual; no montan App. No se guarda permiso entre recargas ni hay polling/reintentos automáticos.

Estado y config arrancan en paralelo, cada lectura con1500ms desde su propio inicio. El plazo incluye el acceso al snapshot; performance.now comprueba también vencimiento si el temporizador se demora. Suspensión/indisponibilidad retornan sin esperar config. Sólo con permiso se aplica config resuelta a tiempo; error/ausencia/vencimiento usan preset. Respuestas tardías no cambian la decisión ni aplican overlay. No se cancela necesariamente el SDK.

Se sustituyó expresamente la promesa de apertura sin Firebase documentada en AGENTS.md:23–24. Su archivo queda intacto por alcance; la decisión aprobada manda para este comportamiento. No es una excepción inferida por demo/visitante/credenciales ni una modificación de prestaciones de tenants reales.

## Aceptación y evidencia

- [Aceptación final](ACEPTACION-FINAL.json):89 controles únicos GREEN. Integra88 resultados válidos de RESULTADOS-green-p2.json con la corrección acotada de conservación de merge en RESULTADOS-green-merge-only.json. No se repitió el sondeo20 ni las suites servidor aceptadas.
- main/tenant/site/presets/locales actuales se ejecutaron con React/ReactDOM y Chromium locales. App marcador verifica commit DOM real; Firebase, wrappers de providers, env y efectos de SEO/theme controlados. El JSX de providers original está conservado. Casos válidos/adversos, servidor frente a active cacheado, espera,1500ms independientes, config pendiente, config temprana frente a denegación, tardíos, recarga real y permiso no persistido. Cero errores de página e intentos externos del contexto.
- [Mutación](RESULTADOS-mutation-p3.json): salidas unavailable sustituidas por allowed/active únicamente en bundle compilado aislado en memoria.17 rechazos del contrato esperados; controles positivos active/trial/maintenance y bloqueos comprobados conservados. Fuentes de producto coinciden después con las probadas.
- [Tipos](TIPOS-p2.json):exit0 con configuración del template sin relajaciones, main/tenant y src/vite-env.d.ts. Se incluyen las dependencias y cuatro locales. No paridad de rutas repetida: ambos runtimes servidor y sus contratos no cambiaron.
- [Conservación](CONSERVACION-FINAL.json):399 controles aprobados;333 fuentes del template registradas, sólo las6 autorizadas cambiadas.327 fuentes restantes y6 archivos hub lint aceptados conservados. Helpers/filtros/normalización, ramas del merge, suspensión/providers y textos anteriores de4 idiomas idénticos. [Manifiesto final](FUENTES-FINALES.json).
- [Preimágenes de producto](PREIMAGENES-P1.json) físicas y verificadas antes de editar. Evidencia previa preservada, resultados nuevos con nombres exclusivos.

## Refutación, claridad y detector de bucles

Revisión interna sólo lectura por /root/refutar_soporte (Harvey), en esta conversación, previa al freeze y posterior a P1. Tres ángulos: plazos/concurrencia de lecturas, conservación de contrato/merge/providers y suficiencia del montaje probado. MATERIAL previos incorporados a aceptación; revisión final sin BLOCKERS ni defectos materiales nuevos. No ejecutó pruebas ni es la revisión externa de servidor trasladada por Liam; esta última conserva su procedencia y objeto en L05-v1/REVISION-EXTERNA-TRASLADADA.md.

Claridad: único helper nuevo readWithinDeadline usado por las dos lecturas, sin cache/globales de permisos ni funciones muertas nuevas. Resultado discriminado y validación exacta preceden App. main agrega espera/mensaje/recarga y conserva providers/suspensión; locales sólo agregan dos mensajes. Fuera de esos seis archivos no se cambió producto.

Avance por ciclo: P0 completó preflight y freeze; primer error de esbuild define fue corregido una vez y el renderer real aprobó. P1 produjo montaje bloqueado/permitido y88 controles válidos. P2 contrastó el caso barber en original y final: site y overlays idénticos en4 escenarios. El oráculo incorrecto esperaba barberia; [adenda](ADENDA-ORACULO.md) documenta corrección, no cambio del contrato ni producto. P3 detectó17 fallos al mutar y completó tipos/conservación. El consolidador inicialmente comparó arrays en orden de callbacks paralelos de esbuild:47 pares ruta/huella idénticos. Se conservó CIERRE-INSTRUMENTO-FALLO-r1.json y preimagen, se corrigió una vez comparando pares ordenados y aprobó399 comprobaciones. No se encadenaron intentos sin información nueva ni se reinició reconocimiento.

## Límites y continuidad

Este cierre acredita la decisión y commit de montaje en navegador controlado; no App completa, efectos de imports, seguridad de datos, transacciones ni Firebase/rules remotos. La pantalla no sustituye reglas Firestore. Accesos directos y certificación real permanecen en N04/etapas remotas que correspondan. No se ejecutaron instalaciones, operaciones remotas, cambios de reglas/pagos, commit,push,deploy o resets.

Book/support/stock/health-SP-H01/D05/lint y L05 servidor se conservan. N03 sigue en curso con las demás obligaciones registradas, sin seleccionarlas ni implementarlas en esta continuación. Antes de despliegue sigue siendo necesario presentar tenants/servicios a conservar con evidencia y decisión de Liam sobre excepciones; no deducir compromisos de claves/planes históricos.

Consumo API observado al inicio,P0,P2 y cierre:75% de techo80% TOTAL N03 compartido. Sin resets. Detener aquí para revisión de L05 navegador; no hay retoma técnica pendiente de esta entrega GREEN.
