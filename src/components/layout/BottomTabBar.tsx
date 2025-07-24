import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Target, 
  Users, 
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { TransactionForm } from '@/features/transactions/components/TransactionForm';

export const BottomTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const tabs = [
    {
      icon: Home,
      label: 'Início',
      path: '/',
      badge: null
    },
    {
      icon: Target,
      label: 'Metas',
      path: '/goals',
      badge: null
    },
    {
      icon: Plus,
      label: 'Adicionar',
      path: null, // Special case for add button
      badge: null,
      isAction: true
    },
    {
      icon: Users,
      label: 'Família',
      path: '/family',
      badge: null
    },
    {
      icon: Settings,
      label: 'Config',
      path: '/settings',
      badge: null
    }
  ];

  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.isAction) {
      setShowTransactionForm(true);
    } else if (tab.path) {
      navigate(tab.path);
    }
  };

  const handleTransactionSuccess = () => {
    setShowTransactionForm(false);
    // Refresh current page data if needed
    window.location.reload();
  };

  return (
    <>
      {/* Bottom Tab Bar - Only visible on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-30">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const active = tab.path ? isActive(tab.path) : false;
            const isAddButton = tab.isAction;
            
            return (
              <Button
                key={index}
                variant="ghost"
                className={cn(
                  "h-full rounded-none flex flex-col items-center justify-center space-y-1 relative",
                  active && "text-primary bg-primary/10",
                  isAddButton && "text-primary"
                )}
                onClick={() => handleTabClick(tab)}
              >
                {isAddButton ? (
                  <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                ) : (
                  <Icon className={cn(
                    "h-5 w-5",
                    active ? "text-primary" : "text-muted-foreground"
                  )} />
                )}
                
                <span className={cn(
                  "text-xs font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                  isAddButton && "text-primary"
                )}>
                  {tab.label}
                </span>
                
                {tab.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
        defaultType="despesa"
        onSuccess={handleTransactionSuccess}
      />
    </>
  );
};