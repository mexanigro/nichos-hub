# Control fijo L12 dentro de N03

Obligación: respetar allow-list visibleServices documentada en hub/docs/config-remote.md, hasta selección efectiva y render BookingWizard. Ausencia/null→preset; array vacío→ninguno; desconocidos se ignoran sin restaurar preset; válidos/mixtos→sólo conocidos en orden. No cambiar política de modo, defaults fuera de lista, SAFE, idioma ni otros campos. Null de hojas ordinarias sigue contrato mergeDeep vigente (no borra); horas tienen semántica wholesale separada no modificada.

6nichos×3entradasbusiness.type (igual, ausente, otro)×7casoslista (ausente,null,vacío,desconocidos,válidos,mixtos,todos). Idiomas en/he/ru/ar. Bootstrap real, site/presets reales, SSR BookingWizard real con DB/IA interceptadas y efectos pasivos de React sin ejecutar. Verificar arrays efectivos y nombres renderizados; imágenes/override de precios de servicio alineados, campos ajenos. Positivos y sensibilidad quitando filtro en copia. RED previo exige servicios visibles que no estaban permitidos. No proveedores reales.

Conservación staff: enableStaffPages=false debe renderizar aviso deshabilitado incluso ruta directa; showTeam es bandera de sección, no se redefine como permiso. Probar consumidor público propio, sin reabrir controles Auth aceptados.
