/**
 * Thin Resend client — uses the HTTP API directly so we don't pull in the
 * full SDK (saves ~12kb on cold-start).
 *
 * Resilient design: a failure to deliver never throws. Auth flows call
 * `sendMail()` after the database write has already committed; if Resend
 * rejects (e.g. sandbox sender refusing a non-verified recipient, or rate
 * limit), we don't want to roll back the registration. Instead we log the
 * failure prominently so the operator can recover the OTP from Vercel logs
 * and either retry or manually verify the user.
 *
 * Modes:
 *   - `RESEND_API_KEY` set + send succeeds → real email delivered.
 *   - `RESEND_API_KEY` set + send fails    → console error + fallback log.
 *   - `RESEND_API_KEY` blank               → console fallback (dev mode).
 */
type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendMailResult = { delivered: true } | { delivered: false; reason: string };

function logFallback(reason: string, { to, subject, text }: SendMailInput) {
  console.log('[mail:fallback]', {
    reason,
    to,
    subject,
    preview: text?.slice(0, 200) ?? '(html only — check the link/OTP in the server log above)',
  });
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Team Gekko <onboarding@resend.dev>';

  if (!apiKey) {
    logFallback('RESEND_API_KEY not set', input);
    return { delivered: false, reason: 'RESEND_API_KEY not set' };
  }

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
  } catch (err) {
    console.error('[mail] network error contacting Resend:', err);
    logFallback('Resend network error', input);
    return { delivered: false, reason: 'network error' };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[mail] Resend send failed (${res.status}): ${body}`);
    logFallback(`Resend ${res.status}`, input);
    return { delivered: false, reason: `Resend ${res.status}: ${body}` };
  }

  return { delivered: true };
}
