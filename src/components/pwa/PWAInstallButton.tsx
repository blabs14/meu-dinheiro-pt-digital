import { useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Smartphone, 
  Share, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Monitor,
  HelpCircle
} from 'lucide-react';

export const PWAInstallButton = () => {
  const { 
    isInstallable, 
    isInstalled, 
    isOnline, 
    installApp, 
    getInstallInstructions, 
    shareApp 
  } = usePWA();
  const { toast } = useToast();
  const [showInstructions, setShowInstructions] = useState(false);
  const instructions = getInstallInstructions();

  const handleInstall = async () => {
    const success = await installApp();
    
    if (success) {
      toast({
        title: "App Instalada! 🎉",
        description: "A aplicação foi instalada com sucesso no seu dispositivo",
      });
    } else {
      // Se não conseguiu instalar automaticamente, mostrar instruções
      setShowInstructions(true);
    }
  };

  const handleShare = async () => {
    const success = await shareApp();
    
    if (success) {
      toast({
        title: "Partilhado",
        description: "Link copiado para a área de transferência",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível partilhar a aplicação",
        variant: "destructive"
      });
    }
  };

  // Não mostrar nada se já estiver instalado
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          App Instalada
        </Badge>
        {!isOnline && (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <WifiOff className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de status online/offline */}
      {!isOnline && (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      )}

      {/* Botão de instalação automática */}
      {isInstallable && (
        <Button variant="outline" size="sm" onClick={handleInstall}>
          <Download className="h-4 w-4 mr-2" />
          Instalar App
        </Button>
      )}

      {/* Botão de instruções manuais */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs">
            <Smartphone className="h-4 w-4 mr-1" />
            {isInstallable ? 'Ajuda' : 'Instalar'}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Instalar como App
            </DialogTitle>
            <DialogDescription>
              Instale esta aplicação no seu dispositivo para acesso rápido e funcionalidade offline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Benefícios da instalação */}
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📱 Vantagens da App
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Acesso rápido sem abrir o navegador</li>
                <li>• Funciona mesmo sem internet</li>
                <li>• Notificações diretas no dispositivo</li>
                <li>• Interface otimizada para mobile</li>
              </ul>
            </div>

            {/* Instruções específicas do navegador */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Como instalar no {instructions.browser}
              </h4>
              
              <ol className="text-sm space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Botão de partilha */}
            <div className="pt-2 border-t">
              <Button variant="outline" onClick={handleShare} className="w-full">
                <Share className="h-4 w-4 mr-2" />
                Partilhar Aplicação
              </Button>
            </div>

            {/* Nota sobre compatibilidade */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Nota:</strong> Alguns navegadores podem não suportar instalação automática. 
                Nesse caso, adicione aos favoritos para acesso rápido.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 