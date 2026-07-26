import { siteConfig } from '@/config/site.config';
import { Activity, Bell, Gamepad2, Home, Settings, ShieldCheck, Trophy, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const sidebarItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/games', label: 'My Games', icon: Gamepad2 },
  { href: '/dashboard/achievements', label: 'Achievements', icon: Trophy },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/events', label: 'Events', icon: Activity },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/security', label: 'Security', icon: ShieldCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-(--glass-border) bg-(--color-bg-deep) p-6 lg:block">
        <Link href="/" className="flex items-center gap-2.5 pb-8" aria-label={siteConfig.name}>
          <Image
            src="/brand/gekko-logo-128.png"
            alt=""
            width={193}
            height={128}
            className="h-8 w-auto"
          />
          <span className="font-(family-name:--font-heading) text-lg font-bold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
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
        </nav>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}
