import { resetPasswordSchema } from '@/lib/validators';
import { hashPassword } from '@/server/auth/password';
import { verifyToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/prisma';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);

    const payload = await verifyToken(input.token, 'password_reset').catch(() => null);
    if (!payload) throw new AppError('PRECONDITION_FAILED', 'Reset link expired or invalid.');

    const passwordHash = await hashPassword(input.password);
    await prisma.user.update({
      where: { id: payload.uid },
      data: { passwordHash },
    });

    return { ok: true };
  });
}
