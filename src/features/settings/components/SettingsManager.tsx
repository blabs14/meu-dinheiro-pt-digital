import { ProfileSettings } from './ProfileSettings';
import { NotificationSettings } from './NotificationSettings';
import { DataExport } from './DataExport';
import { SimpleFamilyManager } from '@/features/family/controllers/SimpleFamilyManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsManager() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configurações</h2>
        <p className="text-gray-600">Gerir a sua conta, preferências e dados</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="family">Família</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="family">
          <SimpleFamilyManager />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="data">
          <DataExport />
        </TabsContent>
      </Tabs>
    </div>
  );
} 