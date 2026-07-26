import { auth } from '@/server/auth/config';
import { prisma } from '@/server/db/prisma';
import { AppError } from '@/server/lib/errors';
import { handle } from '@/server/lib/response';

export const runtime = 'nodejs';

export async function GET() {
  return handle(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError('UNAUTHENTICATED', 'Sign in required.');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        bio: true,
        pronouns: true,
        location: true,
        xp: true,
        level: true,
        status: true,
        privacy: true,
        emailVerifiedAt: true,
        createdAt: true,
        roles: { include: { role: { include: { permissions: true } } } },
      },
    });
    if (!user) throw new AppError('NOT_FOUND', 'Profile not found.');

    const permissions = Array.from(
      new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.key))),
    );

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      pronouns: user.pronouns,
      location: user.location,
      xp: user.xp,
      level: user.level,
      status: user.status,
      privacy: user.privacy,
      emailVerified: Boolean(user.emailVerifiedAt),
      createdAt: user.createdAt.toISOString(),
      role: user.roles[0]?.role.name ?? 'member',
      permissions,
    };
  });
}
