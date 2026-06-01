# WhatsApp Integration — Arquitectura Completa

## 1. Resumen del Ecosistema

```
nichos-hub (Next.js / Railway)          whatsapp-agentkit (Python / Railway)
┌─────────────────────────┐             ┌──────────────────────────┐
│ Dashboard owner         │             │ Agente IA conversacional │
│ - Config WhatsApp       │ Firestore   │ - Lee whatsapp_config    │
│ - Config turnos/staff   │◄──────────►│ - Lee config (servicios) │
│ - Endpoints /api/appts  │   shared    │ - Llama /api/appts/*     │
│ - Status check agente   │             │ - Twilio WhatsApp API    │
└────────┬────────────────┘             └──────────┬───────────────┘
         │ WHATSAPP_AGENT_URL                      │
         │ + AGENT_API_SECRET                      │ Twilio
         └──────────────────┘                      ▼
                                          WhatsApp Business
```

**Comunicacion entre repos:**
- **Firestore** es la fuente de verdad compartida (whatsapp_config, config, appointments)
- **HTTP server-to-server**: el agente Python llama endpoints de nichos-hub con header `x-agent-secret`
- **Status polling**: nichos-hub consulta al agente via `WHATSAPP_AGENT_URL/status`

---

## 2. Firestore: Colecciones WhatsApp

### `whatsapp_config/{clientId}`

Configuracion del agente WhatsApp por cliente. Escrita desde nichos-hub, leida por whatsapp-agentkit.

```typescript
interface WhatsAppConfig {
  clientId: string;
  enabled: boolean;                    // kill-switch del agente
  twilio: {
    phoneNumber: string;              // E.164: +972501234567
  };
  systemPrompt: string;              // instrucciones del agente IA
  personality: {
    tone: "amigable" | "profesional" | "casual";
    useEmojis: boolean;
    language: "auto" | "es" | "he" | "en" | "ru";
  };
  adminPhones: string[];             // E.164, pueden usar #pausa #volver #estado #lead #leads
  pauseState: {
    paused: boolean;
    pausedAt: string | null;         // ISO timestamp
    resumeAt: string | null;         // ISO timestamp (auto-resume)
  };
  leads: Record<string, string>;     // phone -> name, gestionados via #lead
  updatedAt: Timestamp;              // server timestamp
}
```

### `config/{clientId}`

Leida por el agente via `/api/appointments/config` para obtener servicios, staff y business rules.

### `appointments/{docId}`

Creada por el agente via `/api/appointments/book`. Campos: clientId, customerName, customerPhone, serviceId, staffId, date, time, duration, status.

### `daily_manifests/{clientId}_{staffId}_{date}`

Control de colisiones. Array de `{start, end}` intervals ocupados. Actualizado atomicamente en transacciones.

### `calendar_config/{clientId}`

OAuth tokens de Google Calendar. Conectado/desconectado desde la tab WhatsApp del dashboard.

### `customers/{clientId}_{phone}`

Upsert fire-and-forget al reservar turno. Source: "whatsapp".

---

## 3. Endpoints API

### Owner-only (protegidos con `withOwner`)

| Endpoint | Metodo | Funcion |
|----------|--------|---------|
| `/api/whatsapp-config/[clientId]` | GET | Leer config WhatsApp del cliente |
| `/api/whatsapp-config/[clientId]` | PUT | Guardar config (con validacion E.164, tono, idioma) |
| `/api/whatsapp-config/[clientId]/status` | GET | Estado combinado: Firestore + polling al agente remoto |
| `/api/whatsapp-config/[clientId]/test` | GET | Pre-flight check: doc existe, phone valido, prompt cargado, admins, pausa |
| `/api/calendar/[clientId]` | GET | Estado de conexion Google Calendar |
| `/api/calendar/[clientId]` | DELETE | Desconectar + revocar token OAuth |
| `/api/calendar/auth` | GET | Iniciar flujo OAuth Google Calendar |
| `/api/calendar/callback` | GET | Callback OAuth |

### Agent-only (protegidos con `withAgentAuth` via `x-agent-secret`)

| Endpoint | Metodo | Funcion |
|----------|--------|---------|
| `/api/appointments/config` | GET | Servicios, staff (con overrides), business rules |
| `/api/appointments/available` | GET | Slots disponibles para fecha/servicio/staff |
| `/api/appointments/book` | POST | Reservar turno (transaccion atomica con manifest) |
| `/api/appointments/[id]/cancel` | PATCH | Cancelar turno + limpiar manifest |

---

## 4. UI: Tab WhatsApp en el Dashboard

Archivo: `src/components/whatsapp-config-tab.tsx`

El owner accede via `/clients/[clientId]` > tab "WhatsApp". Secciones:

1. **Pre-flight check** — Ejecuta `/api/whatsapp-config/[clientId]/test`, muestra checklist visual
2. **Conexion** — Toggle habilitado + numero Twilio E.164
3. **Personalidad** — System prompt (textarea), tono, idioma, emojis
4. **Telefonos Admin** — Lista editable de numeros E.164 para comandos #pausa/#volver
5. **Estado de Pausa** — Toggle manual + auto-resume con timestamp
6. **Leads** — Solo lectura, se agregan via comando #lead desde WhatsApp
7. **Google Calendar** — Conectar/desconectar OAuth para sincronizar turnos

---

## 5. Environment Variables

```env
# URL del servicio whatsapp-agentkit en Railway
WHATSAPP_AGENT_URL=https://whatsapp-agentkit-production.up.railway.app

# Secreto compartido hub <-> agente (header x-agent-secret)
AGENT_API_SECRET=<uuid>

# Numero de WhatsApp para widget de landing page (formato israelí sin +)
NEXT_PUBLIC_WHATSAPP_NUMBER=9720557719141
```

El agente Python necesita las mismas env vars inversas:
- `HUB_API_URL` (apuntando a nichos-hub)
- `AGENT_API_SECRET` (mismo valor)
- Credenciales Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- Credenciales Firebase (para leer whatsapp_config directamente)

---

## 6. Flujo de Activacion de un Cliente

```
1. Owner crea cliente en nichos-hub
2. Owner va a tab WhatsApp del cliente
3. Configura:
   - Numero Twilio E.164 (ya provisionado en Twilio Console)
   - System prompt personalizado
   - Tono, idioma, emojis
   - Telefonos admin (del dueno del negocio)
4. Habilita el toggle "Activo"
5. Guarda → PUT /api/whatsapp-config/{clientId}
6. Ejecuta pre-flight test → valida doc, phone, prompt, admins
7. El agente Python (ya corriendo en Railway) detecta el doc en Firestore
   y empieza a responder mensajes al numero Twilio configurado
8. Opcionalmente conecta Google Calendar para sincronizar turnos
```

---

## 7. Flujo de un Mensaje WhatsApp (runtime)

```
Cliente escribe via WhatsApp
        ↓
Twilio recibe → webhook → whatsapp-agentkit (Python)
        ↓
Agente lee whatsapp_config/{clientId} de Firestore
  - Si enabled=false → ignora
  - Si pauseState.paused=true → ignora (o responde "estamos ocupados")
  - Si el remitente esta en adminPhones → procesa comandos (#pausa, #volver, #estado, #lead)
        ↓
Agente usa systemPrompt + personality para generar respuesta con LLM
        ↓
Si el cliente pide turno:
  1. GET /api/appointments/config → servicios, staff, business rules
  2. GET /api/appointments/available → slots libres
  3. POST /api/appointments/book → reservar (transaccion atomica)
  4. Si hay Google Calendar → crear evento en el calendario
        ↓
Twilio envia respuesta al cliente via WhatsApp
```

---

## 8. Seguridad

- **Owner endpoints**: protegidos con `withOwner()` (next-auth Google OAuth, verifica OWNER_EMAIL)
- **Agent endpoints**: protegidos con `withAgentAuth()` (header `x-agent-secret` vs `AGENT_API_SECRET`)
- **Validacion de input**: E.164 regex, CLIENT_ID_RE alfanumerico, tonos/idiomas en whitelist
- **Null → FieldValue.delete()**: replaceNullsWithDelete previene campos zombie en Firestore
- **Transacciones atomicas**: reserva de turnos + manifest en una transaccion para evitar overbooking
- **Cleanup en DELETE cliente**: se borra `whatsapp_config/{clientId}` junto con el cliente (pero NO se libera el numero Twilio — accion manual)

---

## 9. Problemas y Mejoras Detectadas

### Problemas actuales

1. **No hay tipo `WhatsAppConfig` en validacion server-side**: el endpoint PUT valida campos individuales con regex/sets, pero no fuerza el schema completo. Un body parcial malformado podria quedar guardado.

2. **El status del agente es best-effort**: si `WHATSAPP_AGENT_URL` no esta configurado, el endpoint `/status` retorna `online: false, reason: not_configured` — el owner no puede distinguir "no configurado" de "agente caido".

3. **No hay webhook de confirmacion**: cuando el agente reserva un turno, no hay notificacion push al owner ni al cliente (solo la respuesta en el chat de WhatsApp).

4. **Leads solo via #lead**: los leads registrados en `whatsapp_config.leads` solo se agregan desde WhatsApp con el comando admin. No hay forma de importarlos desde el dashboard.

5. **Calendar disconnect no limpia whatsapp_config**: si desconectas Google Calendar, el agente podria seguir intentando crear eventos (depende de la implementacion en Python).

---

## 10. Plan para Templates y Voice

### A. WhatsApp Templates (notificaciones automaticas)

**Que son**: mensajes pre-aprobados por Meta que se pueden enviar fuera de la ventana de 24h (recordatorios de cita, confirmaciones, etc.)

**Que se necesita en nichos-hub:**

1. **Coleccion Firestore `whatsapp_templates/{clientId}`**:
   ```typescript
   interface WhatsAppTemplate {
     clientId: string;
     templates: {
       appointment_reminder: {
         enabled: boolean;
         hoursBeforeAppointment: number; // ej: 24
         twilioTemplateSid: string;      // SID del template en Twilio
       };
       appointment_confirmation: {
         enabled: boolean;
         twilioTemplateSid: string;
       };
       appointment_cancellation: {
         enabled: boolean;
         twilioTemplateSid: string;
       };
     };
   }
   ```

2. **UI: seccion "Templates" en la tab WhatsApp**:
   - Toggle por template (recordatorio, confirmacion, cancelacion)
   - Horas antes del recordatorio (slider/input)
   - Preview del template

3. **Endpoint `/api/whatsapp-config/[clientId]/templates`**:
   - GET/PUT para leer/guardar config de templates

4. **En whatsapp-agentkit**:
   - Cron job que lee `appointments` proximos + template config
   - Envia mensajes template via Twilio Content API
   - Registra envio para no duplicar

5. **Templates en Twilio**:
   - Crear Content Templates en Twilio Console (o via API)
   - Someterlos a aprobacion de Meta
   - Los SIDs se configuran en nichos-hub

### B. Voice AI (ConversationRelay)

**Que es**: agente de voz que atiende llamadas usando Twilio ConversationRelay + LLM.

**Que se necesita en nichos-hub:**

1. **Coleccion Firestore `voice_config/{clientId}`**:
   ```typescript
   interface VoiceConfig {
     clientId: string;
     enabled: boolean;
     twilio: {
       phoneNumber: string;           // puede ser el mismo que WhatsApp o diferente
     };
     systemPrompt: string;            // puede heredar del de WhatsApp
     personality: {
       voice: "male" | "female";      // voz TTS
       language: string;
       greeting: string;              // mensaje de bienvenida
     };
     routing: {
       afterHoursToVoicemail: boolean;
       transferToHuman: string;       // numero para transferir
     };
   }
   ```

2. **UI: nueva tab "Voz" o seccion dentro de WhatsApp**:
   - Toggle habilitado
   - Numero de telefono
   - System prompt (heredable del de WhatsApp)
   - Voz, idioma, saludo
   - Reglas de routing (fuera de horario, transferencia)

3. **Endpoints**:
   - `/api/voice-config/[clientId]` — GET/PUT
   - `/api/voice-config/[clientId]/test` — pre-flight check

4. **En whatsapp-agentkit (o nuevo servicio)**:
   - Handler de TwiML para ConversationRelay
   - Webhook de Twilio Voice apuntando al agente
   - Integracion con el mismo sistema de turnos (mismos endpoints /api/appointments/*)

5. **Shared concerns con WhatsApp**:
   - Mismo sistema de turnos (appointments, manifests)
   - Mismo `AGENT_API_SECRET`
   - Misma coleccion `config/{clientId}` para servicios/staff
   - System prompt podria tener base compartida + override por canal

### C. Arquitectura sugerida para ambos

```
nichos-hub
├── whatsapp_config/{clientId}     ← existente
├── whatsapp_templates/{clientId}  ← nuevo
├── voice_config/{clientId}        ← nuevo
├── /api/appointments/*            ← compartido (ya existe)
└── UI: tab WhatsApp expandida + tab Voz

whatsapp-agentkit
├── WhatsApp handler               ← existente
├── Template cron sender           ← nuevo
└── Voice handler (ConversationRelay) ← nuevo
```

Las tres capacidades (chat, templates, voice) comparten:
- El sistema de turnos en nichos-hub
- Credenciales Twilio
- Firestore como fuente de verdad
- `withAgentAuth` para autenticacion server-to-server
