import { EmptyRow, TBody, THead, Table, Td, Th, Tr } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { formatRelative } from '@/lib/format';
import { prisma } from '@/server/db/prisma';

export const metadata = { title: 'Admin · Audit log' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : '1') || 1);

  const [total, entries] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { username: true, displayName: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-neon-violet)">
          Operations
        </p>
        <h1 className="mt-2 font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Audit log
        </h1>
        <p className="mt-2 text-(--color-text-secondary)">
          Every privileged action, newest first. {total.toLocaleString()} total events.
        </p>
      </header>

      <div className="space-y-4">
        <Table>
          <THead>
            <Tr>
              <Th>Action</Th>
              <Th>Actor</Th>
              <Th>Target</Th>
              <Th className="text-right">When</Th>
            </Tr>
          </THead>
          <TBody>
            {entries.length === 0 ? (
              <EmptyRow colSpan={4} message="No audit activity yet." />
            ) : (
              entries.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-mono text-(--color-text-primary)">{e.action}</Td>
                  <Td>{e.actor?.displayName ?? e.actor?.username ?? 'system'}</Td>
                  <Td className="font-mono text-[11px] text-(--color-text-muted)">
                    {e.targetType
                      ? `${e.targetType}${e.targetId ? `:${e.targetId.slice(0, 8)}` : ''}`
                      : '—'}
                  </Td>
                  <Td className="text-right font-mono text-[10px] uppercase tracking-[0.15em] text-(--color-text-muted)">
                    {formatRelative(e.createdAt.toISOString())}
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </Table>
        <Pagination page={page} pageCount={pageCount} />
      </div>
    </div>
  );
}
