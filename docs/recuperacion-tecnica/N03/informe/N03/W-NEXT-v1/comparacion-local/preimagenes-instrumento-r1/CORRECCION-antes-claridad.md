# Corrección técnica r2 del instrumento

El contrato de preservación y el producto no cambiaron. El primer HTTP middleware corrió129 casos:125 cumplieron,4 observaciones fueron falsos RED por dos expectativas del arnés.

1. /favicon.ico-extra estaba marcado incluido; el matcher real negativo excluye favicon.ico sin ancla final. Revisor independiente detectó el error por lectura, confirmado por HTTP:200 al destino, sin renovación owner.
2. /_next/static/inexistente.js estaba esperado como respuesta interna400/404. El catch-all sintético recibe esa ruta inexistente:200 identificable, sin renovación owner. Es comportamiento del montaje, no fallo de control. /_next/image sí produce400 interno.

Se conservaron scripts r1 en preimagenes-instrumento-r1 y resultados/middleware íntegros. Única corrección del instrumento: ajustar esas expectativas, conservar126? NO: población idéntica129 y los demás casos intactos; reutilizar build sin modificar fuente y repetir HTTP en middleware-r2. Resultado129/129,exit0. No se cambia aceptación para cubrir implementación incorrecta: no hay implementación de producto, ni se cambia qué accesos/rechazos deben preservarse.

Build Next modificó tsconfig de la copia mínima (allowJs,incremental,include .next/dev/types); el inicial idéntico seguía físicamente en copia proxy antes de compilarse y se conservó como tsconfig-inicial-comun.json. El runner r2 guarda tsconfig-pre-build antes de posteriores compilaciones. Archivos de producto middleware y auth.config permanecen exactos. Artefactos .next son generados y se conservan por variante.

Freeze original retenido:CONTRATO.md inmutable. Scripts r1 y nuevo r2 tienen custodia separada; el suplemento final verificará fuentes,registros y aislamiento además del evaluador HTTP. Revisión independiente no detectó otro caso de la misma causa. Dos causas corregidas en una ronda; esa ronda produjo avance verificable P1. No se activó freno por dos ciclos sin progreso.
