import { PrismaClient } from "@prisma/client";
import { validateEnvironment } from "./env-check";

validateEnvironment();

function getConnectionUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
  if (!isPostgres || url.includes("pgbouncer=true")) return undefined;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}pgbouncer=true`;
}

const connectionUrl = getConnectionUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    connectionUrl ? { datasources: { db: { url: connectionUrl } } } : undefined
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
