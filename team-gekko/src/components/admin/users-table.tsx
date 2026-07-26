'use client';

import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { EmptyRow, TBody, THead, Table, Td, Th, Tr } from '@/components/admin/data-table';
import { Pagination } from '@/components/admin/pagination';
import { ROLES } from '@/config/roles.config';
import { ApiError, api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { USER_STATUSES } from '@/lib/validators';
import type { AdminUserList } from '@/server/admin/users';
import { Loader2, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

function rank(role: string): number {
  const i = ROLES.indexOf(role as (typeof ROLES)[number]);
  return i < 0 ? 0 : i;
}

const selectClass =
  'rounded-lg border border-(--glass-border) bg-(--color-bg-deep)/60 px-2.5 py-1.5 text-xs text-(--color-text-primary) outline-none transition focus:border-(--color-gekko-500) disabled:cursor-not-allowed disabled:opacity-50';

export function UsersTable({
  data,
  actorId,
  actorRole,
}: {
  data: AdminUserList;
  actorId: string;
  actorRole: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(params.get('q') ?? '');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; status: string; name: string } | null>(null);

  const actorRank = rank(actorRole);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // reset to first page on any filter change
    router.push(`${pathname}?${next.toString()}`);
  };

  const apply = async (id: string, patch: { role?: string; status?: string }) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/users/${id}`, patch);
      toast.success('User updated.');
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const onStatus = (u: AdminUserList['users'][number], status: string) => {
    if (status === u.status) return;
    if (status === 'banned' || status === 'suspended') {
      setConfirm({ id: u.id, status, name: u.displayName ?? u.username });
      return;
    }
    apply(u.id, { status });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('q', q.trim());
          }}
          className="relative flex-1"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--color-text-muted)" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, username, or email…"
            className="w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-gekko-500)"
          />
        </form>
        <select
          value={params.get('role') ?? ''}
          onChange={(e) => setParam('role', e.target.value)}
          className={cn(selectClass, 'py-2.5')}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={params.get('status') ?? ''}
          onChange={(e) => setParam('status', e.target.value)}
          className={cn(selectClass, 'py-2.5')}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {USER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
        {data.total} {data.total === 1 ? 'user' : 'users'}
      </p>

      <Table>
        <THead>
          <Tr>
            <Th>User</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th className="text-right">Joined</Th>
          </Tr>
        </THead>
        <TBody>
          {data.users.length === 0 ? (
            <EmptyRow colSpan={4} message="No users match those filters." />
          ) : (
            data.users.map((u) => {
              const locked = u.id === actorId || rank(u.role) >= actorRank;
              const busy = busyId === u.id;
              return (
                <Tr key={u.id}>
                  <Td>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-(--color-text-primary)">
                        {u.displayName ?? u.username}
                        {u.id === actorId && (
                          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-(--color-text-muted)">
                            you
                          </span>
                        )}
                      </p>
                      <p className="truncate font-mono text-[10px] text-(--color-text-muted)">
                        @{u.username} · {u.email}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <select
                      value={u.role}
                      disabled={locked || busy}
                      onChange={(e) => apply(u.id, { role: e.target.value })}
                      className={selectClass}
                      aria-label={`Role for ${u.username}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} disabled={rank(r) >= actorRank && r !== u.role}>
                          {r.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <select
                        value={u.status}
                        disabled={locked || busy}
                        onChange={(e) => onStatus(u, e.target.value)}
                        className={selectClass}
                        aria-label={`Status for ${u.username}`}
                      >
                        {USER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {busy && (
                        <Loader2 className="size-4 animate-spin text-(--color-text-muted)" />
                      )}
                    </div>
                  </Td>
                  <Td className="text-right font-mono text-[10px] uppercase tracking-[0.15em] text-(--color-text-muted)">
                    {new Date(u.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Td>
                </Tr>
              );
            })
          )}
        </TBody>
      </Table>

      <Pagination page={data.page} pageCount={data.pageCount} />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.status === 'banned' ? 'Ban this user?' : 'Suspend this user?'}
        description={
          confirm
            ? `${confirm.name} will be ${confirm.status} and immediately blocked from signing in.`
            : ''
        }
        destructive
        confirmLabel={confirm?.status === 'banned' ? 'Ban user' : 'Suspend user'}
        loading={busyId === confirm?.id}
        onConfirm={() => {
          if (confirm) {
            apply(confirm.id, { status: confirm.status });
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}
