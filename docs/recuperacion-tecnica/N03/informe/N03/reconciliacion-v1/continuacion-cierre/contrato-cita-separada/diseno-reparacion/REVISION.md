# Refutación independiente y adjudicación

Revisor refutacion_wnext, sólo lectura, sin suites. Objeto: diseño de autenticación, convivencia histórica e identidad de acciones; no revisó ni certificó producto implementado.

- MATERIAL: coincidencia física sin origen operativo definido podía reducir acceso histórico al escoger backend. Corregido: fila única opera mediante browser; control explícito con ausencia de membresía backend.
- MATERIAL: cambiar issuer de notify afecta también altas e históricas browser. Corregido: conservar emisor admitido actual y añadir sólo emisor navegador configurado; selección exacta, sin fallback tras rechazo; controles de los dos más tercero adverso y misma membresía.
- Decisión necesaria: confianza en issuer navegador y vínculo por email verificado con membresía backend. Conservar admin_users no es en sí una política nueva; admitir otra autoridad de identidad sí. Pregunta reformulada, contrato no congelado.
- Límite de avisos: same-ID entre bases no impide verificar despachos locales por payload/origen, pero no certifica identidad global, deduplicación o entrega externa; agentkit no se amplía.

Integración comprobada por lectura de la propuesta final. No quedan defectos estructurales conocidos del diseño; sigue condición necesaria de política no decidida. No se interpreta consenso como autorización ni GREEN funcional.

Gates de esta preparación: P0 diagnóstico vigente reutilizado; P1 diseño concreto; P2 refutación integrada: alcanzados. P3 contrato congelable: pendiente decisión de confianza. 3/4, RED para avanzar a implementación. Fuentes7/7 sin deriva; producto sin editar; nuevos controles funcionales NO EJECUTADOS. Tipos/lint no corresponden a cambio exclusivamente documental.
