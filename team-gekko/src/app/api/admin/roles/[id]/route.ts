import { roleUpdateSchema } from '@/lib/validators';
import { prisma } from '@/server/db/prisma';
import { requirePermission, writeAudit } from '@/server/lib/auth';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';

export const runtime = 'nodejs';

// System roles whose permission set is fixed (owner = everything, super_admin
// = everything-but-flags). Editing these is blocked to avoid lockout.
const LOCKED_ROLES = new Set(['owner', 'super_admin']);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const actor = await requirePermission('manage_roles');
    const { id } = await params;
    const input = roleUpdateSchema.parse(await req.json());

    const role = await prisma.role.findUnique({
      where: { id },
      select: { id: true, name: true, permissions: { select: { key: true } } },
    });
    if (!role) throw new AppError('NOT_FOUND', 'Role not found.');
    if (LOCKED_ROLES.has(role.name)) {
      throw new AppError('PRECONDITION_FAILED', `The ${role.name} role cannot be edited.`);
    }

    const perms = await prisma.permission.findMany({
      where: { key: { in: input.permissions } },
      select: { id: true, key: true },
    });

    const before = role.permissions.map((p) => p.key).sort();

    await prisma.role.update({
      where: { id },
      data: { permissions: { set: perms.map((p) => ({ id: p.id })) } },
    });

    await writeAudit({
      actorId: actor.id,
      action: 'role.update',
      targetType: 'role',
      targetId: id,
      diff: { before, after: perms.map((p) => p.key).sort() },
    });

    return { id, name: role.name, permissions: perms.map((p) => p.key) };
  });
}
