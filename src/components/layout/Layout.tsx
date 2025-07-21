import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Euro } from 'lucide-react';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🔍 [Layout] Rendering with user:', user);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary rounded-full p-2">
                <Euro className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Meu Dinheiro</h1>
                <p className="text-sm text-muted-foreground">Olá, {user?.user_metadata?.nome || user?.email}</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/')}
                className={isActive('/') ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Dashboard
              </Button>
              <Button
                variant={isActive('/goals') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/goals')}
                className={isActive('/goals') ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Metas
              </Button>
              <Button
                variant={isActive('/family') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/family')}
                className={isActive('/family') ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Família
              </Button>
              <Button
                variant={isActive('/settings') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/settings')}
                className={isActive('/settings') ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                Configurações
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            <PWAInstallButton />
            <NotificationSystem refreshTrigger={0} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}} // Removed setShowTutorial(true)
              className="text-sm"
            >
              Tutorial
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}; 