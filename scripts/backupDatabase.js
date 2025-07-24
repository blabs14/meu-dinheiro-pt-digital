#!/usr/bin/env node

/**
 * Script para fazer backup completo da base de dados Supabase
 * 
 * Este script:
 * 1. Conecta à base de dados remota
 * 2. Exporta todas as tabelas
 * 3. Inclui estrutura (DDL) e dados (DML)
 * 4. Gera um ficheiro timestamped
 * 5. Salva no diretório archive/sql/
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações da base de dados
const DB_CONFIG = {
  host: 'db.ebitcwrrcumsvqjgrapw.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '!CapitaoMat14',
  projectId: 'ebitcwrrcumsvqjgrapw'
};

// Função para gerar timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Função para criar backup
async function createBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `backup_completo_${timestamp}.sql`);
  
  // Garantir que o diretório existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Comando pg_dump
  const pgDumpCommand = `pg_dump --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.user} --dbname=${DB_CONFIG.database} --verbose --clean --no-owner --no-privileges --schema=public --file="${backupFile}"`;

  console.log('🔄 Iniciando backup da base de dados...');
  console.log(`📁 Ficheiro de destino: ${backupFile}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log('');

  // Definir variável de ambiente para a password
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  return new Promise((resolve, reject) => {
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

      console.log('✅ Backup concluído com sucesso!');
      console.log(`📄 Ficheiro criado: ${backupFile}`);
      
      // Verificar tamanho do ficheiro
      try {
        const stats = fs.statSync(backupFile);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📊 Tamanho do ficheiro: ${fileSizeInMB} MB`);
      } catch (err) {
        console.log('⚠️ Não foi possível verificar o tamanho do ficheiro');
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

// Função para criar backup apenas da estrutura (sem dados)
async function createStructureBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `estrutura_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const pgDumpCommand = `pg_dump --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.user} --dbname=${DB_CONFIG.database} --verbose --clean --no-owner --no-privileges --schema=public --schema-only --file="${backupFile}"`;

  console.log('🔄 Criando backup da estrutura...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  return new Promise((resolve, reject) => {
    exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro:', error.message);
        reject(error);
        return;
      }

      console.log('✅ Estrutura exportada com sucesso!');
      resolve(backupFile);
    });
  });
}

// Função para criar backup apenas dos dados (sem estrutura)
async function createDataBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `dados_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const pgDumpCommand = `pg_dump --host=${DB_CONFIG.host} --port=${DB_CONFIG.port} --username=${DB_CONFIG.user} --dbname=${DB_CONFIG.database} --verbose --clean --no-owner --no-privileges --schema=public --data-only --file="${backupFile}"`;

  console.log('🔄 Criando backup dos dados...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password };

  return new Promise((resolve, reject) => {
    exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro:', error.message);
        reject(error);
        return;
      }

      console.log('✅ Dados exportados com sucesso!');
      resolve(backupFile);
    });
  });
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'full';

  try {
    console.log('🚀 Iniciando processo de backup...');
    console.log(`📋 Tipo de backup: ${type}`);
    console.log('');

    switch (type) {
      case 'structure':
        await createStructureBackup();
        break;
      case 'data':
        await createDataBackup();
        break;
      case 'full':
      default:
        await createBackup();
        break;
    }

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

export {
  createBackup,
  createStructureBackup,
  createDataBackup
}; 