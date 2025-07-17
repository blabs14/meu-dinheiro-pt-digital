import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from './ProfileSettings';
import { NotificationSettings } from './NotificationSettings';
import { DataExport } from './DataExport';
import { FamilyManager } from '@/components/family/FamilyManager';
import { Settings, User, Bell, Download, Users } from 'lucide-react';

export const SettingsManager = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerir a sua conta, preferências e dados
          </p>
        </div>

        {/* Tabs de Configurações */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Família
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Dados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="family">
            <FamilyManager />
          </TabsContent>

          <TabsContent value="data">
            <DataExport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 