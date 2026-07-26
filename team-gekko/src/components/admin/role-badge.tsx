import { cn } from '@/lib/utils';

// Color by tier. Owner/super_admin = violet, admin = gekko green,
// staff (moderator/developer/contributor) = cyan, everything else = muted.
const ROLE_STYLE: Record<string, string> = {
  owner: 'border-(--color-neon-violet)/45 bg-(--color-neon-violet)/10 text-(--color-neon-violet)',
  super_admin:
    'border-(--color-neon-violet)/45 bg-(--color-neon-violet)/10 text-(--color-neon-violet)',
  admin: 'border-(--color-gekko-500)/40 bg-(--color-gekko-500)/10 text-(--color-gekko-300)',
  moderator: 'border-(--color-neon-cyan)/40 bg-(--color-neon-cyan)/10 text-(--color-neon-cyan)',
  developer: 'border-(--color-neon-cyan)/40 bg-(--color-neon-cyan)/10 text-(--color-neon-cyan)',
  contributor: 'border-(--color-neon-cyan)/40 bg-(--color-neon-cyan)/10 text-(--color-neon-cyan)',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]',
        ROLE_STYLE[role] ??
          'border-(--glass-border) bg-(--glass-tint) text-(--color-text-secondary)',
      )}
    >
      {role.replace(/_/g, ' ')}
    </span>
  );
}
