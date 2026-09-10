# L02 client-info — solución mínima para autorización

**Recomendación: autorizar una reparación local de un solo archivo; todavía no implementada.** Obligación: que los parches de POST /api/onboarding/client-info actualicen las hojas anidadas que consumen wizard/configuración y hub_clients, conservando el comportamiento restante del mismo endpoint. Esta preparación no descuenta L02.

Archivo futuro único: `src/app/api/onboarding/client-info/route.ts`. No modificar consumidor, autenticación, dependencias, otros escritores ni documentos reales.

1. Sustituir la construcción de claves literales por objetos anidados explícitos en `configUpdate`: business; brand; contact/address; owner; themeOverrides; brandingInput; hero; sections/whyChooseUs/faq. Mantener exactamente condiciones y valores actuales de cada asignación. Acumular ramas opcionales y adjuntarlas sólo cuando tienen hojas; nunca introducir un mapa vacío por omisión. No crear un convertidor genérico.
2. Construir `hubUpdate.contact` con email y/o whatsapp sólo cuando hoy se emiten. Mantener el fallback de creación y los dos destinos de lookup existentes.
3. Conservar ambos `set(...,{merge:true})`, que admiten documento ausente. No sustituir por update (exige existencia), ni agregar una lectura/escritura preparatoria. Arrays siguen siendo hojas completas. Sentinelas se pasan como instancias SDK, sin JSON round-trip ni clonado genérico.

Detalles que deben permanecer: defaults de business.type/mode/name y brandingInput.colors aunque el request omita esos campos; nicho otro→estetica sólo donde hoy sucede; language opcional; precedence actual de branding sobre accentColor manual; limpieza/conversión de servicios, beneficios, testimonios y FAQ; hours como hoy (incluido un mapa vacío explícito enviado); todas las guardias, 10/min, tenant, estados, contadores, historial, clients y política de emails. Sólo pueden ajustarse comentarios del bloque cuya descripción de claves literales deje de ser cierta.

No resolver business.mode frente a businessMode del template. No limpiar claves literales históricas ni modificar precedencias de lectura: el lector actual ya elige la representación anidada. El parche futuro actualiza sólo sus hojas anidadas emitidas; claves literales antiguas fuera de ese parche permanecen. Si para aceptar la reparación se exige migrar o reconciliar otros consumidores/documentos reales, STOP y decisión de Liam; no incorporarlo silenciosamente.

## Contrato exigible para la reparación futura

- Reutilizar fuentes y arnés de esta preparación, pero convertirlo en contrato GREEN con **vectores fijos** de campos, valores y paths, conservados en ORACULO-FUTURO.json. No derivar expectativas del handler ya reparado ni confiar en que desaparezcan claves con puntos. Hoy ese bucle identifica el defecto; después quedaría vacío. Verificar todas las familias, imágenes directamente, hub_clients por separado y los campos que el lector real sí hidrata.
- Matriz config/hub ausentes/existentes, alta y resubmit (hub ausente o status indebido en resubmit→403 sin writes). Lookup legacy con token paid, omisiones, contact/address vacíos, arrays vacíos y reemplazados. Agregar comprobaciones fijas de hermanos profundos, arrays/imágenes no incluidos, sentinelas de documentos previos, coexistencia literal/anidado sin limpieza y transforms SDK exactos. Incluir incremento con contador previo ausente además del contador3 caracterizado aquí.
- Conservar defaults explícitos, limpieza y orden de precedencia de colores. Comparar SDK fields/updateMask/updateTransforms: segmentos anidados correctos, arrays como hojas y ningún transform convertido en objeto de datos. Delete fuera de fields pero dentro de máscara; incremento/serverTimestamp en updateTransforms.
- Repetir autenticación real con tokens sintéticos válidos/inválidos/expirados/tenant ajeno; rate limit real, y comprobar cero efectos adicionales de la petición11. Mantener estado/respuesta, fallback, clients, política de envío y destinatarios sintéticos. Historial: validar también paths y summaries antes/después esperados de cambios anidados, changeCount/truncated y caso sin cambio; la forma actual de producir historial no se repara ni generaliza.
- Sensibilidad obligatoria: en copia del **handler reparado**, restaurar las claves literales de config y hub_clients, por separado o con atribución de fallos. Debe reaparecer RED por valores anidados no actualizados manteniendo instrumento/guardias funcionando. La sonda positiva/negativa de esta preparación no sustituye esa mutación futura.
- Verificar tipos/lint pertinentes y censo SHA antes/después; único delta de producto permitido es ese archivo. GREEN local no certifica DB, reglas, concurrencia, atomicidad ni entrega real. No extender instrumentación a un framework.

## Orden finito tras autorización futura

P0: vigencia/presupuesto/preimagen y cerrar los controles fijos anteriores sobre el mismo endpoint, observando RED. P1: modificar sólo las construcciones descritas. P2: GREEN local del contrato y mutación sensible con conservación. P3: tipos/lint, refutación, custodia y entrega para revisión. Si requiere ampliar el archivo/causa o deja de avanzar, detenerse con causa concreta.

N03 abierta. W-NEXT y otras entregas aceptadas intactas. Resto L02, L01/L12 y obligaciones del BALANCE siguen vigentes. N04/N08/N10 conservan pruebas reales. Antes del despliegue: presentar tenants/servicios que deben conservar prestaciones, evidencia y decisión de Liam sobre excepciones. Techo 85% TOTAL compartido, sin resets, instalaciones, push, deploy ni efectos externos.
