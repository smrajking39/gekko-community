/**
 * One-shot: send a real email through Resend to confirm the integration works.
 * Pulls the same `sendMail` + `verifyEmailTemplate` the auth flow uses.
 *
 * Run with:  EMAIL=you@example.com npx tsx scripts/smoke-email.ts
 *
 * NOTE: with the sandbox sender `onboarding@resend.dev`, Resend will only
 * deliver to the email address you used to sign up at Resend. Use that
 * address for EMAIL=... or expect a 422 "Validation error" from Resend.
 */
import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { sendMail } from '../src/server/mail/client';
import { verifyEmailTemplate } from '../src/server/mail/templates';

async function main() {
  const to = process.env.EMAIL?.trim().toLowerCase();
  if (!to) {
    console.error('Set EMAIL=... to pick the recipient.');
    process.exit(1);
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Email will fall back to console.log.');
  }

  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/verify-email?token=smoke-test`;
  const otp = '123456';

  console.log(`Sending verify-email template to ${to}…`);
  console.log(`From: ${process.env.EMAIL_FROM}`);
  const result = await sendMail(verifyEmailTemplate({ to, link, otp }));
  if (result.delivered) {
    console.log('Delivered. Check your inbox.');
  } else {
    console.log(`NOT delivered — fell back to console log. Reason: ${result.reason}`);
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Send failed:', err);
  process.exit(1);
});
