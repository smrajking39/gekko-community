import { cn } from '@/lib/utils';

/** Presentational table primitives shared by admin lists. Server-safe (no hooks). */

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-(--glass-border) bg-(--color-bg-card)/40">
      <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-(--glass-border) bg-(--color-bg-deep)/40">{children}</thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn('border-b border-(--glass-border)/60 last:border-b-0', className)}>
      {children}
    </tr>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-(--color-text-muted)',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 align-middle text-(--color-text-secondary)', className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-(--color-text-muted)">
        {message}
      </td>
    </tr>
  );
}
