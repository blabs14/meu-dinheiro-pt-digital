// Serviço para lógica de negócio de notificações e exportação de dados
import { supabase } from '@/integrations/supabase/client';

export interface NotificationSettings {
  email_notifications: boolean;
  goal_reminders: boolean;
  monthly_reports: boolean;
  bill_reminders: boolean;
  achievement_alerts: boolean;
}

export interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'pt' | 'en';
  currency: 'EUR' | 'USD' | 'GBP';
  date_format: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
}

// Notificações e preferências são guardadas localmente (localStorage) neste projeto
// Para produção, idealmente seria persistido em DB
export const settingsService = {
  loadNotificationSettings(userId: string): NotificationSettings {
    const saved = localStorage.getItem(`notifications_${userId}`);
    if (saved) return JSON.parse(saved);
    return {
      email_notifications: true,
      goal_reminders: true,
      monthly_reports: false,
      bill_reminders: true,
      achievement_alerts: true
    };
  },
  saveNotificationSettings(userId: string, settings: NotificationSettings) {
    localStorage.setItem(`notifications_${userId}` , JSON.stringify(settings));
  },
  loadAppPreferences(userId: string): AppPreferences {
    const saved = localStorage.getItem(`preferences_${userId}`);
    if (saved) return JSON.parse(saved);
    return {
      theme: 'system',
      language: 'pt',
      currency: 'EUR',
      date_format: 'dd/mm/yyyy'
    };
  },
  saveAppPreferences(userId: string, preferences: AppPreferences) {
    localStorage.setItem(`preferences_${userId}`, JSON.stringify(preferences));
  },
  // Exportação de dados
  async exportTransactionsCSV(userId: string) {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`id,valor,data,tipo,descricao,user_id,family_id,created_at,categories:categoria_id (nome,cor)`)
      .eq('user_id', userId)
      .order('data', { ascending: false });
    if (error) throw error;
    return transactions;
  },
  async exportGoalsJSON(userId: string) {
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return goals;
  },
  async exportFullData(userId: string, userEmail: string, userCreatedAt: string) {
    const [
      { data: profile },
      { data: transactions },
      { data: goals },
      { data: fixedExpenses }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('transactions').select('valor, data, tipo, descricao, created_at, categories:categoria_id (nome, cor)').eq('user_id', userId).order('data', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('fixed_expenses').select('nome, valor, dia_vencimento, ativa, created_at, categories:categoria_id (nome, cor)').eq('user_id', userId).order('created_at', { ascending: false })
    ]);
    return {
      user: {
        id: userId,
        email: userEmail,
        created_at: userCreatedAt
      },
      profile: profile || null,
      statistics: {
        total_transactions: transactions?.length || 0,
        total_goals: goals?.length || 0,
        total_fixed_expenses: fixedExpenses?.length || 0,
        total_income: transactions?.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0) || 0,
        total_expenses: transactions?.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0) || 0
      },
      data: {
        transactions: transactions || [],
        goals: goals || [],
        fixed_expenses: fixedExpenses || []
      }
    };
  }
}; 