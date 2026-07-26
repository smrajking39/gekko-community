import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Hard sign-out used to break out of an orphaned session — a JWT that is still
 * validly signed but whose user no longer exists (e.g. after a DB reset).
 * Such a session reads as "authed" in middleware but every DB-backed page
 * rejects it, which without this escape hatch causes a /login ⇄ /dashboard
 * redirect loop. Clearing the cookies and landing on /login recovers cleanly.
 *
 * NOTE: on HTTPS, Auth.js uses `__Secure-`/`__Host-`-prefixed cookies. Browsers
 * REJECT any Set-Cookie for those names that lacks the `Secure` attribute, so a
 * deletion without `secure: true` silently does nothing. We clear both the
 * plain (dev/http) and prefixed (prod/https) variants with the right flags.
 */
const COOKIES: { name: string; secure: boolean }[] = [
  { name: 'authjs.session-token', secure: false },
  { name: '__Secure-authjs.session-token', secure: true },
  { name: 'authjs.callback-url', secure: false },
  { name: '__Secure-authjs.callback-url', secure: true },
  { name: 'authjs.csrf-token', secure: false },
  { name: '__Host-authjs.csrf-token', secure: true },
];

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/login', req.url));
  for (const c of COOKIES) {
    res.cookies.set(c.name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure: c.secure,
    });
  }
  // Belt-and-suspenders: tell the browser to wipe ALL site state (cookies,
  // storage, cached pages) so no stale session or cached error survives.
  // Honored over HTTPS by modern browsers.
  res.headers.set('Clear-Site-Data', '"cookies", "storage", "cache"');
  return res;
}
