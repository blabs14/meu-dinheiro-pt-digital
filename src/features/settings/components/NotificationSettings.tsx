import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, Save } from 'lucide-react';
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
    }
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      settingsService.saveNotificationSettings(user.id, notifications);
      settingsService.saveAppPreferences(user.id, preferences);
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

  return (
    <div className="space-y-8">
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-gray-700" /> Notificações
          </CardTitle>
          <CardDescription>
            Configure quando e como quer receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-semibold">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">Receber resumos e alertas por email</p>
              </div>
              <Switch
                checked={notifications.email_notifications}
                onCheckedChange={() => toggleNotification('email_notifications')}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-semibold">Lembretes de Metas</Label>
                <p className="text-sm text-muted-foreground">Alertas quando se aproxima de uma meta ou prazo</p>
              </div>
              <Switch
                checked={notifications.goal_reminders}
                onCheckedChange={() => toggleNotification('goal_reminders')}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-semibold">Relatórios Mensais</Label>
                <p className="text-sm text-muted-foreground">Resumo mensal das suas finanças</p>
              </div>
              <Switch
                checked={notifications.monthly_reports}
                onCheckedChange={() => toggleNotification('monthly_reports')}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-semibold">Lembretes de Faturas</Label>
                <p className="text-sm text-muted-foreground">Alertas para despesas fixas próximas do vencimento</p>
              </div>
              <Switch
                checked={notifications.bill_reminders}
                onCheckedChange={() => toggleNotification('bill_reminders')}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-semibold">Alertas de Conquistas</Label>
                <p className="text-sm text-muted-foreground">Celebrar quando atingir metas ou marcos importantes</p>
              </div>
              <Switch
                checked={notifications.achievement_alerts}
                onCheckedChange={() => toggleNotification('achievement_alerts')}
              />
            </div>
          </div>
          {notifications.email_notifications && (
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h4 className="font-medium text-blue-900 mb-2 text-base flex items-center gap-2">
                <span role="img" aria-label="email">📧</span> Configuração de Email
              </h4>
              <p className="text-sm text-blue-700">
                As notificações serão enviadas para: <span className="font-semibold">{user?.email}</span>
              </p>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveSettings} disabled={loading} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'A guardar...' : 'Guardar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 