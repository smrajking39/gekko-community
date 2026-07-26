'use client';

import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { registerSchema } from '@/lib/validators';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type FieldErrors = Partial<
  Record<'username' | 'email' | 'password' | 'confirmPassword' | 'acceptTerms' | 'form', string>
>;

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

export function RegisterForm() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse({
      username,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        username: flat.username?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0],
        acceptTerms: flat.acceptTerms?.[0],
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/register', parsed.data);

      // Auto-sign-in with the credentials we just created so the user lands
      // on /verify-email already authed. signIn() sets the cookie before
      // returning; the subsequent push triggers a fresh server-render that
      // sees the session.
      const signInRes = await signIn('credentials', {
        identifier: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (signInRes && !signInRes.error) {
        toast.success('Welcome to the squad. Check your inbox to verify your email.');
        router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
        router.refresh();
      } else {
        // Account was created but auto-sign-in failed for some reason —
        // send the user to /login with a helpful message.
        toast.success('Account created — sign in to continue.');
        router.push('/login');
      }
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: 'Something went wrong. Try again in a moment.' });
      }
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-500)">
          Join the squad
        </p>
        <h1 className="font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-(--color-text-secondary)">A few details and you're queued up.</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Username" error={errors.username} htmlFor="reg-username">
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            placeholder="gekko_pilot"
            required
          />
        </Field>

        <Field label="Email" error={errors.email} htmlFor="reg-email">
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@teamgekko.com"
            required
          />
        </Field>

        <Field label="Password" error={errors.password} htmlFor="reg-password">
          <div className="relative">
            <input
              id="reg-password"
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
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword} htmlFor="reg-confirm">
          <input
            id="reg-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            placeholder="Type the password again"
            required
          />
          {confirmPassword.length > 0 && confirmPassword === password && (
            <span className="mt-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-gekko-400)">
              <CheckCircle2 className="size-3" /> Matches
            </span>
          )}
        </Field>

        <label className="flex items-start gap-3 text-sm text-(--color-text-secondary)">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 size-4 rounded border-(--glass-border) bg-(--color-bg-deep) accent-(--color-gekko-500)"
          />
          <span>
            I've read and agree to the{' '}
            <Link href="/terms" className="text-(--color-gekko-400) hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-(--color-gekko-400) hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-danger)">
            {errors.acceptTerms}
          </p>
        )}

        {errors.form && (
          <p className="flex items-center gap-2 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/5 px-3 py-2 text-sm text-(--color-danger)">
            <AlertCircle className="size-4" />
            {errors.form}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-(--color-text-secondary)">
        Already have one?{' '}
        <Link href="/login" className="text-(--color-gekko-400) hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

const inputClass =
  'block w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 px-3 py-3 text-sm text-(--color-text-primary) outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-gekko-500) focus:bg-(--color-bg-deep)/70';

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {error && (
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-danger)">
          {error}
        </span>
      )}
    </div>
  );
}
