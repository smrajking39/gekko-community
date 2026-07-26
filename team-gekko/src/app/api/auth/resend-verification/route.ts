import { forgotPasswordSchema } from '@/lib/validators';
import { auth } from '@/server/auth/config';
import { signToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/prisma';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';
import { sendMail } from '@/server/mail/client';
import { verifyEmailTemplate } from '@/server/mail/templates';

export const runtime = 'nodejs';

/** Minimum interval between resends to keep this from being a spam vector. */
const RESEND_COOLDOWN_SECONDS = 30;

export async function POST(req: Request) {
  return handle(async () => {
    // Resolve the email either from the body (unauthed flow — user typed it on
    // /verify-email) or from the session (authed flow — banner button click).
    const session = await auth();
    const body = await req.json().catch(() => ({}));
    let email: string | null = session?.user?.email ?? null;
    if (!email) {
      const parsed = forgotPasswordSchema.parse(body);
      email = parsed.email.trim().toLowerCase();
    } else {
      email = email.toLowerCase();
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Generic success envelope either way — never disclose whether the email
    // matches a real account.
    if (!user || user.emailVerifiedAt) {
      return { ok: true };
    }

    // Cooldown check — recent unburned token within the window blocks the resend.
    const recent = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        type: 'email',
        createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      throw new AppError(
        'RATE_LIMITED',
        `Hang on ${RESEND_COOLDOWN_SECONDS}s before requesting another code.`,
      );
    }

    // Issue a fresh OTP + signed link. Burn any stale unused token first so
    // the latest one is always the live one.
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, type: 'email' },
    });

    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        type: 'email',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const linkToken = await signToken({ uid: user.id, purpose: 'verify_email' });
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
    const link = `${appUrl}/verify-email?token=${encodeURIComponent(linkToken)}`;
    await sendMail(verifyEmailTemplate({ to: email, link, otp }));

    return { ok: true };
  });
}
