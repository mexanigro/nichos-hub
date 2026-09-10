# Matriz local de destinos efectivos

35 entradas fijas; cada una ejecuta ambos accesores Admin y los tres helpers REST. La tabla resume; RESULTADO.json conserva 175 filas, URL completa, método, app y referencia. Ausente se representa omitiendo la propiedad; vacío y blancos conservados en CASOS.json.

| Caso | Admin server / API (ambos) | REST POST / GET / PATCH |
|---|---|---|
| coincidentes-ausencia-base | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| proyecto-rest-ausente | [DEFAULT] → project-a/default | Create: undefined / GetDocument: error / PatchDocument: error |
| proyecto-admin-ausente | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| base-ausente | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| rest-fallback-vite-ausente | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| email-ausente | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| clave-ausente | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| proyecto-rest-vacio | [DEFAULT] → project-a/default | Create: undefined / GetDocument: error / PatchDocument: error |
| proyecto-admin-vacio | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| base-vacio | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| rest-fallback-vite-vacio | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| email-vacio | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| clave-vacio | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| proyecto-rest-blancos | [DEFAULT] → project-a/default | Create: undefined / GetDocument: error / PatchDocument: error |
| proyecto-admin-blancos | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| base-blancos | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| rest-fallback-vite-blancos | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| email-blancos | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| clave-blancos | error app/invalid-credential | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| fallback-next | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| mirrors-iguales | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| proyectos-contradictorios | [DEFAULT] → project-a/default | Create: project-b/databases/default; undefined / GetDocument: project-b/databases/default; document / PatchDocument: project-b/databases/default; undefined |
| trim | [DEFAULT] → project-a/named | Create: project-a/databases/named; undefined / GetDocument: project-a/databases/named; document / PatchDocument: project-a/databases/named; undefined |
| base-vite | [DEFAULT] → project-a/named | Create: project-a/databases/named; undefined / GetDocument: project-a/databases/named; document / PatchDocument: project-a/databases/named; undefined |
| bases-contradictorias | [DEFAULT] → project-a/primary | Create: project-a/databases/primary; undefined / GetDocument: project-a/databases/primary; document / PatchDocument: project-a/databases/primary; undefined |
| base-default-explicita | [DEFAULT] → project-a/(default) | Create: project-a/databases/(default); undefined / GetDocument: project-a/databases/(default); document / PatchDocument: project-a/databases/(default); undefined |
| app-igual | existing → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| app-ajena | existing → project-b/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| apps-ajena-primera | foreign → project-b/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| apps-igual-primera | matching → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| app-sin-env-admin | null | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| app-clave-blancos | existing → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; document / PatchDocument: project-a/databases/default; undefined |
| sin-token | [DEFAULT] → project-a/default | Create: undefined / GetDocument: error / PatchDocument: error |
| http404 | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; null / PatchDocument: project-a/databases/default; error |
| http403 | [DEFAULT] → project-a/default | Create: project-a/databases/default; undefined / GetDocument: project-a/databases/default; error / PatchDocument: project-a/databases/default; error |
