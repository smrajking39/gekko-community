'use client';

import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { resetPasswordSchema } from '@/lib/validators';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type FieldErrors = Partial<Record<'password' | 'confirmPassword' | 'form', string>>;

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'] as const;
  const colors = [
    'var(--color-danger)',
    'var(--color-warning)',
    'var(--color-warning)',
    'var(--color-gekko-400)',
    'var(--color-gekko-500)',
  ];
  const idx = Math.min(4, Math.max(0, s - 1));
  return {
    score: idx as 0 | 1 | 2 | 3 | 4,
    label: labels[idx] ?? 'Too weak',
    color: colors[idx] ?? 'var(--color-danger)',
  };
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', parsed.data);
      setDone(true);
      setTimeout(() => router.push('/login'), 2200);
    } catch (err) {
      setSubmitting(false);
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Request a fresh link from /forgot-password.',
      });
    }
  };

  if (done) {
    return (
      <div className="space-y-7">
        <div className="grid size-14 place-items-center rounded-2xl border border-(--color-gekko-500)/50 bg-(--color-gekko-500)/10 text-(--color-gekko-300)">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-(family-name:--font-heading) text-3xl font-bold tracking-tight">
            Password updated
          </h1>
          <p className="text-sm text-(--color-text-secondary)">
            You're all set. Redirecting you to sign in — or hit the button below.
          </p>
        </div>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Sign in now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-500)">
          Reset password
        </p>
        <h1 className="font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-(--color-text-secondary)">
          Pick something memorable but hard to guess. We never email it back to you.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)"
            htmlFor="rp-password"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="rp-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, 'pr-11')}
              placeholder="8+ chars, mixed case, number, symbol"
              required
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-(--color-text-muted) transition hover:bg-(--glass-tint) hover:text-(--color-text-primary)"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="flex h-1.5 flex-1 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full transition"
                    style={{
                      background: i <= strength.score ? strength.color : 'var(--color-bg-elev-1)',
                    }}
                  />
                ))}
              </div>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}
          {errors.password && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-danger)">
              {errors.password}
            </span>
          )}
        </div>

        <div>
          <label
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)"
            htmlFor="rp-confirm"
          >
            Confirm
          </label>
          <input
            id="rp-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            placeholder="Type it again"
            required
          />
          {errors.confirmPassword && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-danger)">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        {errors.form && (
          <p className="flex items-center gap-2 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/5 px-3 py-2 text-sm text-(--color-danger)">
            <AlertCircle className="size-4" />
            {errors.form}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              Save new password <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

const inputClass =
  'block w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 px-3 py-3 text-sm text-(--color-text-primary) outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-gekko-500) focus:bg-(--color-bg-deep)/70';
