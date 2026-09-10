# Remanente L02: inspección local de patches con puntos

Alcance: obligación adjudicada DEUDA L02 de inspeccionar patches con puntos antes de normalizar. POST onboarding/client-info ya aceptado: su suite, reparación y mutaciones no se repitieron. No producto, migración, DB ni framework nuevo.

Población efectiva: 17 rutas de hub/src/app/api con merge:true literal, más onboarding/route.ts previamente identificado por brand.logo. Los 18 paths, hashes, 28 llamadas set con merge y sus argumentos están en L02-POBLACION.json. l02-lectura.cjs hace sólo lectura AST y guarda el censo acotado; el parseo inválido falla. No importa handlers ni ejecuta sus efectos.

Resultado: no se encontraron propiedades propias literales con puntos ni asignaciones de literal con puntos destinadas a set merge en esa población. La única construcción propia identificada es onboarding/route.ts:192, "brand.logo": svgDataUrl, dentro de db.collection("config").doc(slug).update. Esa operación no es el defecto de client-info: update interpreta strings como field paths.

Fuente SDK instalada: @google-cloud/firestore/build/src/write-batch.js:384 utiliza FieldPath.fromArgument(key) en update; path.js:545–550 construye segmentos mediante fieldPath.split('.'). set merge utiliza DocumentMask.fromObject, cuya diferencia literal/anidado fue medida con SDK real en L02-client-info-v1 y quedó aceptada con la reparación del endpoint. No se ejecutó commit ni se reprodujo la suite anterior. El update de logo exige documento existente, semántica conservada; no sustituirlo por set ni normalizarlo como arreglo.

Los demás destinos observados construyen objetos anidados o claves simples. config PUT y WhatsApp config pueden recibir objetos de usuario y recorrer sus claves; esta lectura no certifica todo payload arbitrario ni afirma que exista un productor con claves con puntos donde no fue observado. Los arrays/mapas raw recibidos se conservan según contrato de cada endpoint, no se normalizan por esta inspección.

Descuento admisible: inspección del remanente de claves literales propias en estos 18 productores, con ausencia de otro defecto set-merge demostrado, más POST client-info ya aceptado. No equivale a certificar todos los escritores del repositorio, scripts/lib externos a la población, datos históricos, permisos, merge/SAFE general ni la familia L02/L12 completa. Las obligaciones restantes se juzgan por su contrato existente, no se transforman en una nueva auditoría.
