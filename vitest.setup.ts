import '@testing-library/jest-dom';
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();
// Polyfill global TextEncoder/TextDecoder para Node <18
import { TextEncoder, TextDecoder } from 'util';
if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder as any;
if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder as any;

// Mock global do Supabase para todos os testes
import { vi } from 'vitest';
import { supabaseMock } from './test-utils/supabaseMockUtil.js';
vi.mock('@/integrations/supabase/client', () => ({ supabase: supabaseMock })); 