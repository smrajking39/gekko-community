'use client';

import { PulseDot } from '@/components/shared/pulse-dot';
import { type NavItem, publicNav } from '@/config/nav.config';
import { siteConfig } from '@/config/site.config';
import { mockEvents } from '@/data/events.mock';
import { cn } from '@/lib/utils';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/** Internal hrefs that currently point at a live event's results page. */
const liveHrefs = new Set(
  mockEvents.filter((e) => e.status === 'live' && e.resultsUrl).map((e) => e.resultsUrl),
);

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out',
        scrolled ? 'py-2' : 'py-4',
      )}
    >
      {/* Always-on top shade so nav text stays legible over any hero/content.
          Fades out once the frosted pill takes over on scroll. */}
      <div
        aria-hidden
        className={cn(
          'nav-scrim pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 transition-opacity duration-300',
          scrolled ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div
          className={cn(
            'flex items-center justify-between gap-4 rounded-2xl px-4 py-2 transition-all duration-300',
            scrolled ? 'nav-glass' : 'border border-transparent bg-transparent',
          )}
        >
          <Link href="/" className="group flex items-center gap-2.5" aria-label={siteConfig.name}>
            <Image
              src="/brand/gekko-logo-128.png"
              alt=""
              width={193}
              height={128}
              priority
              className="h-7 w-auto transition-transform duration-300 group-hover:scale-105 sm:h-8"
            />
            <span className="font-(family-name:--font-heading) text-lg font-bold tracking-tight">
              {siteConfig.shortName}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {publicNav.map((item) => (
              <DesktopNavLink
                key={item.href}
                item={item}
                active={!item.external && isActive(pathname, item.href)}
                live={!!item.href && liveHrefs.has(item.href)}
              />
            ))}
          </nav>

          <div className="hidden md:block">
            <a
              href={siteConfig.links.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-(--color-gekko-500) px-3.5 py-2 text-sm font-medium text-(--color-bg-void) transition hover:bg-(--color-gekko-400)"
            >
              Join Discord
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="rounded-lg p-2 text-(--color-text-primary) transition hover:bg-(--glass-tint) md:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile menu + dismiss backdrop */}
        {mobileOpen && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 cursor-default bg-(--color-bg-void)/70 backdrop-blur-sm md:hidden"
            />
            <div className="nav-glass relative z-10 mt-2 origin-top rounded-2xl p-4 md:hidden">
              <nav className="space-y-1">
                {publicNav.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    item={item}
                    active={!item.external && isActive(pathname, item.href)}
                    live={!!item.href && liveHrefs.has(item.href)}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
              <div className="mt-3 border-t border-(--glass-border) pt-3">
                <a
                  href={siteConfig.links.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg bg-(--color-gekko-500) px-3 py-2 text-center text-sm font-medium text-(--color-bg-void) transition hover:bg-(--color-gekko-400)"
                >
                  Join Discord
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function DesktopNavLink({
  item,
  active,
  live,
}: {
  item: NavItem;
  active: boolean;
  live: boolean;
}) {
  const className = cn(
    'group relative rounded-lg px-3 py-2 text-sm transition-colors',
    active
      ? 'text-(--color-text-primary)'
      : 'text-(--color-text-secondary) hover:text-(--color-text-primary)',
  );
  const content = (
    <>
      <span className="inline-flex items-center gap-1.5">
        {item.label}
        {live && <LiveDot />}
        {item.external && (
          <ArrowUpRight className="size-3 opacity-50 transition-opacity group-hover:opacity-90" />
        )}
      </span>
      {/* Animated gradient underline — full when active, grows from center on hover */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full bg-gradient-to-r from-(--color-gekko-500) to-(--color-neon-cyan) transition-transform duration-300 ease-out',
          active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
        )}
      />
    </>
  );

  return item.external ? (
    <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={item.href} aria-current={active ? 'page' : undefined} className={className}>
      {content}
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
  live,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  live: boolean;
  onNavigate: () => void;
}) {
  const className = cn(
    'flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm transition',
    active
      ? 'bg-(--color-gekko-500)/10 font-medium text-(--color-gekko-300)'
      : 'text-(--color-text-secondary) hover:bg-(--glass-tint) hover:text-(--color-text-primary)',
  );

  return item.external ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className={className}
    >
      {item.label}
      <ArrowUpRight className="size-3.5 opacity-50" />
    </a>
  ) : (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={className}
    >
      {item.label}
      {live && <LiveDot />}
    </Link>
  );
}

/** Small pulsing dot signalling a live event link. */
function LiveDot() {
  return (
    <span className="inline-flex items-center" title="Live now">
      <PulseDot />
      <span className="sr-only">Live</span>
    </span>
  );
}
