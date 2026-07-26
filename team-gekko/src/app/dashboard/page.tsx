import { EmailVerifiedBanner } from '@/components/auth/email-verified-banner';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site.config';
import { formatRelative } from '@/lib/format';
import { auth } from '@/server/auth/config';
import { prisma } from '@/server/db/prisma';
import { ArrowUpRight, Calendar, Gamepad2, MessageCircle, Trophy } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Dashboard' };

// Server-render every visit; auth state is cookie-bound and uncacheable.
export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/dashboard');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      avatar: true,
      image: true,
      bio: true,
      xp: true,
      level: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
      lastSeenAt: true,
      roles: { include: { role: true } },
    },
  });
  // Orphaned session (valid JWT, but the user was removed) — clear it instead
  // of looping back to /login.
  if (!user) redirect('/api/force-signout');

  const avatar = user.avatar ?? user.image ?? null;
  const displayName = user.displayName ?? user.username;
  const role = user.roles[0]?.role.name ?? 'member';
  const isVerified = Boolean(user.emailVerifiedAt);

  return (
    <div className="space-y-8">
      {!isVerified && <EmailVerifiedBanner email={user.email} />}

      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={avatar} name={displayName} />
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-400)">
              Welcome back
            </p>
            <h1 className="mt-2 font-(family-name:--font-heading) text-3xl font-bold tracking-tight sm:text-4xl">
              {displayName}
            </h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
              @{user.username} · {role.replace(/_/g, ' ')}
              {user.lastSeenAt && (
                <span> · last seen {formatRelative(user.lastSeenAt.toISOString())}</span>
              )}
            </p>
          </div>
        </div>

        <Button asChild variant="glass" size="lg">
          <a href={siteConfig.links.discord} target="_blank" rel="noopener noreferrer">
            Open Discord <MessageCircle className="size-4" />
          </a>
        </Button>
      </header>

      <section
        aria-labelledby="dash-stats"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 id="dash-stats" className="sr-only">
          Your stats
        </h2>
        <StatCard label="XP" value={user.xp.toLocaleString()} sub={`Level ${user.level}`} />
        <StatCard
          label="Status"
          value={user.status === 'active' ? 'Active' : user.status}
          sub={isVerified ? 'Email verified' : 'Pending verification'}
        />
        <StatCard label="Role" value={role.replace(/_/g, ' ')} sub="Community access" />
        <StatCard
          label="Member since"
          value={user.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          sub={formatRelative(user.createdAt.toISOString())}
        />
      </section>

      <section aria-labelledby="dash-quick" className="space-y-4">
        <h2
          id="dash-quick"
          className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-400)"
        >
          Jump back in
        </h2>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/games"
            icon={Gamepad2}
            title="Browse games"
            description="Daily-rotation and weekend titles the squad runs."
          />
          <QuickLink
            href="/events"
            icon={Calendar}
            title="Upcoming events"
            description="Tournaments, workshops, meetups, streams."
          />
        </ul>
      </section>

      <section aria-labelledby="dash-next" className="glass space-y-3 rounded-3xl p-6 md:p-8">
        <h2
          id="dash-next"
          className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-400)"
        >
          Phase 3 preview
        </h2>
        <p className="font-(family-name:--font-heading) text-lg font-bold tracking-tight">
          Profile editor, achievements, notifications, and real-time presence are next.
        </p>
        <p className="text-sm text-(--color-text-secondary)">
          The auth surface is live. Phase 3 layers in profile editing, the achievement
          constellation, notifications inbox, and live presence via Pusher.
        </p>
      </section>
    </div>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={72}
        height={72}
        unoptimized
        className="size-16 shrink-0 rounded-full border border-(--glass-border) object-cover sm:size-20"
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden
      className="grid size-16 shrink-0 place-items-center rounded-full border border-(--color-gekko-500)/50 bg-(--color-gekko-500)/10 font-(family-name:--font-heading) text-2xl font-bold text-(--color-gekko-300)"
    >
      {initials || '·'}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
        {label}
      </p>
      <p className="mt-2 font-(family-name:--font-heading) text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-(--color-text-secondary)">{sub}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex h-full flex-col gap-3 rounded-2xl border border-(--glass-border) bg-(--color-bg-card)/40 p-5 transition hover:border-(--color-gekko-500)/40"
      >
        <div className="flex items-start justify-between">
          <span className="grid size-10 place-items-center rounded-xl border border-(--color-gekko-500)/40 bg-(--color-gekko-500)/10 text-(--color-gekko-300)">
            <Icon className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-(--color-text-muted) transition group-hover:text-(--color-gekko-300)" />
        </div>
        <div>
          <p className="font-(family-name:--font-heading) text-base font-bold tracking-tight">
            {title}
          </p>
          <p className="mt-1 text-sm text-(--color-text-secondary)">{description}</p>
        </div>
      </Link>
    </li>
  );
}
