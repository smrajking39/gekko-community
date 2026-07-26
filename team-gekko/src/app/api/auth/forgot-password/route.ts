import { forgotPasswordSchema } from '@/lib/validators';
import { signToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/prisma';
import { handle } from '@/server/lib/response';
import { sendMail } from '@/server/mail/client';
import { resetPasswordTemplate } from '@/server/mail/templates';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Always return the same shape — never disclose whether an account exists.
    // The work happens silently if the user is real.
    if (user) {
      const token = await signToken({ uid: user.id, purpose: 'password_reset' });
      const link = `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'}/reset-password/${encodeURIComponent(token)}`;
      await sendMail(resetPasswordTemplate({ to: normalized, link }));
    }

    return { ok: true };
  });
}
