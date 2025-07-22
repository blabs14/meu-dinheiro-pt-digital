import { execSync } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const envLocal = path.join(__dirname, '../.env.local');
const envTest = path.join(__dirname, '../.env.test');
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else if (fs.existsSync(envTest)) {
  dotenv.config({ path: envTest });
}

const SEED_FILE = path.join(__dirname, 'seed.sql');
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('Erro: SUPABASE_URL não definida.');
  process.exit(1);
}

console.log('A aplicar seed de dados...');
try {
  execSync(`psql "${SUPABASE_URL}" -f "${SEED_FILE}"`, { stdio: 'inherit' });
} catch (err) {
  console.error('Erro ao aplicar seed.');
  process.exit(1);
}
console.log('Seed aplicado com sucesso!'); 