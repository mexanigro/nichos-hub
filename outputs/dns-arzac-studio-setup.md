# Setup DNS de arzac.studio en Resend

Guía paso a paso para verificar el dominio `arzac.studio` en Resend y empezar a
mandar emails transaccionales en producción (Railway).

**Estado actual** (verificado con `scripts/check-resend-domain.mjs`):

- Dominio `arzac.studio` → **agregado en Resend** (ID: `dda6fd13-23cc-484b-8afd-2342ccff0c5f`).
- Región: **us-east-1**.
- Status: **`not_started`** (3/3 records DNS faltan).

Una vez publiques los records de la sección 2, Resend tarda 5–30 min en verificar.

---

## 1. Cómo agregar el dominio en Resend

> Si en la consulta del script ves `not_added` (no es nuestro caso ahora, pero
> queda documentado para futuros dominios):

1. Entrar a https://resend.com/domains con la cuenta del owner.
2. Click **Add Domain** (botón arriba a la derecha).
3. Pegar `arzac.studio` (sin `https://`, sin `www`).
4. Elegir región. Para Israel/EU **`eu-west-1`** suele dar mejor latencia,
   pero el dominio actual ya está en **`us-east-1`** — no migres si ya está
   creado, solo aplica para dominios nuevos.
5. Click **Add**. Resend genera 3 records DNS (DKIM, SPF MX, SPF TXT).

## 2. DNS records a pegar

Estos son los records exactos que devuelve la API de Resend para `arzac.studio`
hoy. Pegalos en el DNS provider donde apuntan los NS del dominio.

### Record 1 — DKIM (TXT)

| Campo | Valor |
|-------|-------|
| Type | `TXT` |
| Host / Name | `resend._domainkey` |
| Value / Content | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCifsiNG2/PjLzZgnvbylY5/y5YDfTwi+La3ASaO71cKixbXXpZ12efzNFiPGPcIuWp24RYe0TXa63/h+UBBAcu4HrPO7LcFYPry3P3S5/uScO1Gk1MQDPWu4y+QXolejfctg4l60/MBYmNfqOQDNof3hCmmlVPZ607w4cjFPe+WwIDAQAB` |
| TTL | `Auto` (o `3600`) |
| Priority | — |

> **Cloudflare:** Type=TXT, Name=`resend._domainkey`, Content=el value tal cual
> (sin comillas externas). Proxy no aplica para TXT.
>
> **Namecheap/GoDaddy:** TXT Record, Host=`resend._domainkey`, Value=el value.
> Algunos providers truncan a 255 chars — Resend ya devuelve el value bajo el
> límite, no hay que splittearlo.

### Record 2 — SPF (MX)

| Campo | Valor |
|-------|-------|
| Type | `MX` |
| Host / Name | `send` |
| Value / Content | `feedback-smtp.us-east-1.amazonses.com` |
| Priority | `10` |
| TTL | `Auto` (o `3600`) |

> **Cloudflare:** MX Record, Name=`send`, Mail server=`feedback-smtp.us-east-1.amazonses.com`, Priority=`10`.
>
> **Namecheap/GoDaddy:** MX Record con Host=`send`, Priority=`10`, Value=el FQDN.

### Record 3 — SPF (TXT)

| Campo | Valor |
|-------|-------|
| Type | `TXT` |
| Host / Name | `send` |
| Value / Content | `v=spf1 include:amazonses.com ~all` |
| TTL | `Auto` (o `3600`) |
| Priority | — |

> **Cloudflare:** Type=TXT, Name=`send`, Content=`v=spf1 include:amazonses.com ~all`.
>
> **Namecheap/GoDaddy:** TXT Record con Host=`send` y Value=`v=spf1 include:amazonses.com ~all`.

### Importante sobre SPF apex

Los records 2 y 3 son SPF **del subdominio `send.arzac.studio`** (lo usa Resend
internamente como envelope-sender path). **No tocan SPF del apex `arzac.studio`**,
así que si ya tenés un SPF del apex (Google Workspace, Mailchimp, etc.), no hay
conflicto.

Si no tenés ningún SPF en el apex y querés que mails enviados *como* `@arzac.studio`
(no solo desde el sub-domain de Resend) pasen SPF estricto, en el futuro vas a
querer agregar un TXT en `@` con `v=spf1 include:amazonses.com ~all` también —
pero **no es necesario** para que Resend marque el dominio como verified.

### DMARC (opcional, recomendado a futuro)

Resend no exige DMARC pero ayuda a la entregabilidad. Cuando el dominio esté
verified, considerá agregar:

| Type | Host | Value |
|------|------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:website@arzac.studio` |

`p=none` solo reporta (no rechaza). Subir a `p=quarantine` después de 2–4 semanas
sin reportes raros.

---

## 3. Verificación

Después de publicar los 3 records (paso 2):

```bash
node scripts/check-resend-domain.mjs
```

Salida esperada cuando esté listo:

```
Dominio: arzac.studio
Status:  verified (verified)

✅ Listo, podes activar EMAIL_PROVIDER=resend en produccion.
```

Si todavía sigue `pending`, el script te lista qué record específico falta. Resend
re-chequea automáticamente cada minuto durante las primeras horas; después podés
forzar un re-check desde la UI: https://resend.com/domains → click en el dominio
→ botón **Verify DNS Records**.

### Activar Resend en Railway

Cuando el script reporte `verified`:

1. Railway → nichos-hub → Variables.
2. Setear `EMAIL_PROVIDER=resend`.
3. Confirmar que `RESEND_API_KEY` ya existe (debería).
4. Opcional: ajustar `EMAIL_FROM` (default: `"Liam de Arzac Studio <hola@arzac.studio>"`).
5. Re-deploy.
6. Mandar un email de prueba con `scripts/test-resend-send.mjs payment` apuntando
   a `TEST_EMAIL_TO=liam.arzac@gmail.com`.

---

## 4. Troubleshooting

**Sigue pending después de 30 min.**

- DNS no propagó. Chequear desde la línea de comandos:
  ```bash
  nslookup -type=TXT resend._domainkey.arzac.studio
  nslookup -type=TXT send.arzac.studio
  nslookup -type=MX  send.arzac.studio
  ```
  Si no aparece el value que pegaste, el record no está propagado todavía
  (puede tardar hasta 24h en casos raros, pero típicamente 5–15 min).

- TTL muy alto del record viejo. Si ya tenías un TXT en `send` con otro contenido,
  cachés intermedias pueden estar reteniéndolo. Bajá el TTL del record viejo a
  300 antes de cambiarlo, esperá 1h, y recién ahí cambialo.

- Cloudflare con Proxy=ON en CNAME. Para CNAME tiene que estar en gris (DNS only).
  TXT/MX no se proxiean nunca.

**Conflicto con SPF existente del apex.**

Resend no toca el SPF del apex (sus records van en `send`). Si tenés problemas de
entregabilidad mandando desde `hola@arzac.studio`, puede ser porque el `MAIL FROM`
real es `bounces@send.arzac.studio` (de Amazon SES) y el apex no incluye
`amazonses.com` en SPF. Solución: agregar un TXT en `@` con
`v=spf1 include:amazonses.com include:_spf.google.com ~all` (ajustando los
includes según los otros remitentes que uses).

**Resend dice verified pero los emails llegan a spam.**

- Mandá un test a https://mail-tester.com y revisá el reporte.
- Verificá que el `From:` use un email del dominio verificado (no `gmail.com`).
- Considerá agregar DMARC (sección 2).

**El script tira `not_added` después de ya haber agregado el dominio.**

- Estás en otra workspace de Resend. La API key tiene que ser de la misma cuenta
  donde está el dominio. Confirmá en https://resend.com/api-keys de qué team es.

---

## 5. Referencias internas

- Sistema de email: `src/lib/email.ts`.
- Templates: `src/lib/email-templates.ts`.
- Test runtime end-to-end: `scripts/test-resend-send.mjs`.
- Health check del owner dashboard: `GET /api/email/health`.
