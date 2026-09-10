# Caracterización y representación de selectores — versión 4

Fuente: `46345f4505756599d69ae6cbc9d588271aba6b65`. Esta versión conserva [v3](SELECTORES-FUENTE-v3.md) y corrige OBS-N02-L-01.

## Resultado original por consumidor

Cada política mantiene su tipo y fallback exactos. Browser tenant, server tenant y WhatsApp terminan en `""`; Firebase browser usa `fromEnv`, que también convierte ausencia a `""`; las bases terminan en `default`; nicho, idioma y demo producen sus defaults tipados. Kill-switch, pago REST, REST general y Admin no tienen fallback final de proyecto: cuando todas sus variables están ausentes, el resultado original es `undefined`.

No se sustituye `undefined` por `""` antes de entregar el resultado al consumidor. El consumidor no recibe el valor serializado. Los chequeos falsy actuales recorren la misma rama para ambos valores, pero eso sólo describe esos puntos del commit: no acredita equivalencia de tipo, serialización ni consumidores futuros.

## Capa de serialización diagnóstica

La normalización ocurre únicamente al formar la respuesta de diagnóstico, después de obtener y preservar el valor original:

- `undefined` → `{ state: "absent", source }`;
- `""` → `{ state: "empty", source }`;
- cualquier otro valor, incluido `false` → `{ state: "selected", source, value }`.

`source` identifica la variable decisiva o el literal `literal-empty`/`literal-default`. Las respuestas pueden incluir el valor seleccionado de los selectores allowlist. Los logs sólo incluyen `state` y `source`; no valores. Así `JSON.stringify` no elimina la ausencia ni la confunde con vacío.

La implementación N02-L debe producir una sola resolución por política que entregue `{ value, source }`: el consumidor usa `value` y la sonda aplica la capa de serialización sobre ese mismo resultado. No habrá una segunda resolución silenciosa para el diagnóstico ni una prioridad común entre consumidores.

## Acreditación y límites

La fidelidad preparatoria compara el valor original con `Object.is`, además de comparar la representación etiquetada completa. Los cuatro casos conservan 52 resultados originales y sus fuentes. Esas 52 comparaciones acreditan el modelo puro contra expectativas documentadas y fijas; no equivalen a ejecutar de forma independiente los trece fragmentos del producto. En la reproducción específica, los doce resultados de proyecto se contrastan independientemente: nueve coinciden y tres muestran el defecto; los otros cuarenta resultados son identidad heredada del modelo r4. El caso `ausencias` espera `undefined` en `killSwitchProject`, `restProject` y `adminProject`; espera `""` donde el código tiene fallback vacío.

Los adversos deben detectar: colapsar `undefined` a vacío, perder una propiedad al serializar, cambiar `source`, fallback o prioridad. Esta tabla y el control prueban el diseño documental. Las cadenas de proyecto afectadas están respaldadas por huellas y patrones del commit; la equivalencia de los demás selectores y de la implementación futura sigue NO VERIFICADA hasta construir N02-L y medir ambos lados sin importar módulos con efectos.

## Consumidores estudiados

- kill-switch y pago REST: ausencia de proyecto activa sus retornos falsy propios;
- REST general: ausencia produce retorno silencioso o error, según función;
- Admin: ausencia impide inicialización y produce `database_unavailable`/`null`;
- Firebase browser: `fromEnv` devuelve vacío y la validación marca configuración incompleta;
- WhatsApp: conserva selección raw antes del trim, incluida la cadena de espacios que bloquea su fallback.

La posible unificación funcional continúa en N03. OBS-N02-L-01 no crea una obligación fuera de N02: cambia el contrato del instrumento y su comprobación dentro de N02-L.
