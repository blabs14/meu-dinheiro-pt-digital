#!/usr/bin/env node

/**
 * Script simples para fazer backup da base de dados
 * Usa as credenciais fornecidas pelo utilizador
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações da base de dados
const DB_CONFIG = {
  host: 'db.ebitcwrrcumsvqjgrapw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '!CapitaoMat14'
};

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

async function createBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `backup_completo_${timestamp}.sql`);
  
  console.log('🔄 Iniciando backup da base de dados...');
  console.log(`📁 Diretório: ${backupDir}`);
  console.log(`📄 Ficheiro: ${backupFile}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log('');

  // Garantir que o diretório existe
  if (!fs.existsSync(backupDir)) {
    console.log('📁 Criando diretório de backup...');
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Comando pg_dump
  const pgDumpCommand = `pg_dump --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.user} --dbname=${DB_CONFIG.database} --verbose --clean --no-owner --no-privileges --schema=public --file="${backupFile}"`;

  console.log('🔧 Comando a executar:');
  console.log(pgDumpCommand.replace(DB_CONFIG.password, '***'));
  console.log('');

  // Definir variável de ambiente para a password
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    
    console.log('🚀 Executando pg_dump...');
    
    const child = exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro durante o backup:', error.message);
        console.error('stderr:', stderr);
        reject(error);
        return;
      }

      if (stderr) {
        console.log('⚠️ Avisos durante o backup:', stderr);
      }

      if (stdout) {
        console.log('📤 Output:', stdout);
      }

      console.log('✅ Backup concluído com sucesso!');
      console.log(`📄 Ficheiro criado: ${backupFile}`);
      
      // Verificar se o ficheiro foi criado
      if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📊 Tamanho do ficheiro: ${fileSizeInMB} MB`);
        console.log(`📊 Linhas no ficheiro: ${fs.readFileSync(backupFile, 'utf8').split('\n').length}`);
      } else {
        console.log('⚠️ Ficheiro de backup não foi criado!');
      }

      resolve(backupFile);
    });

    // Mostrar progresso em tempo real
    child.stdout?.on('data', (data) => {
      console.log('📤', data.toString().trim());
    });

    child.stderr?.on('data', (data) => {
      console.log('📥', data.toString().trim());
    });
  });
}

async function main() {
  try {
    console.log('🚀 Iniciando processo de backup...');
    console.log('');

    await createBackup();

    console.log('');
    console.log('🎉 Processo de backup concluído!');
    console.log('📂 Verifique os ficheiros em: archive/sql/');

  } catch (error) {
    console.error('💥 Erro fatal:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createBackup }; 