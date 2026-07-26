import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Forgot password',
  description: 'Send a one-time reset link to your Team Gekko account email.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
