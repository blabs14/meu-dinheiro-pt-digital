import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, Moon, Sun, Monitor, Palette, Globe, Save } from 'lucide-react';
import { settingsService, NotificationSettings as NotificationSettingsType, AppPreferences } from '../services/settingsService';

export const NotificationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [notifications, setNotifications] = useState<NotificationSettingsType>(settingsService.loadNotificationSettings(user?.id ?? ''));
  const [preferences, setPreferences] = useState<AppPreferences>(settingsService.loadAppPreferences(user?.id ?? ''));

  useEffect(() => {
    if (user) {
      setNotifications(settingsService.loadNotificationSettings(user.id));
      setPreferences(settingsService.loadAppPreferences(user.id));
      applyTheme(settingsService.loadAppPreferences(user.id).theme);
    }
  }, [user]);

  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      settingsService.saveNotificationSettings(user.id, notifications);
      settingsService.saveAppPreferences(user.id, preferences);

      // Aplicar tema
      applyTheme(preferences.theme);

      toast({
        title: "Sucesso",
        description: "Configurações guardadas com sucesso",
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao guardar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (key: keyof NotificationSettingsType) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updatePreference = (key: keyof AppPreferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Configurações de Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure quando e como quer receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber resumos e alertas por email
                </p>
              </div>
              <Switch
                checked={notifications.email_notifications}
                onCheckedChange={() => toggleNotification('email_notifications')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembretes de Metas</Label>
                <p className="text-sm text-muted-foreground">
                  Alertas quando se aproxima de uma meta ou prazo
                </p>
              </div>
              <Switch
                checked={notifications.goal_reminders}
                onCheckedChange={() => toggleNotification('goal_reminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Relatórios Mensais</Label>
                <p className="text-sm text-muted-foreground">
                  Resumo mensal das suas finanças
                </p>
              </div>
              <Switch
                checked={notifications.monthly_reports}
                onCheckedChange={() => toggleNotification('monthly_reports')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Lembretes de Faturas</Label>
                <p className="text-sm text-muted-foreground">
                  Alertas para despesas fixas próximas do vencimento
                </p>
              </div>
              <Switch
                checked={notifications.bill_reminders}
                onCheckedChange={() => toggleNotification('bill_reminders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Conquistas</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrar quando atingir metas ou marcos importantes
                </p>
              </div>
              <Switch
                checked={notifications.achievement_alerts}
                onCheckedChange={() => toggleNotification('achievement_alerts')}
              />
            </div>
          </div>

          {notifications.email_notifications && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                📧 Configuração de Email
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                As notificações serão enviadas para: <strong>{user?.email}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferências da Aplicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência e Idioma
          </CardTitle>
          <CardDescription>
            Personalize a aparência e o idioma da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Tema</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => updatePreference('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Claro
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Escuro
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Sistema
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Idioma</Label>
              <Select
                value={preferences.language}
                onValueChange={(value) => updatePreference('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">
                    <div className="flex items-center gap-2">
                      🇵🇹 Português
                    </div>
                  </SelectItem>
                  <SelectItem value="en" disabled>
                    <div className="flex items-center gap-2">
                      🇬🇧 English
                      <Badge variant="secondary" className="text-xs">Em breve</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Moeda</Label>
              <Select
                value={preferences.currency}
                onValueChange={(value) => updatePreference('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">
                    <div className="flex items-center gap-2">
                      💶 Euro (EUR)
                    </div>
                  </SelectItem>
                  <SelectItem value="USD" disabled>
                    <div className="flex items-center gap-2">
                      💵 Dólar (USD)
                      <Badge variant="secondary" className="text-xs">Em breve</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="GBP" disabled>
                    <div className="flex items-center gap-2">
                      💷 Libra (GBP)
                      <Badge variant="secondary" className="text-xs">Em breve</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Formato de Data</Label>
              <Select
                value={preferences.date_format}
                onValueChange={(value) => updatePreference('date_format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/mm/yyyy">
                    DD/MM/YYYY (31/12/2024)
                  </SelectItem>
                  <SelectItem value="mm/dd/yyyy">
                    MM/DD/YYYY (12/31/2024)
                  </SelectItem>
                  <SelectItem value="yyyy-mm-dd">
                    YYYY-MM-DD (2024-12-31)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              🎨 Personalização
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              As suas preferências são guardadas localmente e aplicadas automaticamente quando inicia sessão.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão para Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={loading} className="w-full md:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'A guardar...' : 'Guardar Configurações'}
        </Button>
      </div>
    </div>
  );
}; 