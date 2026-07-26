/**
 * Prisma singleton — backed by the Neon serverless driver over HTTP.
 *
 * Why HTTP and not the WebSocket pool: on Vercel's serverless runtime the
 * WebSocket-backed pool drops/tears down its socket between invocations and
 * mid-RSC-stream, surfacing as an intermittent "Server Components render" 500
 * on DB-backed pages (and `kind: Closed` with the plain TCP client). The HTTP
 * driver is stateless — one fetch per query — so there is no connection to
 * leak or tear down, which makes it reliable inside streaming Server Components.
 *
 * Trade-off: the HTTP driver supports single queries and batched
 * (`$transaction([...])`) transactions, but NOT interactive
 * (`$transaction(async (tx) => ...)`) transactions. The one place that used an
 * interactive transaction (admin user update) was refactored to the batched
 * form.
 *
 * We strip Prisma-engine-only params (pgbouncer, connection_limit) and
 * channel_binding from the URL; the HTTP driver only needs host/credentials.
 */
import { PrismaNeonHTTP } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

/** Drop params the Neon serverless driver doesn't understand, keep sslmode. */
function neonConnectionString(raw: string | undefined): string {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    for (const p of ['pgbouncer', 'connection_limit', 'channel_binding']) {
      u.searchParams.delete(p);
    }
    if (!u.searchParams.has('sslmode')) u.searchParams.set('sslmode', 'require');
    return u.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const adapter = new PrismaNeonHTTP(neonConnectionString(process.env.DATABASE_URL), {});
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
