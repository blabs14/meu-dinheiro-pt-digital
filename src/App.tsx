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
import React from 'react'; // Added missing import for React

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔍 [ErrorBoundary] Error caught:', error);
    console.error('🔍 [ErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Erro na Aplicação</h1>
            <p className="text-gray-700 mb-4">Ocorreu um erro ao carregar a aplicação.</p>
            <details className="text-sm text-gray-600">
              <summary className="cursor-pointer">Ver detalhes do erro</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
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
