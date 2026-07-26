'use client';

import { Button } from '@/components/ui/button';
import { ApiError, api } from '@/lib/api';
import { AlertTriangle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Banner shown to authed users who haven't verified their email yet.
 * Hits POST /api/auth/resend-verification (authed → resolves email from
 * session, no body required).
 */
export function EmailVerifiedBanner({ email }: { email?: string | null }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    setError(null);
    setStatus('sending');
    try {
      await api.post('/auth/resend-verification', {});
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'Could not send. Try again in a moment.');
    }
  };

  return (
    <output
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border border-(--color-warning)/40 bg-(--color-warning)/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-(--color-warning)/50 bg-(--color-warning)/10 text-(--color-warning)">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-(family-name:--font-heading) text-sm font-bold tracking-tight">
            Verify your email
          </p>
          <p className="mt-0.5 text-xs text-(--color-text-secondary)">
            {email ? (
              <>
                We sent a confirmation to{' '}
                <strong className="text-(--color-text-primary)">{email}</strong>. Click the link in
                your inbox or enter the 6-digit code on the verify page.
              </>
            ) : (
              <>Open the link in your inbox or enter the 6-digit code on the verify page.</>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === 'sent' ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-(--color-gekko-500)/40 bg-(--color-gekko-500)/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-(--color-gekko-300)">
            <CheckCircle2 className="size-3" />
            Sent
          </span>
        ) : (
          <Button variant="glass" size="sm" onClick={resend} disabled={status === 'sending'}>
            {status === 'sending' ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="size-3.5" />
                Resend code
              </>
            )}
          </Button>
        )}
        <Button asChild size="sm">
          <Link href="/verify-email">Open verify page</Link>
        </Button>
      </div>

      {status === 'error' && error && (
        <p className="basis-full text-xs text-(--color-danger)">{error}</p>
      )}
    </output>
  );
}
