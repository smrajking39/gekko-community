import { LoginForm } from '@/components/auth/login-form';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to your Team Gekko account to queue up, host events, and track your XP.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
