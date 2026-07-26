/**
 * One-shot: hard-delete a user account.
 *
 * Cascades:
 *   - UserRole rows (onDelete: Cascade in the schema)
 *   - Session rows (onDelete: Cascade)
 *   - Account rows (onDelete: Cascade)
 *   - AuditLog actorId set to null (onDelete: SetNull)
 *
 * Also cleans up VerificationToken rows keyed by the user's email (those are
 * not connected by FK — the schema keys them by email/identifier).
 *
 * Run with:  EMAIL=foo@bar.com npx tsx scripts/delete-user.ts
 */
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { prisma } from '../src/server/db/prisma';

async function main() {
  const email = process.env.EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error('Set EMAIL=... to pick the account.');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true, email: true, createdAt: true, status: true },
  });
  if (!user) {
    console.log(`No user found with email "${email}".`);
    return;
  }
  console.log('Found:', user);

  const tokensDeleted = await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });
  console.log(`Burned ${tokensDeleted.count} verification token(s).`);

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`Deleted user ${user.username} (${user.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
