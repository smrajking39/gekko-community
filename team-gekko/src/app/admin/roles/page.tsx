import { RoleMatrix } from '@/components/admin/role-matrix';
import { prisma } from '@/server/db/prisma';

export const metadata = { title: 'Admin · Roles' };
export const dynamic = 'force-dynamic';

export default async function AdminRolesPage() {
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: { select: { key: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.permission.findMany({
      orderBy: { key: 'asc' },
      select: { key: true, description: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-neon-violet)">
          People
        </p>
        <h1 className="mt-2 font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Roles & permissions
        </h1>
        <p className="mt-2 text-(--color-text-secondary)">
          Toggle what each role can do. The <span className="font-mono">owner</span> and{' '}
          <span className="font-mono">super_admin</span> roles are system-locked.
        </p>
      </header>

      <RoleMatrix
        roles={roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          permissions: r.permissions.map((p) => p.key),
          userCount: r._count.users,
        }))}
        permissions={permissions}
      />
    </div>
  );
}
