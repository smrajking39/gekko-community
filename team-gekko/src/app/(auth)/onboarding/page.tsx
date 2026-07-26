import { OnboardingFlow } from '@/components/auth/onboarding-flow';

export const metadata = {
  title: 'Welcome',
  description: 'Set up your Team Gekko profile in four quick steps.',
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
