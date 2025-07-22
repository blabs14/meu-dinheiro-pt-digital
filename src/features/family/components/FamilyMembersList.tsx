import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FamilyMember } from '@/hooks/useFamilyMembers';

interface FamilyMembersListProps {
  members: FamilyMember[];
  loading: boolean;
  onRemove?: (memberId: string) => void;
  onUpdateRole?: (memberId: string, newRole: 'admin' | 'member' | 'viewer') => void;
}

export function FamilyMembersList({ members, loading, onRemove, onUpdateRole }: FamilyMembersListProps) {
  const getRoleLabel = (role: string) => {
    const roles = {
      owner: 'Dono',
      admin: 'Administrador',
      member: 'Membro',
      viewer: 'Visualizador'
    };
    return roles[role as keyof typeof roles] || role;
  };
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };
  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">A carregar membros...</div>;
  }
  if (!members.length) {
    return <div className="py-8 text-center text-muted-foreground">Nenhum membro encontrado.</div>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((member) => (
        <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            {member.profiles?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{member.profiles?.nome || 'Utilizador'}</p>
            <p className="text-sm text-muted-foreground truncate">{member.profiles?.email}</p>
          </div>
          <Badge variant={getRoleBadgeVariant(member.role) as any}>{getRoleLabel(member.role)}</Badge>
          {onRemove && member.role !== 'owner' && (
            <Button variant="ghost" size="icon" onClick={() => onRemove(member.id)} title="Remover membro">
              <span className="sr-only">Remover</span>🗑️
            </Button>
          )}
          {/* Exemplo de alteração de role (pode ser expandido) */}
          {onUpdateRole && member.role !== 'owner' && (
            <select
              className="ml-2 border rounded px-1 py-0.5 text-xs"
              value={member.role}
              onChange={e => onUpdateRole(member.id, e.target.value as any)}
            >
              <option value="admin">Administrador</option>
              <option value="member">Membro</option>
              <option value="viewer">Visualizador</option>
            </select>
          )}
        </div>
      ))}
    </div>
  );
} 