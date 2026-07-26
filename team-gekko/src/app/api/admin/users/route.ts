import { adminUserCreateSchema, adminUserListSchema } from '@/lib/validators';
import { listUsers } from '@/server/admin/users';
import { hashPassword } from '@/server/auth/password';
import { prisma } from '@/server/db/prisma';
import { requirePermission, roleRank, writeAudit } from '@/server/lib/auth';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  return handle(async () => {
    await requirePermission('manage_users');
    const { searchParams } = new URL(req.url);
    const params = adminUserListSchema.parse({
      q: searchParams.get('q') ?? undefined,
      role: searchParams.get('role') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
    });
    return listUsers(params);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const actor = await requirePermission('manage_users');
    const input = adminUserCreateSchema.parse(await req.json());

    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();

    // Can't create a user at or above your own rank.
    const actorRank = Math.max(0, ...actor.roles.map(roleRank));
    if (roleRank(input.role) >= actorRank) {
      throw new AppError('UNAUTHORIZED', 'You cannot assign a role at or above your own.');
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { id: true },
    });
    if (existing) {
      throw new AppError('CONFLICT', 'That email or username is already in use.');
    }

    const role = await prisma.role.findUnique({ where: { name: input.role } });
    if (!role) throw new AppError('NOT_FOUND', `Role ${input.role} not found.`);

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: input.displayName || username,
        passwordHash,
        // Admin-provisioned accounts are active + pre-verified.
        status: 'active',
        emailVerifiedAt: new Date(),
        roles: { create: { roleId: role.id } },
      },
      select: { id: true, email: true, username: true },
    });

    await writeAudit({
      actorId: actor.id,
      action: 'user.create',
      targetType: 'user',
      targetId: user.id,
      diff: { email, username, role: input.role },
    });

    return { id: user.id, email: user.email, username: user.username, role: input.role };
  });
}
