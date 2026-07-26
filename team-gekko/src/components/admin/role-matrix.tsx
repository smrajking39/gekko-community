'use client';

import { RoleBadge } from '@/components/admin/role-badge';
import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api';
import { Check, Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const LOCKED = new Set(['owner', 'super_admin']);

type RoleData = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
};

type PermissionMeta = { key: string; description: string };

export function RoleMatrix({
  roles,
  permissions,
}: {
  roles: RoleData[];
  permissions: PermissionMeta[];
}) {
  return (
    <div className="space-y-5">
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} permissions={permissions} />
      ))}
    </div>
  );
}

function RoleCard({ role, permissions }: { role: RoleData; permissions: PermissionMeta[] }) {
  const router = useRouter();
  const locked = LOCKED.has(role.name);
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions));
  const [saving, setSaving] = useState(false);

  const original = new Set(role.permissions);
  const dirty = selected.size !== original.size || ![...selected].every((k) => original.has(k));

  const toggle = (key: string) => {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/roles/${role.id}`, { permissions: [...selected] });
      toast.success(`Updated ${role.name.replace(/_/g, ' ')} permissions.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-(--glass-border) bg-(--color-bg-card)/40 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RoleBadge role={role.name} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
            {role.userCount} {role.userCount === 1 ? 'user' : 'users'} · {selected.size} perms
          </span>
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
            <Lock className="size-3" /> System role
          </span>
        ) : (
          <Button size="sm" variant="glass" disabled={!dirty || saving} onClick={save}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save
          </Button>
        )}
      </div>
      {role.description && (
        <p className="mt-2 text-sm text-(--color-text-secondary)">{role.description}</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {permissions.map((perm) => {
          const checked = selected.has(perm.key);
          return (
            <label
              key={perm.key}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
                checked
                  ? 'border-(--color-gekko-500)/40 bg-(--color-gekko-500)/5'
                  : 'border-(--glass-border) bg-(--color-bg-deep)/30'
              } ${locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-(--color-gekko-500)/30'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={locked}
                onChange={() => toggle(perm.key)}
                className="mt-0.5 size-4 rounded border-(--glass-border) bg-(--color-bg-deep) accent-(--color-gekko-500)"
              />
              <span className="min-w-0">
                <span className="block font-mono text-[11px] text-(--color-text-primary)">
                  {perm.key}
                </span>
                <span className="block text-[11px] text-(--color-text-muted)">
                  {perm.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
