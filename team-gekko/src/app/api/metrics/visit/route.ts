import { nanoId } from '@/lib/utils';
/**
 * Site visit counters — unique visitors + total page views.
 *
 * POST increments the counters (once per footer mount) and, for a first-time
 * visitor, sets a long-lived first-party cookie so subsequent hits only bump
 * the page-view total. GET just reads the current totals.
 *
 * Both verbs degrade gracefully: if the DB is unavailable (e.g. local/mock with
 * no DATABASE_URL) they return zeroed counts with success:false so the footer
 * can simply hide the stats rather than error.
 */
import { prisma } from '@/server/db/prisma';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VISITOR_COOKIE = 'gk_vid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // ~2 years

const KEY_PAGE_VIEWS = 'page_views';
const KEY_UNIQUE = 'unique_visitors';

type Counts = { pageViews: number; uniqueVisitors: number };

async function readCounts(): Promise<Counts> {
  const rows = await prisma.siteMetric.findMany({
    where: { key: { in: [KEY_PAGE_VIEWS, KEY_UNIQUE] } },
  });
  const map = new Map(rows.map((r) => [r.key, Number(r.count)]));
  return {
    pageViews: map.get(KEY_PAGE_VIEWS) ?? 0,
    uniqueVisitors: map.get(KEY_UNIQUE) ?? 0,
  };
}

function noStore(body: { success: boolean; data: Counts }) {
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}

const EMPTY: Counts = { pageViews: 0, uniqueVisitors: 0 };

export async function GET() {
  try {
    return noStore({ success: true, data: await readCounts() });
  } catch {
    return noStore({ success: false, data: EMPTY });
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') ?? '';
    const isNewVisitor = !new RegExp(`(?:^|;\\s*)${VISITOR_COOKIE}=`).test(cookieHeader);

    // Sequential upserts — the Neon HTTP driver is stateless and does not
    // support multi-statement transactions. Independent counters don't need it.
    await prisma.siteMetric.upsert({
      where: { key: KEY_PAGE_VIEWS },
      create: { key: KEY_PAGE_VIEWS, count: 1n },
      update: { count: { increment: 1n } },
    });
    if (isNewVisitor) {
      await prisma.siteMetric.upsert({
        where: { key: KEY_UNIQUE },
        create: { key: KEY_UNIQUE, count: 1n },
        update: { count: { increment: 1n } },
      });
    }

    const res = noStore({ success: true, data: await readCounts() });
    if (isNewVisitor) {
      res.cookies.set(VISITOR_COOKIE, nanoId(21), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });
    }
    return res;
  } catch {
    return noStore({ success: false, data: EMPTY });
  }
}
