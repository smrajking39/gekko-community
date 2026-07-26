/**
 * Edge-runtime route gates. Auth.js v5's `auth()` helper reads the session
 * cookie (JWT strategy so we never hit the DB on the edge) and exposes
 * `req.auth` for the matched routes.
 *
 * IMPORTANT: middleware imports `config.edge.ts` directly — NOT `config.ts`.
 * Importing the full config would drag PrismaAdapter + bcryptjs into the
 * edge bundle. The edge config only carries OAuth providers + the session
 * callback, so the bundle stays small and free of Node-only deps.
 *
 * Gates:
 *   - unauthed on /dashboard or /admin → /login (with callbackUrl)
 *   - non-admin on /admin              → 404 rewrite (don't reveal the surface)
 *   - authed on /login or /register    → /dashboard
 *
 * Adds an x-request-id header to every response so client errors can be
 * correlated to a server log line.
 */
import { authEdgeConfig } from '@/server/auth/config.edge';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authEdgeConfig);

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'owner']);

export default auth((req) => {
  const isAuthed = Boolean(req.auth?.user?.id);
  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  const requestId =
    req.headers.get('x-request-id') ??
    `req_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

  // Protected surfaces
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Admin-only — non-admins get a 404 so we don't disclose the surface exists.
  if (pathname.startsWith('/admin') && isAuthed && !ADMIN_ROLES.has(role ?? '')) {
    const url = req.nextUrl.clone();
    url.pathname = '/not-found';
    const res = NextResponse.rewrite(url);
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // NOTE: we intentionally do NOT bounce authed users away from /login. An
  // orphaned session (validly-signed JWT for a deleted user) reads as authed
  // here but is rejected by every DB-backed page; bouncing it off /login would
  // create a /login ⇄ /dashboard redirect loop. Keeping /login reachable lets
  // such a session recover by signing in again (or via /api/force-signout).

  const res = NextResponse.next();
  res.headers.set('x-request-id', requestId);
  return res;
});

export const config = {
  matcher: [
    // Run on everything except static assets, /api/auth (handled by Auth.js itself),
    // and image responses.
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|opengraph-image|manifest.webmanifest|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
