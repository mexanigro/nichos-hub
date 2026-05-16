import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const TEMPLATE_REPO = "mexanigro/Barber-shop-template";

const SHARED_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

async function vercelFetch(path: string, options: RequestInit = {}) {
  const url = new URL(path, "https://api.vercel.com");
  if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

  return fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!VERCEL_TOKEN) {
    return NextResponse.json({ error: "VERCEL_TOKEN not configured" }, { status: 500 });
  }

  try {
    const { clientId, niche, hubDocId } = await req.json();

    if (!clientId || !niche) {
      return NextResponse.json({ error: "Missing clientId or niche" }, { status: 400 });
    }

    const projectName = clientId;

    // 1. Create project from repo
    const createRes = await vercelFetch("/v1/projects", {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        gitRepository: { repo: TEMPLATE_REPO, type: "github" },
        framework: "vite",
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: `Failed to create project: ${err}` }, { status: 500 });
    }

    const project = await createRes.json();
    const projectId = project.id;

    // 2. Set env vars
    const envVars = [
      { key: "VITE_CLIENT_ID", value: clientId, target: ["production", "preview"] },
      { key: "VITE_ACTIVE_NICHE", value: niche, target: ["production", "preview"] },
      { key: "VITE_DEMO_MODE", value: "true", target: ["production", "preview"] },
      { key: "VITE_UI_LANGUAGE", value: "he", target: ["production", "preview"] },
    ];

    // Add shared Firebase env vars from current environment
    for (const key of SHARED_ENV_VARS) {
      const val = process.env[key];
      if (val) {
        envVars.push({ key, value: val, target: ["production", "preview"] });
      }
    }

    await vercelFetch(`/v3/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify(envVars),
    });

    // 3. Add custom domain
    const domain = `${clientId}.arzac.studio`;
    await vercelFetch(`/v9/projects/${projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domain }),
    });

    // 4. Update hub_clients with vercel info
    if (hubDocId) {
      await db.collection("hub_clients").doc(hubDocId).update({
        vercelProjectId: projectId,
        vercelProjectName: projectName,
        domain,
        deployStatus: "building",
      });
    }

    return NextResponse.json({ projectId, domain, status: "building" });
  } catch (error) {
    console.error("Deploy error:", error);
    return NextResponse.json({ error: "Deploy failed" }, { status: 500 });
  }
}
