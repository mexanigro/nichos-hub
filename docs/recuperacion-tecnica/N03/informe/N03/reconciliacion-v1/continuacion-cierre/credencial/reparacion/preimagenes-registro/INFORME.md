# L04 credencial Cardcom — STOP de preparación

RESULT: RED (preparación incompleta; NO es un RED semántico ejecutado).
TASK: contrastar editor → payment-credentials persistido → loaders server/API → gateway Cardcom, y proponer reparación mínima.
GATES: reconocimiento/preimágenes y contrato propuesto alcanzados; ejecución válida, freeze de reparación e implementación NO alcanzados.
TESTS: corrida resultados/red inválida por SyntaxError en sondeo.cjs:10; exit1 antes de cargar callbacks. No se cuentan checks, llamadas ni resultados esperados como observados.
BLOCKERS: instrumento no arrancó; STOP general del integrador recibido durante preparación. No hubo nueva corrida ni modificación posterior para eludir STOP.
CHANGES: sólo expediente/preimágenes/instrumento/propuesta. Cero producto.
REMAINING: corregir instrumento bajo continuación autorizada, obtener RED real, refutar precedencia nested/legacy y congelar antes de reparar.

## Evidencia estática concreta, distinta de ejecución

1. payment-provider-editor.tsx/PROVIDERS Cardcom ofrece merchantId/apiKey/terminalNumber, no apiName. onChange guarda por field.key; saveCredentials envía credentials sin conversión de nombre. No hay base para considerar apiKey equivalente a apiName.
2. La ruta GET/PUT payment-credentials admite keys string, recorta whitespace, preserva apiKey ausente entre secretos históricos y persiste `{provider, credentials: merged, updatedAt, updatedBy}`. apiName puede almacenarse como campo separado sin renombrar apiKey. GET sólo enmascara apiKey para Cardcom.
3. Loader server retorna snap.data() plano como PaymentCredentials; API recorre doc.fields y sólo copia stringValue. Ninguno desenvuelve el mapa credentials escrito por el endpoint. Ambos cuerpos fueron preservados; no se proyectó artificialmente nested al gateway para simular una conexión real.
4. buildCardcomGateway requiere creds.terminalNumber y creds.apiName y emite ApiName desde esta última. Guard antes de fetch rechaza si faltan. No se consultó documentación externa ni API; no se interpreta moneda/seña/campo de proveedor por analogía.

Fuentes físicas: preimagenes/editor.tsx, route.ts, server.ts, api.ts, gateway.ts; huellas en PREIMAGENES.json. La autorización complementaria del integrador incorporó explícitamente ambos loaders reales a los tres archivos iniciales para examinar la conexión persistida. No es una investigación general de proveedores.

## Propuesta mínima para refutación, NO implementada

- Editor Cardcom: añadir campo apiName independiente, etiquetado «API Name», explicación «Nombre API requerido por el checkout Cardcom; no es la API Key». Conservar apiKey legacy, máscara y valor; aclarar que no sustituye apiName. No migrar claves ni inferir valores. No tocar moneda/seña/provider ni otras pantallas.
- Escritor: conservar formato nested actual y secretos históricos; no necesita renombrar apiKey para admitir apiName. Confirmar con PUT/GET real y serialización SDK en la continuación.
- Ambos loaders: admitir el mapa credentials del escritor y conservar lectura del documento plano legacy, con una sola regla explícita de precedencia para ambos caminos. No hace falta cambiar el payload Cardcom: ya consume ApiName.

Decisión de precedencia por resolver antes de producto: propuesta nested presente autoritativo, incluso vacío; plano legacy sólo si credentials está ausente. No mezclar terminalNumber de un formato con apiName de otro cuando difieren. null/array/malformado debe tratarse explícitamente, sin volver silenciosamente a un par legacy que pueda ser de otra cuenta. El escritor vigente justifica preferir su mapa; no prueba que todos los documentos mixtos históricos representen la misma cuenta. El integrador debe refutar/adjudicar esta regla compatible dentro del alcance autorizado; sólo si aparece un compromiso real contradictorio, elevar la política a Liam.

## Instrumento y límite de lo obtenido

sondeo.cjs intenta ejecutar metadatos/onChange/saveCredentials literales, PUT/GET reales con NextResponse, batch.set del SDK sin commit, ambos loaders con createCredentialCache real fresca y buildCardcomGateway con fetch interceptado. Docker usa imagen existente/network none, filesystem readonly, dependencias existentes y valores sintéticos. El error de sintaxis evitó toda esa ejecución: ninguna de esas conexiones está probada por esta corrida.

Contrato de preparación conserva objetivos y límites en CONTRATO-PREPARACION.md. El positivo plano legacy estaba previsto como control del montaje, y nested como objetivo de conexión; no son resultados hasta correr válidamente. Sondeo, COMANDO.json, stdout/stderr y exit se conservan sin sobrescribir. No se envió, cobró, leyó DB real ni cargaron credenciales reales. No se descontó L04/D13 ni se editó BALANCE.
