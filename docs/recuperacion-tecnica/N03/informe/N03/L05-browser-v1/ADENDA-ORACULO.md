# Corrección acotada del oráculo de conservación

Primera corrida tras P1:88 controles aprobados; merge-matching falló. El arnés esperaba business.type=barberia tras entregar alias barber. El producto existente normaliza sólo para comparar el nicho; el overlay completo conserva el valor bruto barber.

Se ejecutó únicamente la rebanada merge con tenant.ts de la preimagen, manteniendo el resto del bundle/dependencias/entradas. Reprodujo exactamente el mismo fallo de expectativa:5 controles aprobados y1 fallido, sin errores de página/instrumento. ORACULO-COMPARACION.json compara los cuatro resultados completos de site y overlays original/final: todos idénticos. No se cambió producto para ese fallo.

La expectativa del caso matching pasa a barber, respaldada por ambos resultados. Se conservan RESULTADOS-green-p2.json, RESULTADOS-original-merge-only.json y dos preimágenes del arnés. Objetivo/alcance/política/aceptación congelados no cambian: conservar el merge existente, no normalizarlo por preferencia. La nueva corrida sólo repite merge afectado; los88 controles válidos se conservan. La mutación independiente verifica sensibilidad del guard.

Avance material: defecto de arranque corregido, controles de acceso/tiempo/recarga aprobados; contraste original/final resolvió una expectativa incorrecta con evidencia ejecutada. No estrategia fallida repetida sin información nueva. Revisión interna de Harvey confirmó lectura del diff y pertinencia del contraste, sin atribuirle ejecución.
