'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, LayoutDashboard, LogOut, Mail, Shield, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'owner']);

/**
 * Reads the Auth.js session via `useSession()`. Returns null while loading,
 * a Sign-in/Get-started pair when guest, or the avatar dropdown when authed.
 *
 * The dropdown closes on outside click, ESC, route change, or after the user
 * picks an item.
 */
export function UserMenu({ variant = 'default' }: { variant?: 'default' | 'mobile' }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status === 'loading') {
    return <div aria-hidden className="h-9 w-24 animate-pulse rounded-xl bg-(--glass-tint)" />;
  }

  if (!session?.user) {
    if (variant === 'mobile') {
      return (
        <div className="grid grid-cols-2 gap-2 border-t border-(--glass-border) pt-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-center text-sm text-(--color-text-secondary) transition hover:bg-(--glass-tint) hover:text-(--color-text-primary)"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-(--color-gekko-500) px-3 py-2 text-center text-sm font-medium text-(--color-bg-void) transition hover:bg-(--color-gekko-400)"
          >
            Get started
          </Link>
        </div>
      );
    }
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm text-(--color-text-secondary) transition hover:bg-(--glass-tint) hover:text-(--color-text-primary)"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-(--color-gekko-500) px-3 py-2 text-sm font-medium text-(--color-bg-void) transition hover:bg-(--color-gekko-400)"
        >
          Get started
        </Link>
      </div>
    );
  }

  const user = session.user;
  const displayName = user.name ?? user.username ?? 'Member';
  const handle = user.username ? `@${user.username}` : user.email;
  const role = user.role ?? 'member';
  const isAdmin = ADMIN_ROLES.has(role);
  const unverified = false; // session doesn't carry emailVerified; the banner on /dashboard handles that flow

  if (variant === 'mobile') {
    return (
      <div className="border-t border-(--glass-border) pt-3">
        <div className="mb-3 flex items-center gap-3 px-1">
          <Avatar src={user.image ?? null} name={displayName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-(--color-text-primary)">{displayName}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
              {handle} · {role.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <nav className="space-y-1">
          <MobileLink href="/dashboard" icon={LayoutDashboard}>
            Dashboard
          </MobileLink>
          <MobileLink href="/dashboard/profile" icon={User}>
            Profile
          </MobileLink>
          {isAdmin && (
            <MobileLink href="/admin" icon={Shield}>
              Admin
            </MobileLink>
          )}
          {unverified && (
            <MobileLink href="/verify-email" icon={Mail}>
              Verify email
            </MobileLink>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-(--color-danger) transition hover:bg-(--color-danger)/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-(--glass-border) hover:bg-(--glass-tint)',
          open && 'border-(--glass-border) bg-(--glass-tint)',
        )}
      >
        <Avatar src={user.image ?? null} name={displayName} size={32} />
        <span className="hidden text-sm text-(--color-text-secondary) sm:inline">
          {displayName.split(' ')[0]}
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 text-(--color-text-muted) transition',
            open && 'rotate-180 text-(--color-text-primary)',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="nav-glass absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar src={user.image ?? null} name={displayName} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-(family-name:--font-heading) text-sm font-bold tracking-tight">
                {displayName}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted)">
                {handle}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-gekko-400)">
                {role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="my-1 h-px bg-(--glass-border)" />

          <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>
            Dashboard
          </MenuLink>
          <MenuLink href="/dashboard/profile" icon={User} onClick={() => setOpen(false)}>
            View profile
          </MenuLink>
          {isAdmin && (
            <MenuLink href="/admin" icon={Shield} onClick={() => setOpen(false)}>
              Admin console
            </MenuLink>
          )}
          {unverified && (
            <MenuLink href="/verify-email" icon={Mail} onClick={() => setOpen(false)}>
              Verify email
            </MenuLink>
          )}

          <div className="my-1 h-px bg-(--glass-border)" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: '/' });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-(--color-danger) transition hover:bg-(--color-danger)/10"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ src, name, size = 32 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full border border-(--glass-border) object-cover"
        style={{ width: size, height: size }}
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
      className="grid shrink-0 place-items-center rounded-full border border-(--color-gekko-500)/50 bg-(--color-gekko-500)/10 font-(family-name:--font-heading) font-bold text-(--color-gekko-300)"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || '·'}
    </span>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-(--color-text-secondary) transition hover:bg-(--glass-tint) hover:text-(--color-text-primary)"
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );
}

function MobileLink({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-(--color-text-secondary) transition hover:bg-(--glass-tint) hover:text-(--color-text-primary)"
    >
      <Icon className="size-4" />
      {children}
    </Link>
  );
}
