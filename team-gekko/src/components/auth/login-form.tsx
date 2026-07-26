'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { loginSchema } from '@/lib/validators';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type FieldErrors = Partial<Record<'identifier' | 'password' | 'form', string>>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ identifier, password, remember });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        identifier: flat.identifier?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setSubmitting(true);
    const res = await signIn('credentials', {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirect: false,
    });

    if (!res || res.error) {
      setSubmitting(false);
      setErrors({ form: "We couldn't sign you in. Check your details and try again." });
      return;
    }

    toast.success('Welcome back.');
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-500)">
          Admins only
        </p>
        <h1 className="font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Sign in
        </h1>
        <p className="text-sm text-(--color-text-secondary)">
          The console is restricted to Team Gekko staff while the platform is being built.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email or username" error={errors.identifier} htmlFor="login-identifier">
          <input
            id="login-identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={inputClass}
            placeholder="you@teamgekko.com"
            required
          />
        </Field>

        <Field label="Password" error={errors.password} htmlFor="login-password">
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, 'pr-11')}
              placeholder="••••••••"
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
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-(--color-text-secondary)">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-(--glass-border) bg-(--color-bg-deep) accent-(--color-gekko-500)"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-gekko-400) hover:text-(--color-gekko-300)"
          >
            Forgot password?
          </Link>
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
              <Loader2 className="size-4 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>
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
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-danger)">
          {error}
        </span>
      )}
    </label>
  );
}
