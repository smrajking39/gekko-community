/**
 * Smoke test for the Phase 2 auth core.
 *
 * Verifies, end-to-end against the live Neon database:
 *   1. Prisma can connect.
 *   2. The `member` role exists (seeded).
 *   3. A user can be created with a bcryptjs-hashed password.
 *   4. The user gets the `member` role assigned via UserRole.
 *   5. Password verification round-trips.
 *   6. A jose verify-email JWT can be signed and decoded with the right purpose.
 *
 * Cleans up the test user at the end so it can be re-run idempotently.
 * Run with:  npx tsx scripts/smoke-auth.ts
 */
// Load both env files — `.env` for DATABASE_URL, `.env.local` for the auth secrets.
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { hashPassword, verifyPassword } from '../src/server/auth/password';
import { signToken, verifyToken } from '../src/server/auth/tokens';
import { prisma } from '../src/server/db/prisma';

const TEST_EMAIL = `smoke+${Date.now()}@teamgekko.dev`;
const TEST_USERNAME = `smoke_${Date.now().toString(36).slice(-6)}`;
const TEST_PASSWORD = 'Sm0ke!Test#Pass';

async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  process.stdout.write(`  ${label}…`);
  const t = Date.now();
  try {
    const result = await fn();
    console.log(` ✓ (${Date.now() - t}ms)`);
    return result;
  } catch (err) {
    console.log(' ✗');
    throw err;
  }
}

async function main() {
  console.log('Phase 2 auth smoke test');
  console.log('---------------------------------');

  await step('Prisma connect', async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  const memberRole = await step('Member role present', async () => {
    const role = await prisma.role.findUnique({ where: { name: 'member' } });
    if (!role) throw new Error('member role missing — run `npm run db:seed`');
    return role;
  });

  const hash = await step('Hash password', () => hashPassword(TEST_PASSWORD));

  const user = await step('Create user', () =>
    prisma.user.create({
      data: {
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        passwordHash: hash,
        displayName: TEST_USERNAME,
        status: 'pending',
      },
    }),
  );

  await step('Assign member role', () =>
    prisma.userRole.create({ data: { userId: user.id, roleId: memberRole.id } }),
  );

  await step('Verify password (round-trip)', async () => {
    const ok = await verifyPassword(TEST_PASSWORD, hash);
    if (!ok) throw new Error('Password verification failed');
  });

  await step('Sign + verify JWT (verify_email)', async () => {
    const token = await signToken({ uid: user.id, purpose: 'verify_email' });
    const decoded = await verifyToken(token, 'verify_email');
    if (decoded.uid !== user.id) throw new Error('JWT uid mismatch');
  });

  await step('Reject wrong-purpose JWT', async () => {
    const token = await signToken({ uid: user.id, purpose: 'verify_email' });
    let failed = false;
    try {
      await verifyToken(token, 'password_reset');
    } catch {
      failed = true;
    }
    if (!failed) throw new Error('Wrong-purpose token should have been rejected');
  });

  await step('Cleanup test user', async () => {
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });

  await prisma.$disconnect();
  console.log('---------------------------------');
  console.log('All checks passed.');
}

main().catch(async (err) => {
  console.error('\nSmoke test failed:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
