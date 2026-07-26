'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** URL-driven pagination — updates the `page` search param in place. */
export function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (pageCount <= 1) return null;

  const go = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set('page', String(p));
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted) tabular-nums">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button variant="glass" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <Button variant="glass" size="sm" disabled={page >= pageCount} onClick={() => go(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
