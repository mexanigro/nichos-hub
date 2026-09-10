# Refutación de preparación L02

Revisor interno independiente: /root/refutacion_wnext (Newton), lectura acotada de endpoint, consumidor, SDK y sondeo. No es revisión externa del usuario ni aceptación de reparación.

Sin BLOCKER de diseño/autenticidad para la preparación. MATERIAL incorporados:

1. DocumentMask no expone fields: usa _sortedPaths. Instrumento usa sus FieldPath.segments y coteja formattedName con el protobuf. DocumentTransform sí expone fields. No split de puntos al aplicar el merge.
2. Mapas opcionales vacíos pueden reemplazar una rama. Sonda SDK explícita demuestra contact:{}; propuesta exige ramas opcionales sólo con hojas. Requests omitidos/contact/address vacíos preservan hermanos; hours explícito conserva su política actual.
3. Resubmit sin hub no es alta válida:403 antes de escritura. Matriz respeta esa guardia.
4. add del historial está modelado con set/merge en el instrumento: acredita payload y secuencia modelados, no precondición de create real. No se extrapola su protocolo ni atomicidad.
5. Antes de aceptar reparación: oráculo fijo independiente de claves defectuosas observadas, mutación en handler reparado, cero efectos adicionales de llamada11 y contenido correcto del historial anidado. Cero efectos de llamada11 ya comprobado en r3; los demás son controles previstos expresos, no resultados presentes.

Tres ángulos: deuda/defaults y alcance (sin L01 ni otros escritores); fuente SDK/lector real; adversarial guardias/conservación/sentinelas. La sonda literal/anidada verifica sensibilidad del lector y materializador, no una reparación que no se implementó.

Iteraciones instrumentales conservadas: r1 falló por tratar array vacío como payload completo; r2 avanzó hasta21º escenario y guardó20 casos, pero confundió response429 con successBody. Preimágenes separadas y logs exit2 conservados. Correcciones del instrumento sin alterar objetivo: comprobar length y conservar respuesta exitosa por separado, más contador de efectos alrededor de cada rechazo. r3 completó21 escenarios con exit1 RED semántico. Hubo información accionable y avance verificable entre checkpoints; no se repitió una estrategia fallida sin cambio.

Alcance, objetivo y contrato de preparación permanecen fijados. Preparación lista para revisión; autorización de implementación pendiente. N03 sigue abierta y L02 no descontada.
