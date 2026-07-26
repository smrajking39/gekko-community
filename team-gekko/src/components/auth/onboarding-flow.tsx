'use client';

import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site.config';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  ImagePlus,
  MessageCircle,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const ACCENTS = ['gekko', 'violet', 'cyan', 'pink', 'amber'] as const;
const ACCENT_HEX: Record<(typeof ACCENTS)[number], string> = {
  gekko: '#00ff88',
  violet: '#8b5cf6',
  cyan: '#22d3ee',
  pink: '#f472b6',
  amber: '#fbbf24',
};

const GAMES = [
  { slug: 'valorant', label: 'Valorant' },
  { slug: 'pubg', label: 'PUBG' },
  { slug: 'cs2', label: 'CS2' },
  { slug: 'fifa', label: 'EA SPORTS FC' },
  { slug: 'apex', label: 'Apex Legends' },
  { slug: 'rocket-league', label: 'Rocket League' },
  { slug: 'overwatch-2', label: 'Overwatch 2' },
  { slug: 'league-of-legends', label: 'League of Legends' },
  { slug: 'minecraft', label: 'Minecraft' },
];

const GOALS = [
  { value: 'climb', label: 'Climb rank', detail: 'Tryhard nights, ranked grinds, coaching.' },
  { value: 'casual', label: 'Casual nights', detail: 'Customs, chill queues, weekend runs.' },
  { value: 'compete', label: 'Compete', detail: 'Cups, brackets, tournament prep.' },
  { value: 'community', label: 'Hang out', detail: 'Voice channels, meetups, just enjoy it.' },
];

type Step = 0 | 1 | 2 | 3 | 4;

export function OnboardingFlow() {
  const [step, setStep] = useState<Step>(0);
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]>('gekko');
  const [initials, setInitials] = useState('GK');
  const [pickedGames, setPickedGames] = useState<string[]>([]);
  const [linkedDiscord, setLinkedDiscord] = useState(false);
  const [goal, setGoal] = useState<string | null>(null);

  const toggleGame = (slug: string) =>
    setPickedGames((curr) =>
      curr.includes(slug) ? curr.filter((g) => g !== slug) : [...curr, slug],
    );

  const next = () => setStep((s) => Math.min(4, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  return (
    <div className="space-y-7">
      {/* Progress */}
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted) tabular-nums">
          Step {Math.min(step + 1, 4)} of 4
        </p>
        <div className="flex h-1.5 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'flex-1 rounded-full transition',
                i <= step ? 'bg-(--color-gekko-500)' : 'bg-(--color-bg-elev-1)',
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <Section
          icon={ImagePlus}
          title="Pick an avatar"
          description="Use any image you have, or roll with a generated initials avatar for now. You can change it later in settings."
        >
          <div className="flex flex-col items-center gap-5">
            <div
              className="relative grid size-32 place-items-center rounded-full border-2 font-(family-name:--font-heading) text-4xl font-bold tracking-tight"
              style={{
                borderColor: `${ACCENT_HEX[accent]}88`,
                background: `linear-gradient(135deg, ${ACCENT_HEX[accent]}22, transparent 60%)`,
                color: ACCENT_HEX[accent],
              }}
            >
              {initials.slice(0, 2).toUpperCase()}
            </div>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2))}
              className="w-32 rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 px-3 py-2 text-center text-sm uppercase tracking-[0.3em] text-(--color-text-primary) outline-none focus:border-(--color-gekko-500)"
              maxLength={2}
              aria-label="Avatar initials"
            />
            <div className="flex gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-label={`Use ${a} accent`}
                  aria-pressed={accent === a}
                  onClick={() => setAccent(a)}
                  className={cn(
                    'size-7 rounded-full border-2 transition',
                    accent === a ? 'scale-110' : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                  style={{
                    background: ACCENT_HEX[a],
                    borderColor: accent === a ? '#fff' : 'transparent',
                  }}
                />
              ))}
            </div>
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
              Real avatar upload ships with Cloudinary integration · Phase 4
            </p>
          </div>
        </Section>
      )}

      {step === 1 && (
        <Section
          icon={Gamepad2}
          title="Pick the games you play"
          description="We use this to surface squads, events, and posts that match what you actually play. Pick as many or as few as you want — you can change this later."
        >
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GAMES.map((g) => {
              const picked = pickedGames.includes(g.slug);
              return (
                <li key={g.slug}>
                  <button
                    type="button"
                    onClick={() => toggleGame(g.slug)}
                    aria-pressed={picked}
                    className={cn(
                      'w-full rounded-2xl border px-3 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition',
                      picked
                        ? 'border-(--color-gekko-500)/60 bg-(--color-gekko-500)/10 text-(--color-gekko-300)'
                        : 'border-(--glass-border) bg-(--color-bg-deep)/30 text-(--color-text-secondary) hover:border-(--color-gekko-500)/40 hover:text-(--color-text-primary)',
                    )}
                  >
                    {g.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted) tabular-nums">
            {pickedGames.length} selected
          </p>
        </Section>
      )}

      {step === 2 && (
        <Section
          icon={MessageCircle}
          title="Link your Discord"
          description="Most squads form in Discord — linking your account lets us route invites, event pings, and squad-finder matches to the right person."
        >
          {linkedDiscord ? (
            <div className="flex items-center gap-3 rounded-2xl border border-(--color-gekko-500)/50 bg-(--color-gekko-500)/10 p-4 text-sm">
              <CheckCircle2 className="size-5 text-(--color-gekko-300)" />
              <span className="text-(--color-text-primary)">
                Linked. We'll DM you the invite once you finish onboarding.
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                type="button"
                variant="glass"
                size="lg"
                className="w-full"
                onClick={() => setLinkedDiscord(true)}
              >
                Link Discord account
              </Button>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
                Or skip — you can link from Settings later
              </p>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <a href={siteConfig.links.discord} target="_blank" rel="noopener noreferrer">
                  Open the Discord server <ArrowRight className="size-3" />
                </a>
              </Button>
            </div>
          )}
        </Section>
      )}

      {step === 3 && (
        <Section
          icon={Target}
          title="What are you here for?"
          description="One pick — we use it to set sensible defaults for notifications, suggested squads, and event recommendations. No wrong answer."
        >
          <ul className="space-y-2">
            {GOALS.map((g) => {
              const picked = goal === g.value;
              return (
                <li key={g.value}>
                  <button
                    type="button"
                    onClick={() => setGoal(g.value)}
                    aria-pressed={picked}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                      picked
                        ? 'border-(--color-gekko-500)/60 bg-(--color-gekko-500)/10'
                        : 'border-(--glass-border) bg-(--color-bg-deep)/30 hover:border-(--color-gekko-500)/40',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1 size-3.5 shrink-0 rounded-full border-2',
                        picked
                          ? 'border-(--color-gekko-500) bg-(--color-gekko-500)'
                          : 'border-(--glass-border)',
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-(family-name:--font-heading) text-base font-bold tracking-tight">
                        {g.label}
                      </span>
                      <span className="mt-1 block text-xs text-(--color-text-secondary)">
                        {g.detail}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {step === 4 && (
        <div className="space-y-7 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-(--color-gekko-500)/50 bg-(--color-gekko-500)/10 text-(--color-gekko-300)">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="font-(family-name:--font-heading) text-3xl font-bold tracking-tight">
              You're in.
            </h2>
            <p className="text-sm text-(--color-text-secondary)">
              Welcome to the squad. Your dashboard is loaded with picks based on your selections —
              jump in whenever you're ready.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/dashboard">Open my dashboard</Link>
            </Button>
            <Button asChild variant="glass" className="w-full" size="lg">
              <Link href="/games">Browse games</Link>
            </Button>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            className={step === 0 ? 'invisible' : ''}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <Button
            type="button"
            onClick={next}
            disabled={(step === 1 && pickedGames.length === 0) || (step === 3 && !goal)}
          >
            {step === 3 ? 'Finish' : 'Next'} <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {step === 0 && (
        <p className="text-center text-sm text-(--color-text-secondary)">
          Want to skip the tour?{' '}
          <Link href="/dashboard" className="text-(--color-gekko-400) hover:underline">
            Go straight to the dashboard
          </Link>
        </p>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="grid size-12 place-items-center rounded-2xl border border-(--color-gekko-500)/40 bg-(--color-gekko-500)/10 text-(--color-gekko-300)">
          <Icon className="size-5" />
        </div>
        <h2 className="font-(family-name:--font-heading) text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="text-sm text-(--color-text-secondary)">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}
