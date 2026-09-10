# W-NEXT — renombrado implementado, entrega local para revisión

**RESULT: GREEN local; gates4/4. N03 sigue abierta.** Único cambio de producto: src/middleware.ts → src/proxy.ts. Archivo final de2085 bytes, SHA-256 **5a20e70b747f634dcf972e098993f837a1667cc7b23a17a82d6922f26832b44b**, idéntico a la preimagen y a la preparación aceptada. Middleware ausente; no cambio de auth.config,matcher,permisos,dependencias u otro producto. No commit,push ni deploy.

## Autorización, alcance y resultado

[Aceptación de preparación y orden de Liam](ACEPTACION-DE-LIAM.md) separadas de la aceptación futura de esta implementación. [Contrato](CONTRATO.md) y [freeze](FREEZE.json) anteriores al movimiento. P0 verificó8 fuentes y387 artefactos aceptados,preimagen física,inventario285 archivos src,configuración y lock; [RED inicial](RED-INICIAL.stdout.txt),exit1 por nombre aún antiguo. [Movimiento](MOVIMIENTO.json) completó P1 sin editar contenido.

P2 ejecutó el proxy FINAL copiado después del movimiento. Runner y lanzador son idénticos por bytes a los aceptados; no se cambiaron ni rutas internas ni expectativas. Se conservó infraestructura sintética y se hizo build nuevo,sin usar un bundle anterior como prueba del producto final.

| Validación | Resultado |
|---|---|
| Next16.2.9 build --webpack y next start, copia aislada | Build exit0; HTTP129/129,idéntico a proxy de referencia aceptado |
| Registro y matcher reales | Node.js; matcher idéntico,inclusión/exclusión conforme en129 casos |
| Control efectivo | 8 API401 y6 páginas307 a/login;43 renovaciones owner incluidas,15 excluidas sin renovación |
| Convención | Sin advertencia middleware obsoleto; sólo proxy.ts en producto/copia |
| Tipos pertinentes | exit0; tsconfig real hub extendido,include proxy/auth.config/next-env,incremental false |
| Lint pertinente |2 archivos,0errores/0advertencias; presets instalados Next/core-web-vitals y TypeScript |
| Mutación aceptada | Reutilizada íntegra por huellas:14rechazos pasan indebidamente a200; no se repitió |
| Conservación |285 archivos src por huella,único cambio de ruta;auth.config,tsconfig,next.config,package,lock,next-env intactos |

[Aceptación completa](ACEPTACION-FINAL.json): GREEN,318 comprobaciones,ningún fallo. El número incluye huellas y chequeos de registro; no son casos HTTP independientes. [HTTP nuevo](resultados/proxy/HTTP.json),[tipos](TIPOS.json),[lint](LINT-RESUMEN.json). [Comparación/mutación aceptadas](../comparacion-local/INFORME-COMPARATIVO.md) reutilizadas sin reabrir entregas previas. P3 integra conservación,revisión y registros.

## Revisión y evidencia

Revisor independiente refutacion_wnext,solo lectura. Reutilizó refutación anterior; precisó que tipos del arnés ES2022 no acreditaban tsconfig hub ES2017. Resuelto con tipos pertinentes extendiendo configuración real,con salida0. Verificó hash del producto/preimagen/copia,ausencia middleware y arnés idéntico,lint y cobertura del contrato. No BLOCKER/MATERIAL nuevo; su revisión quedó condicionada a HTTP/aceptación posteriores,ambos ahora GREEN. No se presenta opinión como sustituto de ejecución.

Cinco pasadas: movimiento único; medición nueva del consumidor y reutilización de mutación sensible; lectura completa de guard/config/arnés; auditoría de población,huellas y registros; claridad de afirmaciones y límites. El comentario interno que dice middleware permanece para cumplir igualdad exacta. No funciones añadidas ni suprimidas. Evolución: Next consume la convención vigente sin modificar decisiones de acceso. Ningún fallo de instrumento ni corrección de expectativas en esta implementación.

Docker --network=none,env -i,valores y sesiones sólo sintéticos; dependencias y complemento nativo existentes montados readonly. Contenedor eliminado después de HTTP. Se conservaron build,stdout/stderr,exit,manifiestos y fuentes; los JWTSessionError son los casos inválido/expirado deliberados. [Preimágenes](FUENTES.json),[custodia de registros](CUSTODIA-REGISTROS.json),[artefactos físicos](EVIDENCIA-FISICA.json). No entorno ni credenciales reales,instalaciones,red externa o efectos externos.

## Límites y continuidad

La nueva prueba HTTP usa aplicación mínima con Next/NextAuth/auth.config reales y destino sintético,Node22.23.1/Linux/webpack. No certifica aplicación completa,OAuth real,auth.ts de login,servicios remotos,HTTPS/RSC completos ni despliegue. Tipos/lint son pertinentes al cambio; no suite integral ni npm run lint del hub. Comparación y mutación previas conservan sus límites. El archivo Git conserva controles/resultados acotados; copias y .next permanecen físicamente en las rutas del manifiesto.

Consumo inicial81%,cierre81%,techo85% TOTAL N03 compartido,sin resets. W-NEXT se entrega para revisión; no se declara aceptada por Liam esta implementación. N03 permanece abierta; no se preparó otra reparación. Se conservan N04/N06/N05/N07/N08/N09/N10 y la condición previa al despliegue: presentar prestaciones por tenant/servicio,evidencia y decisión de Liam sobre excepciones antes de cualquier despliegue.
