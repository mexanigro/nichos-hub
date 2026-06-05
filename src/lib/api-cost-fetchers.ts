import type { UsageDetail } from "@/types";

export interface CostFetchResult {
  costUsd?: number;
  costIls?: number;
  usageMetric: string;
  usagePeriod: string;
  details?: UsageDetail[];
}

function currentMonthLabel(): string {
  return new Date().toLocaleString("es", { month: "long", year: "numeric" });
}

// ─── Anthropic ───

export async function fetchAnthropicUsage(apiKey: string): Promise<CostFetchResult> {
  try {
    const orgRes = await fetch("https://api.anthropic.com/v1/organizations", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });

    if (!orgRes.ok) {
      return {
        usageMetric: `Error HTTP ${orgRes.status}`,
        usagePeriod: currentMonthLabel(),
      };
    }

    const orgData = (await orgRes.json()) as {
      data?: { id: string; name: string }[];
    };
    const org = orgData.data?.[0];
    const orgName = org?.name ?? "Organización";
    const orgId = org?.id;

    const details: UsageDetail[] = [
      { label: "Organización", value: orgName },
    ];

    if (orgId) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const params = new URLSearchParams({
        start_date: startOfMonth.toISOString().slice(0, 10),
        end_date: now.toISOString().slice(0, 10),
        group_by: "model",
      });

      const usageRes = await fetch(
        `https://api.anthropic.com/v1/organizations/${orgId}/usage?${params}`,
        {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
        },
      );

      if (usageRes.ok) {
        const usageData = (await usageRes.json()) as {
          data?: {
            model?: string;
            input_tokens?: number;
            output_tokens?: number;
            cost_usd?: number;
          }[];
          total_cost_usd?: number;
        };

        let totalInput = 0;
        let totalOutput = 0;
        let totalCost = usageData.total_cost_usd ?? 0;

        for (const item of usageData.data ?? []) {
          const input = item.input_tokens ?? 0;
          const output = item.output_tokens ?? 0;
          totalInput += input;
          totalOutput += output;

          if (item.model && (input > 0 || output > 0)) {
            const modelName = item.model.replace("claude-", "").split("-202")[0];
            const cost = item.cost_usd ?? 0;
            if (cost > 0) totalCost = Math.max(totalCost, 0);
            details.push({
              label: modelName,
              value: `${formatTokens(input)} in / ${formatTokens(output)} out`,
              costUsd: cost,
            });
          }
        }

        if (totalInput > 0 || totalOutput > 0) {
          details.splice(1, 0, {
            label: "Tokens totales",
            value: `${formatTokens(totalInput)} in / ${formatTokens(totalOutput)} out`,
          });
        }

        return {
          costUsd: totalCost > 0 ? totalCost : undefined,
          usageMetric:
            totalInput > 0
              ? `${formatTokens(totalInput + totalOutput)} tokens`
              : `Conectado: ${orgName}`,
          usagePeriod: currentMonthLabel(),
          details,
        };
      }
    }

    details.push({
      label: "Info",
      value: "Costos detallados en console.anthropic.com",
    });

    return {
      usageMetric: `Conectado: ${orgName}`,
      usagePeriod: currentMonthLabel(),
      details,
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

// ─── Twilio ───

export async function fetchTwilioUsage(
  accountSid: string,
  authToken: string,
): Promise<CostFetchResult> {
  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
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
        description: string;
        count: string;
        count_unit: string;
        price: string;
        price_unit: string;
      }[];
    };

    const records = data.usage_records ?? [];
    const totalPrice = records.reduce(
      (sum, r) => sum + parseFloat(r.price || "0"),
      0,
    );

    const details: UsageDetail[] = [];

    const categories: { key: string; label: string }[] = [
      { key: "programmable-messaging-whatsapp-inbound", label: "WhatsApp entrantes" },
      { key: "programmable-messaging-whatsapp-outbound", label: "WhatsApp salientes" },
      { key: "sms-inbound", label: "SMS entrantes" },
      { key: "sms-outbound", label: "SMS salientes" },
      { key: "calls-inbound", label: "Llamadas entrantes" },
      { key: "calls-outbound", label: "Llamadas salientes" },
      { key: "phonenumbers", label: "Números telefónicos" },
      { key: "totalprice", label: "Precio total" },
    ];

    for (const cat of categories) {
      const rec = records.find((r) => r.category === cat.key);
      if (rec) {
        const cost = parseFloat(rec.price || "0");
        const count = parseInt(rec.count || "0", 10);
        if (cost > 0 || count > 0) {
          details.push({
            label: cat.label,
            value:
              cat.key === "totalprice"
                ? `$${cost.toFixed(2)}`
                : `${count.toLocaleString()} ${rec.count_unit || ""}`.trim(),
            costUsd: cat.key === "totalprice" ? undefined : cost,
          });
        }
      }
    }

    if (details.length === 0) {
      const waInbound = records.find((r) => r.category.includes("whatsapp") && r.category.includes("inbound"));
      const waOutbound = records.find((r) => r.category.includes("whatsapp") && r.category.includes("outbound"));
      const smsRec = records.find((r) => r.category === "sms");
      const waRec = records.find((r) => r.category === "whatsapp");

      for (const [label, rec] of [
        ["WhatsApp entrantes", waInbound],
        ["WhatsApp salientes", waOutbound],
        ["WhatsApp", waRec],
        ["SMS", smsRec],
      ] as const) {
        if (rec) {
          const cost = parseFloat(rec.price || "0");
          const count = parseInt(rec.count || "0", 10);
          if (cost > 0 || count > 0) {
            details.push({
              label,
              value: `${count.toLocaleString()} msgs`,
              costUsd: cost,
            });
          }
        }
      }
    }

    const msgCount = records
      .filter((r) => r.category.includes("sms") || r.category.includes("whatsapp") || r.category === "calls")
      .reduce((sum, r) => sum + (parseInt(r.count || "0", 10) || 0), 0);

    return {
      costUsd: totalPrice,
      usageMetric:
        msgCount > 0
          ? `${msgCount.toLocaleString()} interacciones`
          : `$${totalPrice.toFixed(2)} total`,
      usagePeriod: currentMonthLabel(),
      details,
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

// ─── Vercel ───

export async function fetchVercelUsage(
  token: string,
  teamId?: string,
): Promise<CostFetchResult> {
  try {
    const baseParams = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
    const usageUrl = `https://api.vercel.com/v2/usage${baseParams}`;
    const headers = { Authorization: `Bearer ${token}` };

    const res = await fetch(usageUrl, { headers });

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
    const details: UsageDetail[] = [];

    const metricMap: { id: string; label: string; formatter: (v: number, u: string) => string }[] = [
      { id: "bandwidth", label: "Bandwidth", formatter: (v) => formatBytes(v) },
      { id: "serverlessFunctionExecution", label: "Serverless", formatter: (v) => `${(v / 1000).toFixed(1)}s exec` },
      { id: "edgeFunctionExecution", label: "Edge Functions", formatter: (v) => `${v.toLocaleString()} invocaciones` },
      { id: "sourceImages", label: "Imágenes", formatter: (v) => `${v.toLocaleString()} optimizadas` },
      { id: "buildMinute", label: "Build", formatter: (v) => `${v.toFixed(0)} min` },
    ];

    for (const m of metricMap) {
      const metric = metrics.find((x) => x.id === m.id);
      if (metric && metric.value > 0) {
        details.push({
          label: m.label,
          value: m.formatter(metric.value, metric.unit),
        });
      }
    }

    let projectCount: number | undefined;
    try {
      const projUrl = `https://api.vercel.com/v9/projects${baseParams}&limit=100`;
      const projRes = await fetch(projUrl, { headers });
      if (projRes.ok) {
        const projData = (await projRes.json()) as { projects?: unknown[] };
        projectCount = projData.projects?.length;
        if (projectCount !== undefined) {
          details.push({ label: "Proyectos", value: `${projectCount} activos` });
        }
      }
    } catch {
      /* ignore */
    }

    const bandwidth = metrics.find((m) => m.id === "bandwidth");
    const parts: string[] = [];
    if (bandwidth) parts.push(`${formatBytes(bandwidth.value)} bandwidth`);
    if (projectCount) parts.push(`${projectCount} proyectos`);

    return {
      usageMetric: parts.length > 0 ? parts.join(", ") : "Sin datos de uso",
      usagePeriod: currentMonthLabel(),
      details,
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

// ─── Railway ───

export async function fetchRailwayUsage(token: string): Promise<CostFetchResult> {
  try {
    const gqlHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const billingRes = await fetch("https://backboard.railway.com/graphql/v2", {
      method: "POST",
      headers: gqlHeaders,
      body: JSON.stringify({
        query: `{
          me {
            teams {
              edges {
                node {
                  name
                  customer {
                    billingPeriod { start end }
                    usage { estimatedValue currentUsage }
                    invoices(first: 1) {
                      edges {
                        node {
                          total
                          period { start end }
                          items { amount description }
                        }
                      }
                    }
                  }
                  projects(first: 20) {
                    edges {
                      node {
                        name
                        services(first: 20) {
                          edges { node { name } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
      }),
    });

    if (!billingRes.ok) {
      return {
        usageMetric: `Error HTTP ${billingRes.status}`,
        usagePeriod: currentMonthLabel(),
      };
    }

    const json = (await billingRes.json()) as {
      data?: {
        me?: {
          teams?: {
            edges?: {
              node?: {
                name?: string;
                customer?: {
                  billingPeriod?: { start?: string; end?: string };
                  usage?: { estimatedValue?: number; currentUsage?: number };
                  invoices?: {
                    edges?: {
                      node?: {
                        total?: number;
                        period?: { start?: string; end?: string };
                        items?: { amount: number; description: string }[];
                      };
                    }[];
                  };
                };
                projects?: {
                  edges?: {
                    node?: {
                      name?: string;
                      services?: {
                        edges?: { node?: { name?: string } }[];
                      };
                    };
                  }[];
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
    const details: UsageDetail[] = [];

    for (const edge of teams) {
      const node = edge.node;
      const customer = node?.customer;

      if (customer?.usage?.estimatedValue) {
        totalEstimated += customer.usage.estimatedValue;
      }
      if (customer?.billingPeriod?.start) {
        periodLabel = new Date(customer.billingPeriod.start).toLocaleString(
          "es",
          { month: "long", year: "numeric" },
        );
      }

      const invoice = customer?.invoices?.edges?.[0]?.node;
      if (invoice?.items) {
        for (const item of invoice.items) {
          if (item.amount > 0) {
            details.push({
              label: item.description.slice(0, 40),
              value: `$${(item.amount / 100).toFixed(2)}`,
              costUsd: item.amount / 100,
            });
          }
        }
      }

      const projects = node?.projects?.edges ?? [];
      if (projects.length > 0 && details.length === 0) {
        for (const proj of projects) {
          const name = proj.node?.name;
          const serviceCount = proj.node?.services?.edges?.length ?? 0;
          if (name) {
            details.push({
              label: name,
              value: `${serviceCount} servicio${serviceCount !== 1 ? "s" : ""}`,
            });
          }
        }
      }
    }

    const costUsd = totalEstimated > 0 ? totalEstimated / 100 : undefined;

    return {
      costUsd,
      usageMetric:
        costUsd !== undefined
          ? `$${costUsd.toFixed(2)} estimado`
          : "Sin datos de uso",
      usagePeriod: periodLabel,
      details,
    };
  } catch (err) {
    return {
      usageMetric: `Error: ${err instanceof Error ? err.message : String(err)}`,
      usagePeriod: currentMonthLabel(),
    };
  }
}

// ─── Helpers ───

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
