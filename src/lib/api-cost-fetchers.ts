export interface CostFetchResult {
  costUsd?: number;
  costIls?: number;
  usageMetric: string;
  usagePeriod: string;
}

function currentMonthLabel(): string {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
}

export async function fetchVercelUsage(
  token: string,
  teamId?: string,
): Promise<CostFetchResult> {
  try {
    const url = teamId
      ? `https://api.vercel.com/v2/usage?teamId=${encodeURIComponent(teamId)}`
      : "https://api.vercel.com/v2/usage";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return {
        usageMetric: `Error HTTP ${res.status}`,
        usagePeriod: currentMonthLabel(),
      };
    }

    const data = (await res.json()) as {
      metrics?: { id: string; value: number; unit: string }[];
    };

    const metrics = data.metrics ?? [];
    const bandwidth = metrics.find((m) => m.id === "bandwidth");
    const fn = metrics.find((m) => m.id === "serverlessFunctionExecution");

    const parts: string[] = [];
    if (bandwidth) parts.push(`${formatBytes(bandwidth.value)} bandwidth`);
    if (fn) parts.push(`${fn.value.toLocaleString()} ms serverless`);

    return {
      usageMetric: parts.length > 0 ? parts.join(", ") : "Sin datos de uso",
      usagePeriod: currentMonthLabel(),
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

export async function fetchAnthropicUsage(apiKey: string): Promise<CostFetchResult> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/organizations", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!res.ok) {
      return {
        usageMetric: "Requiere Admin API Key",
        usagePeriod: "",
      };
    }

    const data = (await res.json()) as { organizations?: { name: string }[] };
    const orgName = data.organizations?.[0]?.name ?? "Org desconocida";

    return {
      usageMetric: `Conectado: ${orgName}`,
      usagePeriod: currentMonthLabel(),
    };
  } catch {
    return {
      usageMetric: "Requiere Admin API Key",
      usagePeriod: "",
    };
  }
}

export async function fetchTwilioUsage(
  accountSid: string,
  authToken: string,
): Promise<CostFetchResult> {
  try {
    const credentials = btoa(`${accountSid}:${authToken}`);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Usage/Records/ThisMonth.json`;

    const res = await fetch(url, {
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!res.ok) {
      return {
        usageMetric: `Error HTTP ${res.status}`,
        usagePeriod: currentMonthLabel(),
      };
    }

    const data = (await res.json()) as {
      usage_records?: {
        category: string;
        count: string;
        price: string;
      }[];
    };

    const records = data.usage_records ?? [];

    const totalPrice = records.reduce((sum, r) => sum + parseFloat(r.price || "0"), 0);

    const smsRecord = records.find((r) => r.category === "sms");
    const waRecord = records.find((r) => r.category === "whatsapp");

    const msgCount =
      (parseInt(smsRecord?.count ?? "0") || 0) +
      (parseInt(waRecord?.count ?? "0") || 0);

    return {
      costUsd: totalPrice,
      usageMetric: msgCount > 0 ? `${msgCount.toLocaleString()} mensajes` : "0 mensajes",
      usagePeriod: currentMonthLabel(),
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

export async function fetchRailwayUsage(token: string): Promise<CostFetchResult> {
  try {
    const verifyRes = await fetch("https://backboard.railway.com/graphql/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `{ me { teams { edges { node { name customer { billingPeriod { start end } usage { estimatedValue currentUsage } } } } } } }`,
      }),
    });

    if (!verifyRes.ok) {
      return {
        usageMetric: `Error HTTP ${verifyRes.status}`,
        usagePeriod: currentMonthLabel(),
      };
    }

    const json = (await verifyRes.json()) as {
      data?: {
        me?: {
          teams?: {
            edges?: {
              node?: {
                name?: string;
                customer?: {
                  billingPeriod?: { start?: string; end?: string };
                  usage?: { estimatedValue?: number; currentUsage?: number };
                };
              };
            }[];
          };
        };
      };
      errors?: { message: string }[];
    };

    if (json.errors?.length) {
      return {
        usageMetric: `Error: ${json.errors[0].message}`,
        usagePeriod: currentMonthLabel(),
      };
    }

    const teams = json.data?.me?.teams?.edges ?? [];
    let totalEstimated = 0;
    let periodLabel = currentMonthLabel();

    for (const edge of teams) {
      const customer = edge.node?.customer;
      if (customer?.usage?.estimatedValue) {
        totalEstimated += customer.usage.estimatedValue;
      }
      if (customer?.billingPeriod?.start) {
        periodLabel = new Date(customer.billingPeriod.start).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });
      }
    }

    return {
      costUsd: totalEstimated > 0 ? totalEstimated / 100 : undefined,
      usageMetric:
        totalEstimated > 0
          ? `$${(totalEstimated / 100).toFixed(2)} estimado`
          : "Sin datos de uso",
      usagePeriod: periodLabel,
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)}GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)}MB`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}
