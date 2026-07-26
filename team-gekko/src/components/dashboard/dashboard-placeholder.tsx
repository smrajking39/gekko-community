import { Construction } from 'lucide-react';

/** "Coming soon" panel for dashboard sections not yet built out. Mirrors
 *  AdminPlaceholder so the sidebar links resolve instead of 404ing. */
export function DashboardPlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-400)">
          Dashboard
        </p>
        <h1 className="mt-2 font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          {title}
        </h1>
      </header>

      <div className="glass flex flex-col items-center justify-center rounded-3xl px-6 py-20 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-(--glass-border) bg-(--color-bg-deep)/60 text-(--color-gekko-300)">
          <Construction className="size-6" />
        </div>
        <h2 className="mt-5 font-(family-name:--font-heading) text-xl font-bold tracking-tight">
          Coming soon
        </h2>
        <p className="mt-2 max-w-md text-sm text-(--color-text-secondary)">
          {description ??
            `Your ${title} space is on the roadmap. The auth surface is live — this module lands in a later pass.`}
        </p>
      </div>
    </div>
  );
}
