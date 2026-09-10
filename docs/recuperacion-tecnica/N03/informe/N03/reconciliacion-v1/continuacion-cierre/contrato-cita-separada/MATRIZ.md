# Recorrido local de la misma cita

Todos los destinos, tenants y contenidos son sintéticos. En las cinco filas HTTP200, clientId persistido/filtrado=tenant-local y respuesta appointmentId igual al ID generado por la referencia Admin.

| Caso | Escritura efectiva backend | Lectura efectiva CRM | Cita recibida |
| --- | --- | --- | --- |
| coincidente-control | backend-project/appointments-db/appointments/uTf3D0FZnrYffxmvpG18 | backend-project/appointments-db/appointments | Sí, mismo ID y contenido |
| base-separada | backend-project/appointments-db/appointments/5EthmIRedjHTWDY59V5O | backend-project/web-db/appointments | No; loaded=true, error=null |
| proyecto-separado | backend-project/appointments-db/appointments/CyEJDAVPB0KyIthwbILW | web-project/appointments-db/appointments | No; loaded=true, error=null |
| ambos-separados | backend-project/appointments-db/appointments/UTTrHCEvEoZFELl4VpeT | web-project/web-db/appointments | No; loaded=true, error=null |
| default-distinto | backend-project/default/appointments/kjZbjBcyH4KMlW8dzAXG | backend-project/(default)/appointments | No; loaded=true, error=null |

Identidad completa: proyecto/base/appointments/id. Query SDK real: where clientId==tenant-local, orderBy createdAt desc, limit500. onSnapshot entrega el snapshot modelado al subscriber y callbacks reales extraídos de AdminDashboard. No render React ni Firestore remoto.
