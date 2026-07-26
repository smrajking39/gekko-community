'use client';

import { RoleBadge } from '@/components/admin/role-badge';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function AdminAccount({ name, role }: { name: string; role: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-(--glass-border) bg-(--color-bg-card)/40 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-tight">{name}</p>
        <div className="mt-1.5">
          <RoleBadge role={role} />
        </div>
      </div>
      <Button
        variant="glass"
        size="sm"
        className="w-full"
        onClick={() => signOut({ callbackUrl: '/login' })}
      >
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}
