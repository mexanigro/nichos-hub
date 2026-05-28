#!/usr/bin/env node
/**
 * capture-wizard-refs.mjs
 *
 * Generates the 24 thumbnail JPGs used by `WizardRefImage` to show the client
 * what each onboarding step is editing (6 niches × 4 sections).
 *
 * Pipeline:
 *   1. Spawn the master template's Vite dev server on port 5183 (isolated
 *      from any other dev server the user may have running).
 *   2. Drive Playwright Chromium at viewport 1280×800.
 *   3. For each (niche, section) pair, navigate to the dev-only route
 *      `/dev/wizard-refs-preview?niche=X&section=Y`, wait for
 *      `body[data-wizard-ref-ready="1"]`, screenshot, downscale to 800×600
 *      via sharp, write JPG quality 80 to `public/wizard-refs/{niche}/{step}.jpg`.
 *
 * Output: 24 files under public/wizard-refs/. All under 150 KB.
 *
 * Regenerate with:  npm run capture-wizard-refs
 *
 * Requires (devDeps): playwright, sharp.
 */

import { spawn } from "node:child_process";
import { mkdir, stat, writeFile } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

function pingPort(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ host: "127.0.0.1", port });
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.once("connect", () => done(true));
    sock.once("error", () => done(false));
    setTimeout(() => done(false), 1000);
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const TEMPLATE_PATH = path.resolve(
  REPO_ROOT,
  "..",
  "Nichos",
  "Barber-shop-template-main",
);
const OUTPUT_ROOT = path.join(REPO_ROOT, "public", "wizard-refs");

const PORT = 5183;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_READY_TIMEOUT_MS = 60_000;
const PAGE_READY_TIMEOUT_MS = 25_000;
const POST_READY_DELAY_MS = 350;

const NICHES = ["barberia", "cafeteria", "estetica", "nails", "remodelaciones", "tattoo"];
const SECTIONS = ["hero", "benefits", "testimonials", "faq"];

const VIEWPORT = { width: 1280, height: 800 };
const TARGET = { width: 800, height: 600 };
const JPEG_QUALITY = 80;
const MAX_SIZE_BYTES = 150 * 1024;

function log(msg) {
  process.stdout.write(`[wizard-refs] ${msg}\n`);
}

function err(msg) {
  process.stderr.write(`[wizard-refs] ${msg}\n`);
}

async function spawnViteServer() {
  log(`Spawning vite dev server in ${TEMPLATE_PATH} on port ${PORT}`);
  // Use `npx vite` directly (not the heavy tsx server.ts wrapper).
  // We don't need Stripe/Resend/Express for screenshots.
  const isWin = process.platform === "win32";
  const proc = spawn(
    "npx",
    ["vite", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
    {
      cwd: TEMPLATE_PATH,
      env: {
        ...process.env,
        VITE_ACTIVE_NICHE: "barberia",
        VITE_UI_LANGUAGE: "en",
        VITE_DISABLE_FIRESTORE_SITE_OVERRIDE: "1",
        DISABLE_HMR: "true",
      },
      stdio: ["ignore", "pipe", "pipe"],
      shell: isWin,
    },
  );

  // Strip ANSI escape sequences before matching (Vite uses colored output)
  const ANSI = /\x1b\[[0-9;]*m/g;
  let ready = false;
  const readyPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!ready) reject(new Error("vite dev server did not become ready in time"));
    }, SERVER_READY_TIMEOUT_MS);

    const onData = (chunk) => {
      const text = chunk.toString().replace(ANSI, "");
      process.stdout.write(`[vite] ${text}`);
      if (!ready && (text.includes("Local:") || text.includes("ready in"))) {
        // Probe the port to confirm the HTTP server actually accepts connections.
        pingPort(PORT).then((up) => {
          if (up && !ready) {
            ready = true;
            clearTimeout(timeout);
            resolve();
          }
        });
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", (code) => {
      if (!ready) {
        clearTimeout(timeout);
        reject(new Error(`vite exited with code ${code} before ready`));
      }
    });
  });

  await readyPromise;
  log("vite dev server ready");
  return proc;
}

async function ensureDirs() {
  for (const niche of NICHES) {
    await mkdir(path.join(OUTPUT_ROOT, niche), { recursive: true });
  }
}

async function captureOne(page, niche, section) {
  const url = `${BASE_URL}/dev/wizard-refs-preview?niche=${niche}&section=${section}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_READY_TIMEOUT_MS });
  await page.waitForSelector('body[data-wizard-ref-ready="1"]', {
    timeout: PAGE_READY_TIMEOUT_MS,
  });
  // Extra settle for motion-driven viewport entry animations.
  await page.waitForTimeout(POST_READY_DELAY_MS);
  await page.evaluate(() => window.scrollTo(0, 0));

  const buffer = await page.screenshot({ type: "png", fullPage: false });
  const out = await sharp(buffer)
    .resize(TARGET.width, TARGET.height, { fit: "cover", position: "top" })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  const filename = path.join(OUTPUT_ROOT, niche, `${section}.jpg`);
  await writeFile(filename, out);
  const { size } = await stat(filename);
  const kb = (size / 1024).toFixed(1);
  const overWarn = size > MAX_SIZE_BYTES ? "  ⚠ over 150KB" : "";
  log(`  ${niche}/${section}.jpg (${kb} KB)${overWarn}`);
  return { niche, section, filename, size };
}

async function main() {
  await ensureDirs();

  const server = await spawnViteServer();
  let browser;
  const results = [];

  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    page.on("pageerror", (e) => err(`pageerror: ${e.message}`));

    for (const niche of NICHES) {
      log(`niche: ${niche}`);
      for (const section of SECTIONS) {
        try {
          const r = await captureOne(page, niche, section);
          results.push(r);
        } catch (e) {
          err(`failed ${niche}/${section}: ${e.message}`);
          results.push({ niche, section, error: e.message });
        }
      }
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server && !server.killed) {
      log("stopping vite dev server");
      const sig = process.platform === "win32" ? undefined : "SIGTERM";
      server.kill(sig);
      // Force kill after 3s on Windows where SIGTERM is ignored
      setTimeout(() => {
        if (!server.killed) server.kill("SIGKILL");
      }, 3000).unref();
    }
  }

  const failed = results.filter((r) => r.error);
  const oversized = results.filter((r) => r.size > MAX_SIZE_BYTES);
  log("");
  log(`Summary: ${results.length - failed.length}/${results.length} captures OK`);
  if (failed.length) {
    err(`Failures: ${failed.length}`);
    for (const f of failed) err(`  ${f.niche}/${f.section}: ${f.error}`);
  }
  if (oversized.length) {
    err(`Oversized (>150KB): ${oversized.length}`);
    for (const o of oversized) err(`  ${o.niche}/${o.section}.jpg: ${(o.size/1024).toFixed(1)} KB`);
  }
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  err(e.stack || e.message);
  process.exit(1);
});
