import { AdminAccount } from '@/components/admin/admin-account';
import { ADMIN_ROLES, getCurrentUser } from '@/server/lib/auth';
import {
  BarChart3,
  ExternalLink,
  FileText,
  Flag,
  Gamepad2,
  Home,
  Image as ImageIcon,
  LifeBuoy,
  Megaphone,
  ScrollText,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const metadata = { title: 'Admin' };

const adminGroups = [
  {
    label: 'People',
    items: [
      { href: '/admin', label: 'Overview', icon: Home },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/roles', label: 'Roles', icon: ShieldCheck },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/content/posts', label: 'Posts', icon: FileText },
      { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
      { href: '/admin/games', label: 'Games', icon: Gamepad2 },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { href: '/admin/events', label: 'Events', icon: Flag },
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/audit', label: 'Audit log', icon: ScrollText },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/admin/system', label: 'System', icon: Server },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth — middleware already gates /admin, but never render the
  // console for a non-admin (e.g. a stale JWT) even if middleware is bypassed.
  const user = await getCurrentUser();
  // Orphaned session (valid JWT, user removed) — clear it rather than looping
  // back through /login (which middleware would bounce straight back here).
  if (!user) redirect('/api/force-signout');
  if (!user.roles.some((r) => ADMIN_ROLES.has(r))) notFound();

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="hidden flex-col border-r border-(--glass-border) bg-(--color-bg-deep) p-6 lg:flex">
        <Link href="/" className="flex items-center gap-2 pb-2">
          <span className="h-2 w-2 rounded-full bg-(--color-gekko-500) glow-gekko" />
          <span className="font-(family-name:--font-heading) text-lg font-bold tracking-tight">
            Team Gekko
          </span>
        </Link>
        <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-neon-violet)">
          admin console
        </p>
        <nav className="space-y-6">
          {adminGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--color-text-secondary) transition hover:bg-(--color-bg-elev-1) hover:text-(--color-text-primary)"
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-8">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted) transition hover:text-(--color-text-primary)"
          >
            <ExternalLink className="size-3.5" /> View site
          </Link>
          <AdminAccount name={user.displayName ?? user.username} role={user.role} />
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}
