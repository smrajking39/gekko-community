/**
 * Plain-HTML email templates. Kept inline (no @react-email/components) to
 * minimize bundle weight on Edge. When the marketing team wants richer
 * designs, swap to React Email and ship via the Resend `react` field.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://teamgekko.app';

function shell({
  heading,
  body,
  cta,
}: { heading: string; body: string; cta?: { href: string; label: string } }) {
  const button = cta
    ? `<a href="${cta.href}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:#00ff88;color:#03050a;font-family:sans-serif;font-weight:700;text-decoration:none;margin-top:24px">${cta.label}</a>`
    : '';

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#03050a;font-family:'Inter','Segoe UI',sans-serif;color:#f4f7fb">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <img src="${APP_URL}/brand/gekko-logo-128.png" alt="" width="42" height="28" style="display:inline-block;vertical-align:middle" />
      <span style="font-weight:700;letter-spacing:-0.01em">Team Gekko</span>
    </div>
    <h1 style="font-size:28px;line-height:1.15;margin:0 0 12px;font-weight:700">${heading}</h1>
    <div style="font-size:15px;line-height:1.55;color:#9aa7b8">${body}</div>
    ${button}
    <hr style="border:none;border-top:1px solid rgba(120,255,180,0.12);margin:40px 0 16px" />
    <p style="font-size:12px;color:#5e6b7d;line-height:1.5;margin:0">
      Team Gekko · <a href="${APP_URL}" style="color:#4dffb0;text-decoration:none">${APP_URL}</a><br/>
      You're receiving this because someone (hopefully you) requested it. If not, you can ignore it safely.
    </p>
  </div>
</body>
</html>`;
}

export function verifyEmailTemplate({ to, link, otp }: { to: string; link: string; otp: string }) {
  return {
    to,
    subject: 'Confirm your Team Gekko email',
    html: shell({
      heading: 'One click to confirm your email',
      body: `Hit the button below to confirm <strong>${to}</strong> and finish your Team Gekko setup. The link expires in 24 hours.<br/><br/>If the button doesn't work, paste this 6-digit code into the verification page: <code style="font-family:monospace;letter-spacing:0.4em;color:#4dffb0">${otp}</code>.`,
      cta: { href: link, label: 'Confirm email' },
    }),
    text: `Confirm your Team Gekko email\n\nOpen this link to verify ${to}: ${link}\n\nOr enter the 6-digit code on the verification page: ${otp}\n\nThis expires in 24 hours.`,
  };
}

export function resetPasswordTemplate({ to, link }: { to: string; link: string }) {
  return {
    to,
    subject: 'Reset your Team Gekko password',
    html: shell({
      heading: 'Reset your password',
      body: `We received a request to reset the password for <strong>${to}</strong>. If that wasn't you, you can safely ignore this email — your password stays the same.<br/><br/>This link expires in 60 minutes.`,
      cta: { href: link, label: 'Choose a new password' },
    }),
    text: `Reset your Team Gekko password\n\nOpen this link to choose a new password: ${link}\n\nThis expires in 60 minutes. If you didn't request a reset, ignore this email.`,
  };
}
