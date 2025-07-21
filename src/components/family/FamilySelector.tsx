import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface FamilyData {
  id: string;
  nome: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  settings: {
    allow_view_all: boolean;
    allow_add_transactions: boolean;
    require_approval: boolean;
  };
  userRole?: string;
}

interface FamilySelectorProps {
  selectedFamilyId: string;
  onFamilySelect: (familyId: string) => void;
  userFamilies: FamilyData[];
  onLeaveFamily: (familyId: string) => void;
}

export const FamilySelector = ({ 
  selectedFamilyId, 
  onFamilySelect, 
  userFamilies, 
  onLeaveFamily 
}: FamilySelectorProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLeaveFamily = async (familyId: string) => {
    const family = userFamilies.find(f => f.id === familyId);
    if (!family) return;

    // Validação para owner com outros membros
    if (family.userRole === 'owner') {
      toast({
        title: 'Aviso',
        description: 'Como owner, deve transferir o ownership antes de sair da família.',
        variant: 'destructive',
      });
      return;
    }

    onLeaveFamily(familyId);
  };

  if (userFamilies.length === 0) {
    return (
      <Card className="border-yellow-400">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700">
            <Users className="h-5 w-5" />
            Nenhuma Família
          </CardTitle>
          <CardDescription>
            Não pertence a nenhuma família ainda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/settings')} className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Criar ou Juntar-se a uma Família
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {userFamilies.length > 1 ? 'Selecionar Família' : 'Família Atual'}
        </CardTitle>
        <CardDescription>
          {userFamilies.length > 1 
            ? 'Escolha qual família quer visualizar' 
            : 'A sua família atual'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userFamilies.map((family) => (
            <div
              key={family.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedFamilyId === family.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onFamilySelect(family.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{family.nome}</h3>
                    <Badge variant={family.userRole === 'owner' ? 'default' : 'secondary'}>
                      {family.userRole}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {family.description || 'Sem descrição'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedFamilyId === family.id && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                  
                  {userFamilies.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveFamily(family.id);
                      }}
                      disabled={family.userRole === 'owner'}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 