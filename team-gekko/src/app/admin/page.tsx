import { StatusBadge } from '@/components/admin/status-badge';
import { formatRelative } from '@/lib/format';
import { prisma } from '@/server/db/prisma';

export const metadata = { title: 'Admin · Overview' };
export const dynamic = 'force-dynamic';

const STATUSES = ['active', 'pending', 'suspended', 'banned'] as const;

export default async function AdminOverviewPage() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, statusGroups, newUsers, roleCount, auditTotal, recentAudit] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.role.count(),
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { actor: { select: { username: true, displayName: true } } },
      }),
    ]);

  const byStatus = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])) as Record<
    string,
    number
  >;

  const cards = [
    { label: 'Total members', value: totalUsers },
    { label: 'Active', value: byStatus.active ?? 0 },
    { label: 'New (7d)', value: newUsers },
    { label: 'Roles', value: roleCount },
    { label: 'Pending', value: byStatus.pending ?? 0 },
    { label: 'Suspended', value: byStatus.suspended ?? 0 },
    { label: 'Banned', value: byStatus.banned ?? 0 },
    { label: 'Audit events', value: auditTotal },
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-neon-violet)">
          Admin
        </p>
        <h1 className="mt-2 font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Overview
        </h1>
        <p className="mt-2 text-(--color-text-secondary)">
          Live snapshot of the community. Numbers come straight from the database.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass rounded-2xl p-6">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
              {card.label}
            </p>
            <p className="mt-3 font-(family-name:--font-heading) text-3xl font-bold tabular-nums">
              {card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="font-(family-name:--font-heading) text-xl font-bold tracking-tight">
          Members by status
        </h2>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <div
              key={s}
              className="flex items-center gap-3 rounded-2xl border border-(--glass-border) bg-(--color-bg-card)/40 px-4 py-3"
            >
              <StatusBadge status={s} />
              <span className="font-(family-name:--font-heading) text-lg font-bold tabular-nums">
                {(byStatus[s] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-(family-name:--font-heading) text-xl font-bold tracking-tight">
          Recent activity
        </h2>
        {recentAudit.length === 0 ? (
          <p className="rounded-2xl border border-(--glass-border) bg-(--color-bg-card)/40 px-5 py-8 text-center text-sm text-(--color-text-muted)">
            No audit activity yet. Actions in the console will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-(--glass-border)/60 rounded-2xl border border-(--glass-border) bg-(--color-bg-card)/40">
            {recentAudit.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-(--color-text-primary)">{entry.action}</p>
                  <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
                    {entry.actor?.displayName ?? entry.actor?.username ?? 'system'}
                    {entry.targetType ? ` · ${entry.targetType}` : ''}
                  </p>
                </div>
                <time
                  className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)"
                  dateTime={entry.createdAt.toISOString()}
                >
                  {formatRelative(entry.createdAt.toISOString())}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
