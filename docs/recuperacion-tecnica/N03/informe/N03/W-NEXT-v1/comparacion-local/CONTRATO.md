# W-NEXT: contrato de preparación comparativa

Objetivo autorizado: comparar las dos convenciones en copia local aislada, con Next, NextAuth y auth.config.ts reales, sesiones sintéticas y dependencias existentes; recomendar implementar o detener. No migrar producto. No cerrar N03 ni repetir entregas aceptadas.

Reconocimiento: Next 16.2.9, NextAuth 5.0.0-beta.31; control y configuración cotejables con FUENTES.json anterior. La advertencia y diez casos simulados son evidencia reutilizada, insuficiente para ejecución real. Imagen Docker y complemento SWC de N02 disponibles; sin instalar. Configuración mínima del arnés, no aplicación productiva completa.

Plan/gates de ESTA preparación (distintos de los gates de reparación anteriores):
- P0: custodiar fuentes y montar copias/dependencias/imagen existentes sin red ni entorno real. Preflight comprueba carga, SWC y JWT. Resultado: instrumento viable y fuentes identificadas.
- P1: compilar y servir copia middleware exacta; fijar referencia HTTP y registro. Resultado: accesos/rechazos y matcher observados con Next real.
- P2: compilar y servir proxy con idénticos bytes; aplicar misma población y comparar decisiones. Resultado: preservación o diferencia identificable; advertencia sola insuficiente.
- P3/DONE: desarmar sólo callback en tercera copia manteniendo wrapper/matcher/registro; verificar fallos de autorización, custodiar resultados, revisar y registrar recomendación con límites.

Acceptance Contract: GREEN sólo si las fuentes exactas coinciden, no se toca producto, ambos registros/ejecuciones son reales y comparables, todas las clases observadas preservan resultados, y el mutante pasa arranque/públicos pero falla rechazos privados. RED si falta resultado, hay fallo del instrumento, diferencias no explicadas o mutación insensible. Antes de montaje el evaluador debe dar RED por evidencia inexistente. El RED del mutante debe ser semántico, no fallo de imports/arranque.

Población fija antes de medición: siete públicos exactos, dieciséis prefijos (descendiente y colisión startsWith), página/API privadas con ausente/owner mayúsculas/segundo owner/ajeno/inválido/expirado, agente header ausente/vacío/no vacío y prefijo sin slash, exclusiones de cada extensión y _next/static, _next/image, favicon.ico, y cercanos incluidos .txt/.svg/extra. Excluidos de matcher conservan la respuesta de Next, incluso 404/400 propios para assets internos; no se interpretan como autorización. Destino sintético identificado para todos los demás accesos.

Ejecución observable sin modificar referencia: cookie válida renovada por NextAuth en caminos incluidos y no renovada en excluidos; rechazos privados 401 JSON o307 /login provenientes del callback; handler sintético accesible al desarmar. Manifest real y archivos compilados preservados. Las cookies sintéticas no se comparan byte a byte: se comparan renovación, decisiones, cuerpo y destino estable.

Refutación independiente: revisor refutacion_wnext. MATERIAL incorporados: distinguir ejecución/matcher/destino, expiración -120s mayor que tolerancia15s de fuente real, colisiones startsWith, header vacío y sin slash, mutación mantiene wrapper. No BLOCKER por lectura; la viabilidad y ejecución sólo se aceptan tras medir. Prefijos amplios y header presente son comportamiento heredado, NON-BLOCKING; no se corrigen aquí.

Freeze de objetivo/alcance/plan/contrato: tras RED inicial y preflight estático, antes de corridas comparativas. Autorización actual cubre completar esta preparación. Cambios técnicos del arnés conservan preimagen y resultados fallidos; no cambian el oráculo. STOP si hace falta ampliar alcance, llega85% total sin resets o dos ciclos sin avance material (un único adicional requiere información accionable).

Límites: no Google OAuth real, no credenciales/entorno/rutas completas/Firestore, no despliegue ni certificación integral. La configuración saneada no reproduce todos los headers/consumidores de next.config productivo. El cambio de runtime Edge→Node debe quedar observado en artefactos; no implica equivalencia universal.
