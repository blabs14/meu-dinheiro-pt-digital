import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      // Método 1: Verificar se está em modo standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Método 2: Verificar propriedades específicas do navegador
      const isWebkit = 'webkit' in window;
      const isIOSStandalone = isWebkit && 'navigator' in window && 
        (navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();

    // Registar Service Worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);
          // Service Worker registered successfully

          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  // Nova versão da app disponível
                }
              });
            }
          });

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();

    // Listener para evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listener para quando a app é instalada
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
              // App foi instalada com sucesso
    };

    // Listeners para estado online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Adicionar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao instalar app:', error);
      return false;
    }
  };

  const updateServiceWorker = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'Toque no menu (⋮) no canto superior direito',
          'Selecione "Instalar app" ou "Adicionar ao ecrã inicial"',
          'Confirme a instalação'
        ]
      };
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        browser: 'Safari',
        steps: [
          'Toque no botão de partilha (□↑) na parte inferior',
          'Deslize e selecione "Adicionar ao Ecrã Inicial"',
          'Toque em "Adicionar" para confirmar'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Toque no menu (⋮) no canto superior direito',
          'Selecione "Instalar"',
          'Confirme a instalação'
        ]
      };
    } else {
      return {
        browser: 'Navegador',
        steps: [
          'Procure a opção "Instalar app" no menu do navegador',
          'Ou adicione aos favoritos para acesso rápido'
        ]
      };
    }
  };

  const shareApp = async () => {
    const shareData = {
      title: 'Meu Dinheiro PT Digital',
      text: 'Gestão financeira inteligente para famílias portuguesas',
      url: window.location.origin
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback: copiar URL para clipboard
        await navigator.clipboard.writeText(window.location.origin);
        return true;
      }
    } catch (error) {
      console.error('Erro ao partilhar:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    updateServiceWorker,
    getInstallInstructions,
    shareApp,
    swRegistration
  };
}; 