# Decisiones vigentes de Liam

Auth: confiar en VITE_FIREBASE_PROJECT_ID configurado por servidor, firma/issuer/aud/vigencia y email verificado vinculado con admin_users backend tenant/rol. No altas ni fallback alternativo. Históricas browser conservadas. Implementación habilitada sólo después de P0.

Cobro: modo/seña desde config tenant, depositAmount unidades menores; inválido/ausente/mayor total rechaza sin2000 fallback ni cobro total. Cardcom cuyo mapeo de moneda no esté demostrado se bloquea antes de cobro, permanece pendiente. Credentials anidado presente autoritativo, vacío/null/malformado nofallback; plano sólo ausente. ApiName independiente de apiKey.

Orden de balance único: agenda→cobro→revisión integrada original. Últimos2puntos reservados. N03 abierta; estas decisiones no son reparaciones ya verificadas. Sin efectos externos,push/deploy,ramas/worktrees ni resets.
