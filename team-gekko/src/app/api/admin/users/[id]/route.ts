import { adminUserUpdateSchema } from '@/lib/validators';
import { prisma } from '@/server/db/prisma';
import { requirePermission, roleRank, writeAudit } from '@/server/lib/auth';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const actor = await requirePermission('manage_users');
    const { id } = await params;
    const body = await req.json();
    const input = adminUserUpdateSchema.parse(body);

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        roles: { select: { role: { select: { id: true, name: true } } } },
      },
    });
    if (!target) throw new AppError('NOT_FOUND', 'User not found.');

    const actorRank = Math.max(0, ...actor.roles.map(roleRank));
    const targetCurrentRole =
      [...target.roles.map((r) => r.role.name)].sort((a, b) => roleRank(b) - roleRank(a))[0] ??
      'member';
    const targetRank = roleRank(targetCurrentRole);
    const isSelf = target.id === actor.id;

    // --- Guards -------------------------------------------------------------
    if (isSelf) {
      // Avoid self-lockout: route role/status changes for yourself through
      // another admin.
      throw new AppError('PRECONDITION_FAILED', 'You cannot change your own role or status.');
    }
    if (targetRank >= actorRank) {
      throw new AppError('UNAUTHORIZED', 'You cannot modify a user at or above your own role.');
    }
    if (input.role !== undefined && roleRank(input.role) >= actorRank) {
      throw new AppError('UNAUTHORIZED', 'You cannot assign a role at or above your own.');
    }

    // Last-owner protection: never strip/ban the final owner.
    const leavingOwner =
      targetCurrentRole === 'owner' &&
      ((input.role !== undefined && input.role !== 'owner') ||
        (input.status !== undefined && input.status !== 'active'));
    if (leavingOwner) {
      const ownerCount = await prisma.userRole.count({ where: { role: { name: 'owner' } } });
      if (ownerCount <= 1) {
        throw new AppError('PRECONDITION_FAILED', 'Cannot modify the last remaining owner.');
      }
    }

    // --- Apply --------------------------------------------------------------
    const before = { role: targetCurrentRole, status: target.status };

    // NOTE: sequential (not an interactive $transaction) because the Neon HTTP
    // driver doesn't support them. Ordered so the user is never left role-less:
    // add the new role first (idempotent), then drop the others.
    if (input.status !== undefined) {
      await prisma.user.update({ where: { id }, data: { status: input.status } });
    }
    if (input.role !== undefined && input.role !== targetCurrentRole) {
      const role = await prisma.role.findUnique({ where: { name: input.role } });
      if (!role) throw new AppError('NOT_FOUND', `Role ${input.role} not found.`);
      // Single-role model: assign the chosen role, then remove any others.
      await prisma.userRole.createMany({
        data: [{ userId: id, roleId: role.id }],
        skipDuplicates: true,
      });
      await prisma.userRole.deleteMany({ where: { userId: id, NOT: { roleId: role.id } } });
    }

    const after = {
      role: input.role ?? targetCurrentRole,
      status: input.status ?? target.status,
    };

    await writeAudit({
      actorId: actor.id,
      action: 'user.update',
      targetType: 'user',
      targetId: id,
      diff: { before, after },
    });

    return { id, ...after };
  });
}
