import { VerifyEmailForm } from '@/components/auth/verify-email-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Verify your email',
  description: 'Confirm the email on your Team Gekko account.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
