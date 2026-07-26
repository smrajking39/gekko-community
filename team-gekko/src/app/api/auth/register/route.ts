import { registerSchema } from '@/lib/validators';
import { hashPassword } from '@/server/auth/password';
import { signToken } from '@/server/auth/tokens';
import { prisma } from '@/server/db/prisma';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';
import { sendMail } from '@/server/mail/client';
import { verifyEmailTemplate } from '@/server/mail/templates';

export const runtime = 'nodejs';

// Public registration is currently closed — the site is in admins-only mode.
// New accounts are provisioned by an admin from the console.
const REGISTRATION_OPEN = false;

export async function POST(req: Request) {
  return handle(async () => {
    if (!REGISTRATION_OPEN) {
      throw new AppError(
        'PRECONDITION_FAILED',
        'Registration is currently closed. Contact an admin for access.',
      );
    }

    const body = await req.json();
    const input = registerSchema.parse(body);

    const email = input.email.trim().toLowerCase();
    const username = input.username.trim().toLowerCase();

    // Conflict checks — generic message to avoid disclosing which field clashed.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      throw new AppError('CONFLICT', 'That email or username is already in use.');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: input.username,
        status: 'pending',
      },
    });

    // Default role assignment — the seed adds a 'member' role that every
    // self-registered user inherits.
    const memberRole = await prisma.role.findUnique({ where: { name: 'member' } });
    if (memberRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: memberRole.id },
      });
    }

    // Send the email-verification link.
    const token = await signToken({ uid: user.id, purpose: 'verify_email' });
    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(token)}`;
    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        type: 'email',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await sendMail(verifyEmailTemplate({ to: email, link, otp }));

    return { id: user.id, email: user.email, username: user.username };
  });
}
