import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsService, NotificationSettings, AppPreferences } from './settingsService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: 1, valor: 10, tipo: 'receita', created_at: '2024-01-01' }], error: null }),
      single: vi.fn().mockResolvedValue({ data: { id: 'profile1' }, error: null })
    }))
  }
}));

describe('settingsService', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('carrega notificações por defeito se não existir no localStorage', () => {
    const result = settingsService.loadNotificationSettings('user1');
    expect(result).toEqual({
      email_notifications: true,
      goal_reminders: true,
      monthly_reports: false,
      bill_reminders: true,
      achievement_alerts: true
    });
  });

  it('guarda e carrega notificações personalizadas', () => {
    const custom: NotificationSettings = {
      email_notifications: false,
      goal_reminders: false,
      monthly_reports: true,
      bill_reminders: false,
      achievement_alerts: false
    };
    settingsService.saveNotificationSettings('user2', custom);
    const loaded = settingsService.loadNotificationSettings('user2');
    expect(loaded).toEqual(custom);
  });

  it('carrega preferências por defeito se não existir no localStorage', () => {
    const result = settingsService.loadAppPreferences('user1');
    expect(result).toEqual({
      theme: 'system',
      language: 'pt',
      currency: 'EUR',
      date_format: 'dd/mm/yyyy'
    });
  });

  it('guarda e carrega preferências personalizadas', () => {
    const custom: AppPreferences = {
      theme: 'dark',
      language: 'en',
      currency: 'USD',
      date_format: 'yyyy-mm-dd'
    };
    settingsService.saveAppPreferences('user2', custom);
    const loaded = settingsService.loadAppPreferences('user2');
    expect(loaded).toEqual(custom);
  });

  it('exporta transações CSV (mock)', async () => {
    const data = await settingsService.exportTransactionsCSV('user1');
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('id');
  });

  it('exporta metas JSON (mock)', async () => {
    const data = await settingsService.exportGoalsJSON('user1');
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('id');
  });

  it('exporta backup completo (mock)', async () => {
    const data = await settingsService.exportFullData('user1', 'test@email.com', '2024-01-01');
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('profile');
    expect(data).toHaveProperty('statistics');
    expect(data).toHaveProperty('data');
  });
}); 