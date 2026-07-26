import { siteConfig } from '@/config/site.config';
import Image from 'next/image';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="mesh-bg" />
      <div className="grid-floor" />

      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-6 md:p-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label={siteConfig.name}>
          <Image
            src="/brand/gekko-logo-128.png"
            alt=""
            width={193}
            height={128}
            priority
            className="h-8 w-auto"
          />
          <span className="font-(family-name:--font-heading) text-lg font-bold tracking-tight">
            {siteConfig.shortName}
          </span>
        </Link>
      </header>

      <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-24">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Right pane — large brand surface on desktop. */}
        <div className="relative hidden overflow-hidden border-l border-(--glass-border) lg:block">
          {/* Ambient glow. */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(at 30% 30%, rgba(244,67,82,0.18) 0%, transparent 55%), radial-gradient(at 70% 70%, rgba(0,255,140,0.10) 0%, transparent 60%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-transparent via-(--color-bg-void)/30 to-(--color-bg-void)/60"
          />

          {/* Centered logo. */}
          <div className="relative flex h-full flex-col items-center justify-center px-10">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-16 rounded-full opacity-60 blur-3xl"
                style={{
                  background: 'radial-gradient(circle, rgba(244,67,82,0.35) 0%, transparent 70%)',
                }}
              />
              <Image
                src="/brand/gekko-logo-512.png"
                alt={`${siteConfig.name} logo`}
                width={577}
                height={512}
                priority
                className="relative h-auto w-64 max-w-full"
              />
            </div>
          </div>

          <div className="absolute bottom-10 left-10 right-10 font-mono text-xs uppercase tracking-[0.3em] text-(--color-text-muted)">
            Play. Compete. Connect. Grow with {siteConfig.name}.
          </div>
        </div>
      </main>
    </div>
  );
}
