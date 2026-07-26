import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<string, string> = {
  active: 'border-(--color-gekko-500)/40 bg-(--color-gekko-500)/10 text-(--color-gekko-300)',
  pending: 'border-(--color-neon-amber)/40 bg-(--color-neon-amber)/10 text-(--color-neon-amber)',
  suspended: 'border-(--color-neon-amber)/40 bg-(--color-neon-amber)/10 text-(--color-neon-amber)',
  banned: 'border-(--color-danger)/40 bg-(--color-danger)/10 text-(--color-danger)',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]',
        STATUS_STYLE[status] ??
          'border-(--glass-border) bg-(--glass-tint) text-(--color-text-secondary)',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
