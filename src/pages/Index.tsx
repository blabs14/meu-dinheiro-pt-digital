import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AuthForm } from '@/components/auth/AuthForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();

  const loading = authLoading || onboardingLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  // Não autenticado - mostrar formulário de login
  if (!user) {
    return <AuthForm />;
  }

  // Autenticado mas precisa de onboarding
  if (needsOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  // Autenticado e onboarding completo - mostrar dashboard
  return <Dashboard />;
};

export default Index;
