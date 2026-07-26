import { otpSchema } from '@/lib/validators';
import { verifyToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/prisma';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';
import { z } from 'zod';

export const runtime = 'nodejs';

const inputSchema = z.union([
  z.object({ token: z.string().min(1) }),
  otpSchema.extend({ email: z.string().email() }),
]);

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const input = inputSchema.parse(body);

    let userId: string;

    if ('token' in input) {
      // Link-based verification — JWT contains the user id.
      const payload = await verifyToken(input.token, 'verify_email').catch(() => null);
      if (!payload) throw new AppError('PRECONDITION_FAILED', 'Token expired or invalid.');
      userId = payload.uid;
    } else {
      // OTP-based verification — look up the verification token row.
      const row = await prisma.verificationToken.findFirst({
        where: {
          identifier: input.email.toLowerCase(),
          token: input.otp,
          type: 'email',
          expires: { gt: new Date() },
        },
      });
      if (!row) throw new AppError('PRECONDITION_FAILED', 'Code is invalid or expired.');
      const user = await prisma.user.findUnique({ where: { email: row.identifier } });
      if (!user) throw new AppError('NOT_FOUND', 'No account for that email.');
      userId = user.id;

      // Burn the OTP.
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: row.identifier, token: row.token } },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: 'active',
      },
    });

    return { ok: true };
  });
}
