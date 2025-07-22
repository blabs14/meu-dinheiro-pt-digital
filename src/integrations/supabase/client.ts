// Este ficheiro deve ser seguro para produção. Nunca expor chaves sensíveis no frontend!
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Detetar ambiente e usar a fonte correta para as variáveis
const isNode = typeof window === 'undefined' || typeof process !== 'undefined';

let SUPABASE_URL = '';
let SUPABASE_PUBLISHABLE_KEY = '';

if (isNode) {
  SUPABASE_URL = process.env.SUPABASE_URL || '';
  SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
} else {
  SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
  SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
}

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY devem estar definidos nas variáveis de ambiente.');
}

// Detectar ambiente Node/teste e usar storage em memória
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = value; }
  removeItem(key: string) { delete this.store[key]; }
}

const storage = isNode ? new MemoryStorage() : localStorage;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
  }
});