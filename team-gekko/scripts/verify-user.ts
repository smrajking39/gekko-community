/**
 * One-shot: flip a user to email-verified + active.
 * Run with:  EMAIL=foo@bar.com npx tsx scripts/verify-user.ts
 */
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { prisma } from '../src/server/db/prisma';

async function main() {
  const email = process.env.EMAIL?.trim().toLowerCase();
  if (!email) {
    console.error('Set EMAIL=... in the env to pick the account.');
    process.exit(1);
  }

  const before = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
  if (!before) {
    console.log(`No user found with email "${email}".`);
    return;
  }
  console.log('Before:', before);

  const after = await prisma.user.update({
    where: { email },
    data: { emailVerifiedAt: new Date(), status: 'active' },
    select: {
      id: true,
      username: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
    },
  });
  console.log('After:', after);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
