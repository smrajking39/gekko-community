import { prisma } from '@/server/db/prisma';
import { ok } from '@/server/lib/response';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Capture cold start time
const bootAt = Date.now();

// Env vars the app needs in each Vercel environment. We only ever report
// whether a value is PRESENT — never the value itself — except for the
// NEXT_PUBLIC_* ones, which are already shipped to the browser at build time
// and are safe to echo back (they double as a check that the build baked the
// right values).
const SERVER_VARS = ['DATABASE_URL', 'AUTH_SECRET', 'AUTH_URL', 'JWT_VERIFY_SECRET'] as const;

const PUBLIC_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_USE_MOCK',
] as const;

const OPTIONAL_VARS = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'AUTH_DISCORD_ID',
  'AUTH_DISCORD_SECRET',
  'AUTH_GITHUB_ID',
  'AUTH_GITHUB_SECRET',
] as const;

function present(name: string): boolean {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0;
}

async function checkDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    // Surfacing the message here is the whole point of the diagnostic mode —
    // it's the error production hides in the browser.
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET(req: Request) {
  const base = {
    status: 'ok' as const,
    version: process.env.npm_package_version ?? '0.1.0',
    uptimeSec: Math.floor((Date.now() - bootAt) / 1000),
    mode: process.env.NEXT_PUBLIC_USE_MOCK === 'true' ? 'mock' : 'live',
  };

  // Diagnostic mode is gated: only return the env/DB report when a token is
  // configured AND the caller presents it. Without HEALTH_DEBUG_TOKEN set, this
  // route stays a plain public liveness probe and leaks nothing.
  const token = process.env.HEALTH_DEBUG_TOKEN;
  const provided = new URL(req.url).searchParams.get('token');
  const authorized = Boolean(token) && provided === token;

  if (!authorized) {
    return NextResponse.json(ok({ ...base, checks: { runtime: { status: 'ok' } } }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const db = await checkDb();

  const env = {
    // Which Vercel environment this function is running in.
    vercelEnv: process.env.VERCEL_ENV ?? null, // "production" | "preview" | "development"
    nodeEnv: process.env.NODE_ENV ?? null,
    region: process.env.VERCEL_REGION ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };

  // present/missing booleans for secrets; actual values for the public ones.
  const server = Object.fromEntries(SERVER_VARS.map((k) => [k, present(k)]));
  const optional = Object.fromEntries(OPTIONAL_VARS.map((k) => [k, present(k)]));
  const publik = Object.fromEntries(PUBLIC_VARS.map((k) => [k, process.env[k] ?? null]));

  const missingRequired = [...SERVER_VARS].filter((k) => !present(k));

  return NextResponse.json(
    ok({
      ...base,
      status: db.ok && missingRequired.length === 0 ? 'ok' : 'degraded',
      env,
      vars: { required: server, public: publik, optional },
      missingRequired,
      checks: {
        runtime: { status: 'ok' },
        database: db.ok ? { status: 'ok' } : { status: 'error', error: db.error },
      },
    }),
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
