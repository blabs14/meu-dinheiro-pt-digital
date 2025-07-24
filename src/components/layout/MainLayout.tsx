import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DrawerSidebar } from './DrawerSidebar';
import { BottomTabBar } from './BottomTabBar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Euro, Menu } from 'lucide-react';
import { NotificationSystem } from '@/components/notifications/NotificationSystem';
import { PWAInstallButton } from '@/components/pwa/PWAInstallButton';

export const MainLayout = () => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="bg-primary rounded-full p-1.5">
              <Euro className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Meu Dinheiro</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <PWAInstallButton />
          <NotificationSystem refreshTrigger={0} />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-full p-2">
              <Euro className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Meu Dinheiro</h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.user_metadata?.nome || user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <PWAInstallButton />
            <NotificationSystem refreshTrigger={0} />
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r bg-card">
          <DrawerSidebar 
            isOpen={true} 
            onClose={() => {}} 
            isDesktop={true}
          />
        </aside>

        {/* Mobile Drawer Sidebar */}
        <DrawerSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isDesktop={false}
        />

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="pb-20 lg:pb-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};