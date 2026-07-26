/**
 * Full Auth.js v5 configuration — Node runtime only.
 *
 * Extends `authEdgeConfig` with:
 *   - PrismaAdapter (persists Account / VerificationToken rows).
 *   - Credentials provider (email-or-username + bcryptjs password verify).
 *   - `jwt` callback that loads role + username from the DB at sign-in,
 *     caching them in the JWT so subsequent middleware/edge requests can
 *     read them without touching Prisma.
 *
 * `auth`, `handlers`, `signIn`, and `signOut` exported from here are the
 * Node-side singletons used by `/api/auth/*` route handlers and any server
 * components that need full auth context.
 *
 * Middleware does NOT import from this file — it uses `config.edge.ts`
 * directly so the edge bundle stays free of Prisma + bcryptjs.
 */
import { ADMIN_ROLE_NAMES } from '@/config/roles.config';
import { prisma } from '@/server/db/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authEdgeConfig } from './config.edge';
import { verifyPassword } from './password';

// Sign-in is currently restricted to admin-tier accounts (site not public yet).
const ADMIN_ROLES = new Set<string>(ADMIN_ROLE_NAMES);

async function userHasAdminRole(userId: string): Promise<boolean> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: { select: { name: true } } },
  });
  return rows.some((r) => ADMIN_ROLES.has(r.role.name));
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authEdgeConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authEdgeConfig.providers,
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      authorize: async (creds) => {
        const identifier = String(creds?.identifier ?? '')
          .trim()
          .toLowerCase();
        const password = String(creds?.password ?? '');
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: identifier }, { username: identifier }] },
          include: { roles: { include: { role: { select: { name: true } } } } },
        });
        if (!user || !user.passwordHash) return null;
        if (user.status === 'banned' || user.status === 'suspended') return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Admins-only lockdown: reject non-admin accounts at sign-in.
        const isAdmin = user.roles.some((r) => ADMIN_ROLES.has(r.role.name));
        if (!isAdmin) return null;

        return {
          id: user.id,
          name: user.displayName ?? user.username,
          email: user.email,
          image: user.avatar ?? user.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    ...authEdgeConfig.callbacks,
    // Admins-only lockdown for OAuth sign-ins. Credentials are already gated in
    // `authorize()`; this covers Discord/GitHub. Allow only if the (already
    // linked) account belongs to a user holding an admin role.
    signIn: async ({ user, account }) => {
      if (account?.provider === 'credentials') return true; // handled in authorize()
      if (!user?.id) return false;
      return userHasAdminRole(user.id);
    },
    // Runs when a JWT is issued (sign-in) or explicitly refreshed via
    // `update()`. We load the user's role + username once and bake them
    // into the token so subsequent session reads (including the edge-only
    // middleware) can pull them out without a DB hit.
    //
    // Role changes from the admin console need to call `update()` on the
    // affected session, or wait until the JWT's 30-day TTL refreshes.
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.uid = user.id;
      }
      if ((user || trigger === 'update') && typeof token.uid === 'string') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { username: true, roles: { include: { role: true } } },
        });
        if (dbUser) {
          token.username = dbUser.username;
          token.role = dbUser.roles[0]?.role.name ?? 'member';
        }
      }
      return token;
    },
  },
});
