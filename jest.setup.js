// Carregar variáveis de ambiente de teste
require('dotenv').config({ path: '.env.test' });

// Configurar timeout global para testes
jest.setTimeout(10000);

// Mock do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurar ambiente de teste
process.env.NODE_ENV = 'test'; 