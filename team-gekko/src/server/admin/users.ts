/**
 * Admin user queries — shared by the `/admin/users` server component and the
 * `/api/admin/users` route (client refetch). Node runtime only.
 */
import type { AdminUserListInput } from '@/lib/validators';
import { prisma } from '@/server/db/prisma';
import { roleRank } from '@/server/lib/auth';
import type { Prisma } from '@prisma/client';

export const ADMIN_USERS_PAGE_SIZE = 20;

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatar: string | null;
  status: string;
  role: string;
  createdAt: string;
};

export type AdminUserList = {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageCount: number;
};

/** Highest-privilege role name from a user's role rows. */
export function topRole(roles: { role: { name: string } }[]): string {
  return (
    [...roles.map((r) => r.role.name)].sort((a, b) => roleRank(b) - roleRank(a))[0] ?? 'member'
  );
}

export async function listUsers(params: AdminUserListInput): Promise<AdminUserList> {
  const { q, role, status, page } = params;

  const where: Prisma.UserWhereInput = {};
  if (status) where.status = status;
  if (role) where.roles = { some: { role: { name: role } } };
  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { displayName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * ADMIN_USERS_PAGE_SIZE,
      take: ADMIN_USERS_PAGE_SIZE,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        status: true,
        createdAt: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      avatar: u.avatar,
      status: u.status,
      role: topRole(u.roles),
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE)),
  };
}
