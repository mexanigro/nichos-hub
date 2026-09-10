# W-NEXT — preparación comparativa completada localmente

**RESULT: GREEN para la preparación autorizada; N03 sigue en curso y la migración de producto no se ejecutó.** Gates de esta preparación4/4. Recomendación: implementar en un siguiente trabajo expresamente autorizado únicamente `src/middleware.ts → src/proxy.ts`, conservando bytes. No se encontró una diferencia de autorización en la población medida. No se afirma que hubiera un defecto de login.

## Resultado comparativo

| Propiedad | Middleware de referencia | Proxy, bytes idénticos | Proxy desarmado en copia |
|---|---|---|---|
| Build real Next16.2.9, webpack y TypeScript | exit0 | exit0 | exit0 |
| Registro de Next | Edge; server/src/middleware.js | Node.js; server/middleware.js | Node.js; mismo registro |
| Matcher compilado | Referencia | Idéntico | Idéntico |
| Casos HTTP | 129/129 cumplen | 129/129 cumplen; observaciones idénticas | 14 rechazos se convierten en acceso;115 restantes conservados |
| Rechazos conservados | 8 API401 +6 páginas307 /login | 8 API401 +6 páginas307 /login | Los14 pasan a200 del destino sintético |
| Advertencia middleware obsoleto | Presente | Ausente | Ausente |
| Docker/proceso de medición | exit0 en r2 | exit0 | exit1 semántico esperado |

Los113 accesos normales y2 respuestas400 del optimizador de imágenes completan los129 casos junto a14 rechazos. Los errores JWTSessionError en stderr corresponden a las pruebas deliberadas con token inválido y vencido, no a fallo de arranque. Middleware también emite advertencias de CompressionStream/DecompressionStream en jose sobre Edge; no produjeron fallo en estos casos y no se investigó otra obligación. Proxy no emitió esas advertencias en este build.

Ejecución efectiva sin instrumentar referencia ni proxy:43 requests owner por variante incluida renuevan cookie real de NextAuth;15 owner excluidos no la renuevan. El destino sintético tiene cuerpo identificable. Los401 JSON y307 provienen del callback; al desarmar únicamente ese callback, los14 destinos antes bloqueados quedan accesibles y la renovación/matcher se conservan. El manifiesto Edge y functions-config-manifest Node identifican además el registro y runtime reales. No se dedujo ejecución sólo de un200 público.

## Población y evidencia

Misma matriz129:14 observaciones de siete públicos exactos;64 de16 prefijos con descendiente y colisión startsWith;12 de página/API privadas con ausente,owner mayúsculas,segundo owner,ajeno,inválido y expirado;5 de excepción agente;26 de exclusiones por extensiones/assets;8 de rutas cercanas al matcher. No se cambió la semántica de prefijos amplios ni la excepción por presencia de header.

- [Contrato congelado](CONTRATO.md), [freeze original](FREEZE.json) y [RED inicial](RED-INICIAL.json).
- [Referencia final](resultados/middleware-r2/HTTP.json), [proxy](resultados/proxy/HTTP.json), [mutante](resultados/mutante/HTTP.json).
- [Validación completa](VALIDACION-COMPLETA.json): GREEN,719 controles sin fallos. Incluye hashes y evaluaciones repetidas del matcher; **no son719 casos HTTP independientes**.
- [Fuentes/preimágenes](FUENTES.json), [custodia de registros](CUSTODIA-REGISTROS.json), [artefactos físicos](EVIDENCIA-FISICA.json) y [cuota](CUOTA.json).
- Cada carpeta de resultados conserva build,HTTP,stdout/stderr,exit,Docker,red y disposición. Todos los contenedores de la tarea fueron eliminados.

NextAuth5.0.0-beta.31,auth.config.ts real y Google provider real cargados con valores sintéticos. JWT/JWE producido y validado por next-auth/jwt real; expiración -120s supera tolerancia15s. Next16.2.9,Node22.23.1 e imagen preexistente16e22a…; complemento SWC de N02 reutilizado. Docker --network=none, sólo loopback; entorno vaciado con env -i, dependencias/complementos de solo lectura. Sin .env ni credenciales reales, instalaciones, red externa, push o deploy.

## Refutación, mejoras y conservación

Revisor independiente `refutacion_wnext`, sólo lectura, antes de montar y después de medir. Inicialmente incorporó evidencia de ejecución/destino, expiración, colisiones de prefijo, header vacío/sin slash y mutación semántica. Detectó falso esperado de favicon.ico-extra y que el evaluador HTTP necesitaba suplemento de fuentes/registro/Docker. Revisión final: sin BLOCKER ni MATERIAL pendiente para esta preparación; recomendación de rename futuro limitada al montaje medido.

Primera corrida middleware conservada:129 observaciones,4 falsos RED por dos expectativas del instrumento. Favicon.ico-extra está excluido realmente; un asset static inexistente cae en el catch-all sintético200. [Corrección técnica r2 y preimágenes](CORRECCION-INSTRUMENTO-r2.md). Única ronda correctiva con nueva evidencia; se reutilizó el build y se repitió HTTP,129/129. No se cambió el contrato ni hubo producto implementado para acomodarlo al test. No se repitieron entregas aceptadas de N03.

Cinco pasadas cubiertas: montaje; medición HTTP con válidos/adversos/desarmado; lectura completa del control/config/arnés y revisión independiente; auditoría de hashes,registro,matrix y aislamiento; revisión de afirmaciones y claridad. Evolución útil: se reemplaza la inferencia desde callback simulado por comparación real del consumidor Next/NextAuth, más detector semántico sensible al guard desarmado.

Guard y auth.config exactos,8 fuentes iniciales intactas y285 archivos src del hub conservados contra el checkpoint de esta sesión. Producto mantiene middleware.ts y no contiene proxy.ts. El template no fue montado ni modificado. Sólo se escribieron copias,controles,evidencias y registros de este expediente. No commit ni otra reparación.

## Límites y siguiente decisión

La prueba usa build de producción y next start reales **de una aplicación mínima aislada**, con catch-all sintético y next.config saneado. No certifica el build completo del hub, sus endpoints, headers,app-shell,callbacks de login de auth.ts,Google OAuth ni cookies/secretos/claims de producción. No mide HTTPS real,plataforma alojada,Turbopack,flujos RSC completos ni equivalencia universal Edge/Node. La mutación se hizo en proxy; middleware es la referencia intacta. Dependencias y artefactos permanecen en sus rutas locales; el archivo Git no es un arnés portable autosuficiente.

Recomendar implementar el renombrado único es una conclusión local de compatibilidad, no autorización de ejecución ni certificación remota. La reparación W-NEXT conserva sus gates de implementación pendientes; N03, N04/N10 y la condición de prestaciones por tenant antes del despliegue siguen abiertas. No abrir otra obligación. Consumo compartido verificado80% al inicio y cierre, techo85% TOTAL N03, cero resets.
