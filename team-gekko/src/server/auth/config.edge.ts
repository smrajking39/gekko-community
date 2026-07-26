/**
 * Edge-safe Auth.js v5 configuration. Used by `middleware.ts` (which runs on
 * the Edge runtime) and re-exported as the base for the full Node-runtime
 * config in `config.ts`.
 *
 * What lives here:
 *   - OAuth providers (Discord, GitHub) — conditionally registered when env
 *     vars are present. They contain no Node-only code paths.
 *   - JWT session strategy + page paths.
 *   - The `session` callback — it only reshapes the token into session.user
 *     (no DB calls, edge-safe).
 *
 * What does NOT live here:
 *   - PrismaAdapter (drags @prisma/client into the bundle).
 *   - Credentials provider (drags bcryptjs into the bundle).
 *   - The `jwt` callback that does DB lookups — that's in `config.ts`.
 *
 * The middleware initializes its own `NextAuth(authEdgeConfig)` instance so
 * it can decode the JWT cookie without bundling Prisma + bcryptjs.
 */
import type { DefaultSession, NextAuthConfig } from 'next-auth';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      role?: string;
      permissions?: string[];
    } & DefaultSession['user'];
  }
}

// Auth.js v5 derives the JWT shape from the callback return type instead of
// exposing a `next-auth/jwt` augmentation point. We use runtime `typeof`
// checks inside the session callback to narrow `token.uid`, `token.username`,
// and `token.role` to strings before reading them.

const HAS_DISCORD = Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET);
const HAS_GITHUB = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

export const authEdgeConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    ...(HAS_DISCORD
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID as string,
            clientSecret: process.env.AUTH_DISCORD_SECRET as string,
          }),
        ]
      : []),
    ...(HAS_GITHUB
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID as string,
            clientSecret: process.env.AUTH_GITHUB_SECRET as string,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },
  callbacks: {
    // Shape the public session from the JWT claims. Runs on every `auth()`
    // call including middleware — must stay free of Node-only deps.
    session: ({ session, token }) => {
      if (typeof token.uid === 'string') session.user.id = token.uid;
      if (typeof token.username === 'string') session.user.username = token.username;
      if (typeof token.role === 'string') session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
