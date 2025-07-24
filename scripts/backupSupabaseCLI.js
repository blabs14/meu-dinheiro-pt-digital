#!/usr/bin/env node

/**
 * Script para fazer backup da base de dados usando Supabase CLI
 * 
 * Este script:
 * 1. Usa o Supabase CLI para conectar ao projeto remoto
 * 2. Exporta a estrutura e dados
 * 3. Gera um ficheiro timestamped
 * 4. Salva no diretório archive/sql/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const PROJECT_ID = 'ebitcwrrcumsvqjgrapw';
const SUPABASE_URL = 'https://ebitcwrrcumsvqjgrapw.supabase.co';

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Função para executar comando
function executeCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 ${description}...`);
    console.log(`🔧 Comando: ${command}`);
    console.log('');

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro: ${error.message}`);
        if (stderr) console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }

      if (stderr) {
        console.log(`⚠️ Avisos: ${stderr}`);
      }

      if (stdout) {
        console.log(`📤 Output: ${stdout}`);
      }

      console.log(`✅ ${description} concluído!`);
      resolve(stdout);
    });
  });
}

// Função para fazer backup completo
async function createBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `backup_supabase_cli_${timestamp}.sql`);
  
  console.log('🔄 Iniciando backup via Supabase CLI...');
  console.log(`📁 Diretório: ${backupDir}`);
  console.log(`📄 Ficheiro: ${backupFile}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`🆔 Project ID: ${PROJECT_ID}`);
  console.log('');

  // Garantir que o diretório existe
  if (!fs.existsSync(backupDir)) {
    console.log('📁 Criando diretório de backup...');
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // 1. Verificar se estamos ligados ao projeto correto
    console.log('🔍 Verificando ligação ao projeto...');
    await executeCommand(`supabase projects list`, 'Listando projetos');

    // 2. Fazer backup da estrutura
    console.log('📋 Fazendo backup da estrutura...');
    await executeCommand(`supabase db dump --schema public --file "${backupFile}"`, 'Exportando estrutura');

    // 3. Verificar se o ficheiro foi criado
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      const lines = fs.readFileSync(backupFile, 'utf8').split('\n').length;
      
      console.log('✅ Backup concluído com sucesso!');
      console.log(`📄 Ficheiro criado: ${backupFile}`);
      console.log(`📊 Tamanho: ${fileSizeInMB} MB`);
      console.log(`📊 Linhas: ${lines}`);
      
      return backupFile;
    } else {
      throw new Error('Ficheiro de backup não foi criado');
    }

  } catch (error) {
    console.error('❌ Erro durante o backup:', error.message);
    throw error;
  }
}

// Função para fazer backup apenas da estrutura
async function createStructureBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `estrutura_supabase_cli_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Criando backup da estrutura...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  try {
    await executeCommand(`supabase db dump --schema public --schema-only --file "${backupFile}"`, 'Exportando estrutura');
    
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Estrutura exportada! Tamanho: ${fileSizeInMB} MB`);
      return backupFile;
    } else {
      throw new Error('Ficheiro de estrutura não foi criado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Função para fazer backup apenas dos dados
async function createDataBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `dados_supabase_cli_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Criando backup dos dados...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  try {
    await executeCommand(`supabase db dump --schema public --data-only --file "${backupFile}"`, 'Exportando dados');
    
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Dados exportados! Tamanho: ${fileSizeInMB} MB`);
      return backupFile;
    } else {
      throw new Error('Ficheiro de dados não foi criado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Função para listar tabelas
async function listTables() {
  console.log('📋 Listando tabelas disponíveis...');
  
  try {
    await executeCommand(`supabase db dump --schema public --list-tables`, 'Listando tabelas');
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'full';

  try {
    console.log('🚀 Iniciando processo de backup via Supabase CLI...');
    console.log(`📋 Tipo de backup: ${type}`);
    console.log('');

    switch (type) {
      case 'structure':
        await createStructureBackup();
        break;
      case 'data':
        await createDataBackup();
        break;
      case 'tables':
        await listTables();
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
  createDataBackup,
  listTables
}; 