'use client';

import { Eye, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Counts = { pageViews: number; uniqueVisitors: number };

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Footer visit counters. Records this page view on mount, then shows the live
 * unique-visitor + page-view totals. Renders nothing while loading or if the
 * metrics endpoint is unavailable (e.g. local/mock with no database).
 */
export function SiteStats() {
  const [counts, setCounts] = useState<Counts | null>(null);
  // Guard against React 18 StrictMode's double-invoke in dev double-counting.
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    let alive = true;
    fetch('/api/metrics/visit', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { success?: boolean; data?: Counts } | null) => {
        if (alive && json?.success && json.data) setCounts(json.data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!counts) return null;

  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-xs text-(--color-text-muted)">
      <div className="inline-flex items-center gap-1.5">
        <Users className="size-3.5 text-(--color-gekko-500)" aria-hidden />
        <dt className="sr-only">Unique visitors</dt>
        <dd>
          <span className="text-(--color-text-secondary)">
            {compact.format(counts.uniqueVisitors)}
          </span>{' '}
          unique visitors
        </dd>
      </div>
      <div className="inline-flex items-center gap-1.5">
        <Eye className="size-3.5 text-(--color-neon-cyan)" aria-hidden />
        <dt className="sr-only">Page views</dt>
        <dd>
          <span className="text-(--color-text-secondary)">{compact.format(counts.pageViews)}</span>{' '}
          page views
        </dd>
      </div>
    </dl>
  );
}
