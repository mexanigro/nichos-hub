# Contrato local de autenticación — RED previo a producto

Contrato ejecutable: `contrato.cjs`, expectativas fijadas antes de correr. Interfaz aprobada: `verifyFirebaseIdToken(token, expectedProjects?: readonly string[])` y cuarto argumento equivalente de `requireAdminAuth`. Lista vacía rechaza; omisión conserva selección legacy. Lista cerrada de avisos admite backend y navegador sin reintentar contra otro emisor después de un fallo.

Preparación acotada, sin producto. Fuente literal anterior: `preimagenes/admin-auth.ts`. FREEZE.json conserva la primera versión instrumental; FREEZE-r2.json registra la corrección sintáctica previa al resultado semántico. Ninguna expectativa fue cambiada. Un identificador de imagen mal transcrito se corrigió antes de ejecutar; su script anterior está en `preimagenes/ejecutar-pre-ejecucion.ps1`. Primera ejecución `resultados/red` falló al parsear por un paréntesis faltante (sin validar producto); código conservado en `preimagenes/contrato-r1.cjs`. Una corrección y repetición produjeron `resultados/red-r2/RESULTADO.json`.

## Resultado observado

38 casos, 61 comprobaciones ejecutadas, 26 fallos: **RED**, Docker exit 1. No error del instrumento en r2. La cantidad de comprobaciones puede crecer cuando el gate alcanza lookups positivos: la normalización de email se verifica adicionalmente cuando el lookup esperado se ejecuta; los 38 casos son fijos.

- Proyecto web explícito no aceptado; backend aceptado aunque excluido; lista vacía ignorada.
- Lista de avisos no acepta web en el gate actual.
- La opción explícita todavía no endurece exp/iat ausentes, string o null pertinentes. Se exige validación numérica únicamente en la rama scoped; no se redefine la conducta global legacy.
- Los rechazos de membresía/email y el éxito de pending no alcanzan el lookup desde issuer web porque el gate actual ignora la opción. Se registran como fallos por consecuencia de esa desconexión, no como defectos independientes de política.
- Selección legacy backend, rechazo legacy web y gate legacy owner conservados en los controles.

Firma RSA real de 2048 bits y verificación criptográfica real sobre el módulo transpilado. Cert-fetch se intercepta únicamente para la URL exacta del verificador. Casos adversos: firma, alg/kid, issuer/aud exactos, mismo uid de issuer extranjero, sub ausente, exp/iat y email verificado. No se guardan claves privadas/tokens en resultados; son sintéticos y existen sólo en memoria del proceso.

## Reejecución

Desde PowerShell: `& .\ejecutar.ps1 -Nombre green` dentro de esta carpeta. Nombre de salida nuevo obligatorio; nunca sobreescribe un resultado. COMANDO.json de cada corrida conserva argumentos Docker exactos. Imagen local fija, --pull=never, --network=none, mounts fuente/dependencias readonly y sólo salida escribible.

## Límites y trabajo integrado pendiente

Lookup de membresía interceptado con ausente, active, pending y removed; se verifica su invocación sólo tras identidad válida y email normalizado. **No acredita tenant/rol en los wrappers de server.ts/api/index.ts**: el gate confía en el tipo de su lookup y esos filtros corresponden a los wrappers reales. El contrato integrado debe cubrir otro tenant y rol inválido sin sustituir el filtro por un stub que ya rechaza.

No rutas HTTP, DB, Auth Firebase remoto, certificados reales, permisos/rules, render, instalaciones ni red. P0 global no queda completo por este RED. Mutación del guard de issuer en memoria pendiente para después de la implementación, sin cambiar expectativas. No se produjo ni se declaró reparación.
