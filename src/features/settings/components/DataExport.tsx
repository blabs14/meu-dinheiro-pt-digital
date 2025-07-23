import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { settingsService } from '../services/settingsService';
import { Download, Info, ShieldCheck, FileText, Target, Database } from 'lucide-react';

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function toCSV(transactions: any[]): string {
  if (!transactions || transactions.length === 0) return '';
  const header = Object.keys(transactions[0]).join(',');
  const rows = transactions.map(t => Object.values(t).map(v => {
    if (typeof v === 'object' && v !== null) return JSON.stringify(v);
    return String(v).replace(/"/g, '""');
  }).join(','));
  return [header, ...rows].join('\n');
}

export const DataExport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleExportTransactions = async () => {
    setLoading('transactions'); setError(null);
    try {
      const data = await settingsService.exportTransactionsCSV(user.id);
      const csv = toCSV(data);
      downloadFile('transacoes.csv', csv, 'text/csv');
    } catch (e: any) {
      setError('Erro ao exportar transações.');
    } finally { setLoading(null); }
  };

  const handleExportGoals = async () => {
    setLoading('goals'); setError(null);
    try {
      const data = await settingsService.exportGoalsJSON(user.id);
      downloadFile('metas.json', JSON.stringify(data, null, 2), 'application/json');
    } catch (e: any) {
      setError('Erro ao exportar metas.');
    } finally { setLoading(null); }
  };

  const handleExportBackup = async () => {
    setLoading('backup'); setError(null);
    try {
      const data = await settingsService.exportFullData(user.id, user.email, user.created_at);
      downloadFile('backup_completo.json', JSON.stringify(data, null, 2), 'application/json');
    } catch (e: any) {
      setError('Erro ao exportar backup completo.');
    } finally { setLoading(null); }
  };

  return (
    <div className="space-y-8">
      {/* Sobre a Exportação de Dados */}
      <Card className="bg-white/90">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5 text-blue-500" /> Sobre a Exportação de Dados
          </CardTitle>
          <CardDescription>
            Exporte os seus dados financeiros para backup ou uso noutras aplicações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900 flex flex-col gap-1">
            <div className="font-medium mb-1">📄 Formatos Disponíveis</div>
            <ul className="list-disc ml-6">
              <li><b>CSV:</b> Ideal para Excel e Google Sheets</li>
              <li><b>JSON:</b> Formato estruturado para desenvolvimento</li>
              <li><b>Backup:</b> Arquivo completo para restauro</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Exportar Dados */}
      <Card className="bg-white/90">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="w-5 h-5 text-green-600" /> Exportar Dados
          </CardTitle>
          <CardDescription>Escolha o tipo de dados e formato que deseja exportar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transações */}
          <div className="flex items-center justify-between bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-7 h-7 text-green-700" />
              <div>
                <div className="font-semibold">Transações (CSV) <Badge variant="secondary" className="ml-2">Recomendado</Badge></div>
                <div className="text-sm text-muted-foreground">Exportar todas as transações em formato CSV para Excel</div>
              </div>
            </div>
            <Button onClick={handleExportTransactions} disabled={loading==='transactions'}>
              <Download className="w-4 h-4" /> {loading==='transactions' ? 'A exportar...' : 'Exportar'}
            </Button>
          </div>
          {/* Metas */}
          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Target className="w-7 h-7 text-blue-700" />
              <div>
                <div className="font-semibold">Metas (JSON)</div>
                <div className="text-sm text-muted-foreground">Exportar metas de poupança em formato JSON</div>
              </div>
            </div>
            <Button onClick={handleExportGoals} disabled={loading==='goals'}>
              <Download className="w-4 h-4" /> {loading==='goals' ? 'A exportar...' : 'Exportar'}
            </Button>
          </div>
          {/* Backup Completo */}
          <div className="flex items-center justify-between bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Database className="w-7 h-7 text-purple-700" />
              <div>
                <div className="font-semibold">Backup Completo (JSON) <Badge variant="secondary" className="ml-2">Backup</Badge></div>
                <div className="text-sm text-muted-foreground">Exportar todos os dados incluindo perfil e estatísticas</div>
              </div>
            </div>
            <Button onClick={handleExportBackup} disabled={loading==='backup'}>
              <Download className="w-4 h-4" /> {loading==='backup' ? 'A exportar...' : 'Exportar'}
            </Button>
          </div>
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </CardContent>
      </Card>

      {/* Privacidade e Segurança */}
      <Card className="bg-green-50/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-green-800">
            <ShieldCheck className="w-5 h-5" /> Privacidade e Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc ml-6 text-green-900 text-sm space-y-1">
            <li>Os dados são exportados diretamente do seu navegador</li>
            <li>Nenhuma informação é enviada para servidores externos</li>
            <li>Os ficheiros exportados ficam apenas no seu dispositivo</li>
            <li>Dados sensíveis como palavras-passe não são incluídos</li>
          </ul>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4 rounded text-yellow-900 text-sm flex items-center gap-2">
            <span className="font-semibold">⚠️ Importante</span>
            <span>Guarde os ficheiros exportados num local seguro. Estes contêm informações financeiras sensíveis e devem ser protegidos adequadamente.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 