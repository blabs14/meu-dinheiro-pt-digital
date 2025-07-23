import { execSync } from 'child_process';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente apenas fora de CI
const envLocal = path.join(__dirname, '../.env.local');
const envTest = path.join(__dirname, '../.env.test');
dotenv.config({ path: envTest });

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error('Erro: SUPABASE_URL não definida.');
  process.exit(1);
}

const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('Nenhuma migração encontrada.');
  process.exit(0);
}

console.log(`A aplicar ${files.length} migrações...`);

for (const file of files) {
  const filePath = path.join(MIGRATIONS_DIR, file);
  console.log(`\n--- A aplicar: ${file} ---`);
  try {
    execSync(`psql "${SUPABASE_URL}" -f "${filePath}"`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Erro ao aplicar migração: ${file}`);
    process.exit(1);
  }
}

console.log('\nMigrações aplicadas com sucesso!'); 