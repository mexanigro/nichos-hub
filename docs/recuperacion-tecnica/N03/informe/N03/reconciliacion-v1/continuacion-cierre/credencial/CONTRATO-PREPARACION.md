# L04: captura y lectura de apiName Cardcom

Preparación solamente. Fuente: editor PROVIDERS/onChange/saveCredentials, ruta payment-credentials GET/PUT, loaders getPaymentCredentials server/API y buildCardcomGateway/createCredentialCache. Dependencias reales existentes; NextResponse, serialización Firestore sin commit y transporte Cardcom interceptado. Docker sin red, credenciales sintéticas. No editar producto ni decidir moneda/seña/provider.

Objetivo observado: editor ofrece apiName separado de apiKey legacy; guardar y releer nested emitido por escritor debe hacer llegar apiName/terminalNumber al gateway sin reinterpretar apiKey. Alta/reeedición con apiKey histórico conservado y enmascarado; payload ApiName deriva sólo de apiName. Documento plano legacy sigue utilizable. Documento nested del escritor no puede perderse en loader. RED identifica ausencia de campo editor y/o pérdida efectiva en carga y rechazo del gateway.

Preparación no congela precedencia nueva sin refutación: propuesta nested presente (incluso mapa vacío) autoritativo; plano legacy sólo cuando no hay campo credentials. No combinar campos de pares de credenciales de generaciones distintas. null/array no son formato vigente, no convertir apiKey en apiName. Casos de conflicto serán contrato de futura reparación tras revisión.

Límites: auth withOwner simulado con owner sintético, no certifica auth/rules. SDK conserva serialización/proto, DB en memoria; no commit. Editor usa metadatos y callbacks literales extraídos AST; no navegador completo. Ambos loaders con cache real fresca y DB/fetch controlados. SDK/proveedor/moneda/seña reales no certificados. Positivo gateway plano sirve control del montaje; no se proyecta artificialmente nested al gateway sustituyendo loaders.
