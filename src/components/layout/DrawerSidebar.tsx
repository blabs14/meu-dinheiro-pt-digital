import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Home, 
  Target, 
  Users, 
  Settings, 
  LogOut,
  Euro,
  TrendingUp,
  PieChart,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

export const DrawerSidebar = ({ isOpen, onClose, isDesktop }: DrawerSidebarProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (!isDesktop) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/',
      description: 'Visão geral das finanças'
    },
    {
      icon: Target,
      label: 'Metas',
      path: '/goals',
      description: 'Objetivos de poupança'
    },
    {
      icon: Users,
      label: 'Família',
      path: '/family',
      description: 'Gestão familiar'
    },
    {
      icon: Settings,
      label: 'Configurações',
      path: '/settings',
      description: 'Perfil e preferências'
    }
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="bg-primary rounded-full p-2">
            <Euro className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Meu Dinheiro</h2>
            <p className="text-sm text-muted-foreground">
              {user?.user_metadata?.nome || user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant={active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                active && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleNavigation(item.path)}
            >
              <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">{item.label}</div>
                <div className={cn(
                  "text-xs",
                  active ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {item.description}
                </div>
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t">
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Resumo Rápido
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-income">€0</div>
              <div className="text-muted-foreground">Receitas</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-expense">€0</div>
              <div className="text-muted-foreground">Despesas</div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Footer Actions */}
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Terminar Sessão
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="h-screen sticky top-0">
        <SidebarContent />
      </div>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
};