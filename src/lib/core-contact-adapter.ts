export type CoreContactCreate = {
  operationId: string;
  clientId: string;
  entryPoint: string;
  fields: {
    fullName: string;
    channel: string;
    email: string | null;
    phone: string | null;
    notes?: string;
    tags?: string[];
    stage?: string | null;
  };
};

export type CoreContactReceipt = { key: string; revision: number; recovered: boolean };
export type CoreContactSummary = { active: number; archived: number; total: number; coverage: "all-allowlisted-sources" };

export class CoreContactAdapterError extends Error {
  status: number;
  code: string;
  uncertain: boolean;
  constructor(status: number, code: string, uncertain = false) {
    super(code);
    this.status = status;
    this.code = code;
    this.uncertain = uncertain;
  }
}

export type CoreContactAdapterConfig = {
  baseUrl: string;
  credential: string;
  issuer: string;
  uid: string;
  tenants: ReadonlySet<string>;
  entryPoints: ReadonlySet<string>;
  request?: typeof fetch;
};

const ID = /^[a-zA-Z0-9_-]{16,160}$/;
const TENANT = /^[a-zA-Z0-9_-]+$/;

function list(value: string | undefined): ReadonlySet<string> {
  return new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean));
}

export function coreContactAdapterFromEnvironment(request: typeof fetch = fetch) {
  const baseUrl = process.env.CRM_CORE_CONTACT_URL?.replace(/\/+$/, "") ?? "";
  const credential = process.env.CRM_CORE_CONTACT_SECRET ?? "";
  const issuer = process.env.CRM_CORE_CONTACT_ISSUER ?? "";
  const uid = process.env.CRM_CORE_CONTACT_UID ?? "";
  if (!baseUrl || !credential || !issuer || !uid) throw new CoreContactAdapterError(503, "contact_adapter_unavailable");
  return createCoreContactAdapter({
    baseUrl,
    credential,
    issuer,
    uid,
    tenants: list(process.env.CRM_CORE_CONTACT_TENANTS),
    entryPoints: list(process.env.CRM_CORE_CONTACT_ENTRYPOINTS),
    request,
  });
}

export function createCoreContactAdapter(config: CoreContactAdapterConfig) {
  const request = config.request ?? fetch;

  function assertScope(clientId: string, entryPoint: string): void {
    if (!TENANT.test(clientId) || !config.tenants.has(clientId) || !config.entryPoints.has(entryPoint)) {
      throw new CoreContactAdapterError(403, "contact_adapter_scope");
    }
  }

  function headers(clientId: string, entryPoint: string): Record<string, string> {
    return {
      Authorization: `Service ${config.credential}`,
      "Content-Type": "application/json",
      "X-Contact-Tenant": clientId,
      "X-Contact-Issuer": config.issuer,
      "X-Contact-Uid": config.uid,
      "X-Contact-Entry-Point": entryPoint,
    };
  }

  async function decode<T>(response: Response, clientId: string): Promise<T> {
    const body = await response.json().catch(() => ({})) as T & { error?: string };
    if (!response.ok) throw new CoreContactAdapterError(response.status, body.error ?? "contact_adapter_failed");
    if (response.headers.get("X-Contact-Tenant") !== clientId || response.headers.get("X-Contact-Issuer") !== config.issuer || response.headers.get("X-Contact-Uid") !== config.uid) {
      throw new CoreContactAdapterError(409, "contact_adapter_response_scope");
    }
    return body;
  }

  async function recover(command: CoreContactCreate): Promise<CoreContactReceipt> {
    const response = await request(`${config.baseUrl}/api/crm/contacts/commands/${encodeURIComponent(command.operationId)}`, {
      method: "GET",
      headers: headers(command.clientId, command.entryPoint),
      signal: AbortSignal.timeout(12_000),
    });
    const receipt = await decode<{ key: string; revision: number } | null>(response, command.clientId);
    if (!receipt) throw new CoreContactAdapterError(503, "contact_recovery_pending", true);
    return { ...receipt, recovered: true };
  }

  return {
    assertScope,
    async create(command: CoreContactCreate): Promise<CoreContactReceipt> {
      assertScope(command.clientId, command.entryPoint);
      if (!ID.test(command.operationId)) throw new CoreContactAdapterError(422, "contact_command_invalid");
      const payload = { operationId: command.operationId, action: "create", fields: command.fields, entryPoint: command.entryPoint };
      try {
        const response = await request(`${config.baseUrl}/api/crm/contacts`, {
          method: "POST",
          headers: headers(command.clientId, command.entryPoint),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12_000),
        });
        if (!response.ok && response.status >= 500) return recover(command);
        return { ...(await decode<{ key: string; revision: number }>(response, command.clientId)), recovered: false };
      } catch (error) {
        if (error instanceof CoreContactAdapterError && !error.uncertain && error.status < 500) throw error;
        try { return await recover(command); }
        catch (recoveryError) {
          if (recoveryError instanceof CoreContactAdapterError) throw recoveryError;
          throw new CoreContactAdapterError(503, "contact_recovery_pending", true);
        }
      }
    },
    async summary(clientId: string, entryPoint: string): Promise<CoreContactSummary> {
      assertScope(clientId, entryPoint);
      const response = await request(`${config.baseUrl}/api/crm/contacts/service/summary`, {
        method: "GET",
        headers: headers(clientId, entryPoint),
        signal: AbortSignal.timeout(12_000),
      });
      return decode<CoreContactSummary>(response, clientId);
    },
  };
}
