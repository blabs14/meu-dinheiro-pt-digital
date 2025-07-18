import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';
import { Layout } from '@/components/layout/Layout';
import Index from '@/pages/Index';
import Goals from '@/pages/Goals';
import Family from '@/pages/Family';
import NotFound from '@/pages/NotFound';
import { SettingsManager } from '@/components/settings/SettingsManager';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const { needsOnboarding, completeOnboarding } = useOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (needsOnboarding) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/family" element={<Family />} />
          <Route path="/settings" element={<SettingsManager />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        
        <PWAInstallButton />
        <NotificationSystem />
      </Layout>
    </Router>
  );
}

export default App;
