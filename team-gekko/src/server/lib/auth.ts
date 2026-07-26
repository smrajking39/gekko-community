/**
 * Server-side auth/RBAC helpers. Node runtime only (touches Prisma).
 *
 * Use these in admin route handlers and server components to gate access and
 * record audit trails. They build on `auth()` (the Node-side Auth.js singleton)
 * and throw `AppError`s that `handle()` turns into proper HTTP responses.
 */
import { ADMIN_ROLE_NAMES, type Permission, ROLES } from '@/config/roles.config';
import { auth } from '@/server/auth/config';
import { prisma } from '@/server/db/prisma';
import { AppError } from '@/server/lib/errors';
import { Prisma } from '@prisma/client';

/** Roles that may access the admin console. Mirrors the set in `middleware.ts`. */
export const ADMIN_ROLES = new Set<string>(ADMIN_ROLE_NAMES);

const USER_WITH_RBAC = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  avatar: true,
  status: true,
  roles: { include: { role: { include: { permissions: true } } } },
} as const;

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  status: string;
  /** Highest-privilege role name (used for display + the JWT claim). */
  role: string;
  roles: string[];
  permissions: string[];
};

/** Privilege rank from the canonical ROLES order (higher = more powerful). */
export function roleRank(name: string): number {
  const i = ROLES.indexOf(name as (typeof ROLES)[number]);
  return i < 0 ? 0 : i;
}

export function isAdminRole(name: string | null | undefined): boolean {
  return Boolean(name && ADMIN_ROLES.has(name));
}

/** The signed-in user id, or throw UNAUTHENTICATED. */
export async function requireUser(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new AppError('UNAUTHENTICATED', 'Sign in required.');
  return session.user.id;
}

/** Full current user with flattened roles + permissions, or null if signed out. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: USER_WITH_RBAC,
  });
  if (!user) return null;

  // Highest-ranked role first so `role` is the most privileged one.
  const roles = user.roles.map((r) => r.role.name).sort((a, b) => roleRank(b) - roleRank(a));
  const permissions = Array.from(
    new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.key))),
  );

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatar: user.avatar,
    status: user.status,
    role: roles[0] ?? 'member',
    roles,
    permissions,
  };
}

/** Require any admin-tier role. Returns the user. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError('UNAUTHENTICATED', 'Sign in required.');
  if (!user.roles.some((r) => ADMIN_ROLES.has(r))) {
    throw new AppError('UNAUTHORIZED', 'Admin access required.');
  }
  return user;
}

/** Require a specific permission key. Returns the user. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError('UNAUTHENTICATED', 'Sign in required.');
  if (!user.permissions.includes(permission)) {
    throw new AppError('UNAUTHORIZED', `You lack the required permission: ${permission}.`);
  }
  return user;
}

/** Append an immutable audit-log entry. Never throws (best-effort). */
export async function writeAudit(entry: {
  actorId?: string | null;
  impersonatorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  diff?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        impersonatorId: entry.impersonatorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        diff: entry.diff ?? Prisma.JsonNull,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    });
  } catch (err) {
    console.error('[writeAudit] failed to record audit entry', err);
  }
}
