import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site.config';
import { Lock } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Registration closed',
  description: 'Team Gekko is currently in admins-only mode. Public sign-ups are closed.',
};

export default function RegisterPage() {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-(--glass-border) bg-(--glass-tint) text-(--color-gekko-400)">
          <Lock className="size-5" />
        </span>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-500)">
          Registration closed
        </p>
        <h1 className="font-(family-name:--font-heading) text-3xl font-bold tracking-tight sm:text-4xl">
          Sign-ups are invite-only right now
        </h1>
        <p className="text-sm text-(--color-text-secondary)">
          Team Gekko is in admins-only mode while we build out the platform. Accounts are
          provisioned by an admin — reach out in Discord if you need access.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={siteConfig.links.discord} target="_blank" rel="noopener noreferrer">
            Ask in Discord
          </a>
        </Button>
        <Button asChild variant="glass" size="lg" className="w-full sm:w-auto">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
