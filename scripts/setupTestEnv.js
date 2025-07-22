import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envTestPath = path.join(__dirname, '../.env.test');

console.log('🔧 Configurando ambiente de testes...');

// Verificar se .env.test existe
if (!fs.existsSync(envTestPath)) {
  console.log('📝 Criando .env.test...');
  const envTestContent = `# Configuração de ambiente de testes\nNODE_ENV=test\n\n# Supabase Test Project\n# Substitui estas variáveis pelas chaves do teu projeto de teste\nSUPABASE_URL=https://your-test-project.supabase.co\nSUPABASE_ANON_KEY=your-test-anon-key\nSUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key\n\n# Configurações de teste\nTEST_TIMEOUT=10000\nTEST_ACCESS_TOKEN=your-test-access-token\n\n# Configurações de logging para testes\nLOG_LEVEL=error\n`;
  
  fs.writeFileSync(envTestPath, envTestContent);
  console.log('✅ .env.test criado. Por favor, edita-o com as tuas chaves de teste.');
} else {
  console.log('✅ .env.test já existe.');
  
  // Verificar se as chaves estão configuradas
  const envContent = fs.readFileSync(envTestPath, 'utf8');
  const hasValidKeys = envContent.includes('https://') && 
                      envContent.includes('eyJ') && 
                      !envContent.includes('your-test-project');
  
  if (!hasValidKeys) {
    console.log('⚠️  Aviso: As chaves do Supabase no .env.test parecem ser placeholders.');
    console.log('   Por favor, atualiza-as com as chaves reais do teu projeto de teste.');
  } else {
    console.log('✅ Chaves do Supabase configuradas corretamente.');
  }
}

// Verificar se o diretório de testes existe
const testsDir = path.join(__dirname, '../src/tests');
if (!fs.existsSync(testsDir)) {
  console.log('📁 Criando diretório de testes...');
  fs.mkdirSync(testsDir, { recursive: true });
  fs.mkdirSync(path.join(testsDir, 'integration'), { recursive: true });
  console.log('✅ Diretório de testes criado.');
}

// Verificar se os ficheiros de configuração do Jest existem
const jestConfigPath = path.join(__dirname, '../jest.config.cjs');
if (!fs.existsSync(jestConfigPath)) {
  console.log('⚠️  Aviso: jest.config.cjs não encontrado.');
}

const jestSetupPath = path.join(__dirname, '../jest.setup.js');
if (!fs.existsSync(jestSetupPath)) {
  console.log('⚠️  Aviso: jest.setup.js não encontrado.');
}

console.log('🏁 Ambiente de testes configurado!');
console.log('💡 Dica: Executa "npm test" para correr os testes.'); 