import { Button } from '@/components/ui/button';
import { type LeadershipMember, leadership } from '@/config/leadership.config';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

const accentMap = {
  gekko: { hex: '#00ff88', soft: 'rgba(0,255,140,0.20)' },
  violet: { hex: '#8b5cf6', soft: 'rgba(139,92,246,0.22)' },
  cyan: { hex: '#22d3ee', soft: 'rgba(34,211,238,0.22)' },
  pink: { hex: '#f472b6', soft: 'rgba(244,114,182,0.22)' },
  amber: { hex: '#fbbf24', soft: 'rgba(251,191,36,0.22)' },
} as const;

export function Leadership() {
  return (
    <section id="leadership" className="relative px-6 py-20 md:px-10 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-400)">
            Leadership
          </p>
          <h2 className="mt-4 font-(family-name:--font-heading) text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Meet the people steering Team Gekko
          </h2>
          <p className="mt-4 text-(--color-text-secondary)">
            A small group setting direction and supporting the community day-to-day.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:mt-16 md:gap-6 lg:grid-cols-3">
          {leadership.map((member) => (
            <LeadershipCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadershipCard({ member }: { member: LeadershipMember }) {
  const accent = accentMap[member.accent];

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-(--glass-border) bg-(--color-bg-card)/40 p-6 transition duration-500 hover:border-(--color-gekko-500)/40 md:p-8"
      style={{ '--card-accent': accent.hex } as React.CSSProperties}
    >
      {/* Accent glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full opacity-0 blur-3xl transition duration-700 group-hover:opacity-100"
        style={{ background: accent.soft }}
      />

      {/* Identity row */}
      <header className="relative flex items-center gap-5">
        {/* Avatar with conic-gradient ring */}
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="absolute -inset-0.5 rounded-full opacity-80 blur-[2px]"
            style={{
              background: `conic-gradient(from 0deg, ${accent.hex}, #22d3ee, #8b5cf6, ${accent.hex})`,
            }}
          />
          <div className="relative size-20 overflow-hidden rounded-full border border-(--glass-border) bg-(--color-bg-elev-1) md:size-24">
            <Image
              src={member.image}
              alt={`${member.name} — ${member.role}`}
              width={192}
              height={192}
              sizes="(max-width: 768px) 80px, 96px"
              className="size-full object-cover"
              priority={member.id === 'president'}
            />
          </div>
          {/* Online dot */}
          <span
            aria-hidden
            className="absolute bottom-1 right-1 flex size-3.5 items-center justify-center rounded-full border-2 border-(--color-bg-card) bg-(--color-success)"
          >
            <span className="absolute size-3 animate-ping rounded-full bg-(--color-success) opacity-60" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: accent.hex }}
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ backgroundColor: accent.hex }}
            />
            {member.role}
          </p>
          <h3 className="mt-1.5 font-(family-name:--font-heading) text-2xl font-bold leading-tight tracking-tight md:text-3xl">
            {member.name}
          </h3>
        </div>
      </header>

      {/* Bio — takes available space so footer pins to bottom */}
      <p className="relative mt-6 flex-1 text-balance-pretty text-sm text-(--color-text-secondary) md:text-base">
        {member.bio}
      </p>

      {/* Badges */}
      {member.badges && member.badges.length > 0 && (
        <ul className="relative mt-6 flex flex-wrap gap-2">
          {member.badges.map((badge) => (
            <li
              key={badge}
              className="rounded-full border border-(--glass-border) bg-(--glass-tint) px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-secondary)"
            >
              {badge}
            </li>
          ))}
        </ul>
      )}

      {/* Footer — portfolio button, pinned to bottom */}
      {member.portfolio && (
        <footer className="relative mt-7 border-t border-(--glass-border) pt-6">
          <Button
            asChild
            variant="outline"
            size="default"
            className="w-full justify-between md:w-auto"
          >
            <a
              href={member.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${member.name}'s portfolio (opens in new tab)`}
            >
              <span>Portfolio</span>
              <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </Button>
        </footer>
      )}
    </article>
  );
}
