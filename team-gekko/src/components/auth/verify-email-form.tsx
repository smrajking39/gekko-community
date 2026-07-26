'use client';

import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api';
import { AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'verifying' | 'success' | 'error';

const OTP_LENGTH = 6;
const RESEND_DELAY = 30;

export function VerifyEmailForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const initialEmail = params.get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Link-mode verification: if a `token` query param is present we POST it
  // immediately, then show success or fall back to OTP entry.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (!cancelled) setStatus('success');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(
          err instanceof ApiError ? err.message : 'Verification link is invalid or expired.',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Resend countdown tick.
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setTimeout(() => setResendCountdown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCountdown]);

  const setDigit = (i: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);

    // Auto-advance to the next field when a digit is typed.
    if (clean && i < OTP_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH)
      .fill('')
      .map((_, i) => text[i] ?? '');
    setDigits(next);
    inputRefs.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code from your inbox.');
      return;
    }
    if (!email) {
      setError('We need the email you registered with. Add it above.');
      return;
    }

    setStatus('verifying');
    try {
      await api.post('/auth/verify-email', { email, otp });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'That code did not work. Try again.');
    }
  };

  const resend = async () => {
    if (!email || resendCountdown > 0) return;
    setError(null);
    try {
      await api.post('/auth/resend-verification', { email });
      setResendCountdown(RESEND_DELAY);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not request a new code. Try again.');
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
            Email confirmed
          </h1>
          <p className="text-sm text-(--color-text-secondary)">
            You're verified. Time to set up your profile and pick the games you play.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild className="w-full" size="lg" onClick={() => router.refresh()}>
            <Link href="/onboarding">Start onboarding</Link>
          </Button>
          <Button asChild variant="glass" className="w-full" size="lg">
            <Link href="/dashboard">Skip for now</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-gekko-500)">
          One more step
        </p>
        <h1 className="font-(family-name:--font-heading) text-4xl font-bold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-(--color-text-secondary)">
          {token
            ? 'Following the link in your email…'
            : 'Click the link in your email — or type the 6-digit code below.'}
        </p>
      </div>

      {status === 'verifying' && token ? (
        <div className="flex items-center gap-3 rounded-2xl border border-(--glass-border) bg-(--color-bg-deep)/40 p-4 text-sm text-(--color-text-secondary)">
          <Loader2 className="size-4 animate-spin text-(--color-gekko-400)" />
          Verifying your link…
        </div>
      ) : (
        <form onSubmit={submitOtp} className="space-y-5" noValidate>
          <label className="block" htmlFor="ve-email">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
              Email
            </span>
            <input
              id="ve-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 px-3 py-3 text-sm text-(--color-text-primary) outline-none transition placeholder:text-(--color-text-muted) focus:border-(--color-gekko-500) focus:bg-(--color-bg-deep)/70"
              placeholder="you@teamgekko.com"
              required
            />
          </label>

          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-(--color-text-muted)">
              6-digit code
            </p>
            <div className="grid grid-cols-6 gap-2">
              {digits.map((d, i) => (
                <input
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length OTP slots
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={handleKeyDown(i)}
                  onPaste={handlePaste}
                  className="aspect-square w-full rounded-xl border border-(--glass-border) bg-(--color-bg-deep)/40 text-center font-(family-name:--font-heading) text-2xl font-bold tabular-nums text-(--color-text-primary) outline-none transition focus:border-(--color-gekko-500) focus:bg-(--color-bg-deep)/70"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {status === 'error' && error && (
            <p className="flex items-center gap-2 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/5 px-3 py-2 text-sm text-(--color-danger)">
              <AlertCircle className="size-4" />
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={status === 'verifying' || digits.join('').length < OTP_LENGTH}
          >
            {status === 'verifying' ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Verifying…
              </>
            ) : (
              'Verify email'
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="/login"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-text-muted) hover:text-(--color-text-secondary)"
            >
              Back to sign in
            </Link>
            <button
              type="button"
              onClick={resend}
              disabled={!email || resendCountdown > 0}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-gekko-400) transition hover:text-(--color-gekko-300) disabled:cursor-not-allowed disabled:text-(--color-text-muted)"
            >
              <Mail className="size-3" />
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}

      {status === 'error' && token && (
        <p className="flex items-center gap-2 rounded-xl border border-(--color-danger)/40 bg-(--color-danger)/5 px-3 py-2 text-sm text-(--color-danger)">
          <AlertCircle className="size-4" />
          {error}
        </p>
      )}
    </div>
  );
}
