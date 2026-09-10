# Única siguiente acción propuesta — L02 en client-info

**Proponer preparar una reparación local del contrato de escritura de `POST /api/onboarding/client-info`; no implementarla ahora.** Es la parte L02 de claves con puntos/merge ya adjudicada a N03 en [BALANCE](../../reconciliacion-v1/BALANCE.md). Una sola causa de escritura en un endpoint, con sus consumidores de lectura;no una nueva auditoría ni un cambio global del esquema.

## Por qué ésta

Lectura acotada actual: `src/app/api/onboarding/client-info/route.ts` construye claves como `business.mode`, `business.type`, `contact.address.street` y las pasa a `set(configUpdate,{merge:true})`;en `hubUpdate` hace lo mismo con `contact.email/whatsapp`. El lector `src/lib/wizard/config-to-wizard.ts` consume mapas anidados como `config.business.mode`. El SDK instalado conserva la explicación de DocumentMask.fromObject: no separa puntos en claves de objetos. Esta discrepancia ya era L02;no se realizó una nueva corrida ni se afirma cuántos documentos reales están afectados.

El onboarding inicial actual ya usa objeto business anidado. Esa rama sólo se leyó para evitar proponer una corrección obsoleta: no se reabre L06 ni se modifica. Tampoco se confunde L02 con L01, que conserva su diferencia entre business.mode y businessMode del template.

## Obligación y resultado concreto para descontar

Obligación: que los patches emitidos por **este endpoint** actualicen la representación que consumen wizard/configuración, preservando hojas y hermanos que el patch no incluye. Incluye sus escrituras config y hub_clients para no dejar la misma causa a medias;conservar estados,auth/tenant,límite,historial y política de efectos. Se conservan expresamente los defaults actuales de business.type/mode/name y brandingInput.colors: el endpoint los incluye aunque el request los omita; esta acción no cambia esa política ni resuelve L01.

Resultado verificable requerido para descontar esta parte local de L02, tras una futura reparación autorizada:
1. En alta y reedición aisladas, con documento ausente o existente, los campos del patch se escriben en los mapas previstos;no aparecen nuevas claves literales con puntos donde se esperan rutas anidadas.
2. El lector real recupera los valores de config que hidrata,por ejemplo modo,nombre y contacto. Las hojas ausentes del patch,imágenes y hermanos se verifican directamente sobre la representación aislada;el lector no hidrata imágenes ni lee hub_clients. El patch de hub_clients se comprueba por separado. Arrays y sentinelas serverTimestamp/delete/increment mantienen su semántica;no serializarlos genéricamente para construir el parche.
3. La prueba sigue el recorrido de escritura/lectura pertinente y verifica field paths,máscaras y transforms del SDK instalado, sin depender de un mock que divida puntos incorrectamente. Restaurar la escritura literal en copia debe volver a RED por el campo que no cambia,no por fallos de arranque/importación. Una aplicación simulada del merge no certifica persistencia Firestore real.
4. Token/tenant/rate limit,estados e historial conservados;notificaciones y DB real sin efectos durante el control local. La aceptación debe delimitar qué demuestra del SDK y qué sigue reservado a entorno remoto.

Lo que se propone ahora preparar es un único contrato acotado y sensible,con preimágenes y decisión de representación compatible. **Esta propuesta no descuenta L02 todavía.** La preparación sería suficiente cuando ese contrato,corrida RED vigente y solución mínima queden concretos para autorización;el descuento exige luego reparación y GREEN. Si hace falta migrar documentos reales o decidir precedencia entre claves literales y anidadas coexistentes,detener ese punto y presentar la decisión;no inventar una migración.

L01/modo efectivo del template,otros escritores L02 y el resto L12 siguen pendientes en el balance existente. N04/N08/N10 mantienen persistencia/propagación/integración reales. No ampliación a todo el repositorio,ni cambio de idioma aceptado,ni instalación/externos,ni otra reparación. Misma identidad N03;sin crear una tarea nueva para cada campo.

Refutación interna acotada: refutacion_wnext leyó balance,endpoint y lector; incorporados los tres MATERIAL sobre defaults,superficie del lector y semántica SDK/sentinelas. No exige otra auditoría ni ejecución ahora. Revisión distinta de la revisión externa que aceptó W-NEXT;no se atribuye a ésta la selección L02.
