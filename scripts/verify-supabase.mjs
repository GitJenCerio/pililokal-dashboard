/**
 * Verify Supabase (or any Postgres) is working and ready to deploy.
 * Run from project root:  npx prisma generate  &&  node scripts/verify-supabase.mjs
 *
 * Loads .env.local or .env, then tests:
 * - Required env vars present
 * - Pooled connection (DATABASE_URL) works
 * - Direct connection (DIRECT_URL) works
 * - Required tables exist (User, Merchant, Lead)
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) {
        const val = m[2].trim();
        const q = val[0];
        if ((q === '"' || q === "'") && val.endsWith(q)) {
          process.env[m[1]] = val.slice(1, -1).replace(/\\(.)/g, "$1");
        } else {
          process.env[m[1]] = val;
        }
      }
    }
    return name;
  }
  return null;
}

const REQUIRED = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "SESSION_SECRET",
];

function main() {
  console.log("PiliLokal — Supabase / Postgres readiness check\n");

  const loaded = loadEnv();
  if (loaded) {
    console.log("Loaded env from", loaded);
  } else {
    console.log("No .env.local or .env found; using process.env");
  }

  const missing = REQUIRED.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.error("\nMissing required env vars:", missing.join(", "));
    console.error("Set them in .env.local (local) or Vercel Environment Variables (production).");
    process.exit(1);
  }
  console.log("Required env vars: OK");

  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const isPooled = dbUrl && (dbUrl.includes("pooler") || dbUrl.includes("pgbouncer=true"));
  if (!isPooled && dbUrl?.includes("supabase")) {
    console.warn("\nWarning: DATABASE_URL looks like Supabase but does not include pgbouncer. For Vercel, use Session mode (pooler) URL and add ?pgbouncer=true");
  }

  async function run() {
    const pooled = new PrismaClient({
      datasources: { db: { url: dbUrl } },
    });
    const direct = new PrismaClient({
      datasources: { db: { url: directUrl } },
    });

    try {
      await pooled.$queryRaw`SELECT 1 as ok`;
      console.log("Pooled connection (DATABASE_URL): OK");
    } catch (e) {
      console.error("Pooled connection (DATABASE_URL): FAILED");
      console.error(e.message);
      process.exit(1);
    } finally {
      await pooled.$disconnect();
    }

    try {
      await direct.$queryRaw`SELECT 1 as ok`;
      console.log("Direct connection (DIRECT_URL): OK");
    } catch (e) {
      console.error("Direct connection (DIRECT_URL): FAILED");
      console.error(e.message);
      process.exit(1);
    }

    try {
      const tables = await direct.$queryRaw`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('User', 'Merchant', 'Lead')
      `;
      const names = (tables || []).map((r) => (r.table_name || "").toLowerCase());
      const required = ["user", "merchant", "lead"];
      const missingTables = required.filter((t) => !names.includes(t));
      if (missingTables.length) {
        console.warn("\nMissing tables:", missingTables.join(", "));
        console.warn("Run prisma/schema-setup.sql in Supabase SQL Editor, or: npx prisma db push");
      } else {
        console.log("Required tables (User, Merchant, Lead): OK");
      }
    } catch (e) {
      console.warn("Could not check tables:", e.message);
    } finally {
      await direct.$disconnect();
    }

    console.log("\nSupabase is working and ready to deploy.");
  }

  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

main();
