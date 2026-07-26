'use client';

import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api';
import { forgotPasswordSchema } from '@/lib/validators';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setStatus('error');
      setError(parsed.error.issues[0]?.message ?? 'Invalid email.');
      return;
    }

    setStatus('submitting');
    try {
      await api.post('/auth/forgot-password', parsed.data);
      setStatus('success');
    } catch (err) {
      // Backend already returns generic success — only reach here on transport failure.
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="space-y-7">
        <div className="grid size-14 place-items-center rounded-2xl border border-(--color-gekko-500)/50 bg-(--color-gekko-500)/10 text-(--color-gekko-300)">
          <CheckCircle2 className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="font-(family-name:--font-heading) text-3xl font-bold tracking-tight">
            Check your inbox
          </h1>
          <p className="text-sm text-(--color-text-secondary)">
            If <strong className="text-(--color-text-primary)">{email}</strong> matches an account,
            a reset link is on its way. The link expires in 60 minutes.
          </p>
          <p className="text-sm text-(--color-text-secondary)">
            Didn't get it? Check spam, then try again — but the same link is valid for an hour, so
            give it a minute first.
          </p>
        </div>
        <Button asChild variant="glass" className="w-full" size="lg">
          <Link href="/login">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-500)">
          Recover access
        </p>
        <h1 className="font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Forgot password?
        </h1>
        <p className="text-sm text-(--color-text-secondary)">
          Enter the email on your account and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block" htmlFor="fp-email">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
            Email
          </span>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 px-3 py-3 text-sm text-(--color-text-primary) outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-gekko-500) focus:bg-(--color-bg-deep)/70"
            placeholder="you@teamgekko.com"
            required
          />
        </label>

        {status === 'error' && error && (
          <p className="flex items-center gap-2 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/5 px-3 py-2 text-sm text-(--color-danger)">
            <AlertCircle className="size-4" />
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={status === 'submitting'}>
          {status === 'submitting' ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sending link…
            </>
          ) : (
            <>
              Send reset link <Send className="size-4" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-(--color-text-secondary)">
        Remembered it?{' '}
        <Link href="/login" className="text-(--color-gekko-400) hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
