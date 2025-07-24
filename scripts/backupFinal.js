#!/usr/bin/env node

/**
 * Script final para fazer backup completo da base de dados Supabase
 * 
 * Este script usa o Supabase CLI para fazer backup completo da base de dados
 * incluindo estrutura, dados, funções RPC, triggers e políticas RLS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const backupFile = path.join(backupDir, `backup_completo_${timestamp}.sql`);
  
  console.log('🔄 Iniciando backup completo da base de dados...');
  console.log(`📁 Diretório: ${backupDir}`);
  console.log(`📄 Ficheiro: ${backupFile}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log('');

  // Garantir que o diretório existe
  if (!fs.existsSync(backupDir)) {
    console.log('📁 Criando diretório de backup...');
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // Fazer backup completo usando Supabase CLI
    const command = `supabase db dump --schema public --file "${backupFile}"`;
    await executeCommand(command, 'Exportando backup completo');

    // Verificar se o ficheiro foi criado
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      const content = fs.readFileSync(backupFile, 'utf8');
      const lines = content.split('\n').length;
      
      console.log('✅ Backup concluído com sucesso!');
      console.log(`📄 Ficheiro criado: ${backupFile}`);
      console.log(`📊 Tamanho: ${fileSizeInMB} MB`);
      console.log(`📊 Linhas: ${lines}`);
      
      // Mostrar resumo do conteúdo
      const tables = content.match(/CREATE TABLE IF NOT EXISTS "public"\."([^"]+)"/g) || [];
      const functions = content.match(/CREATE OR REPLACE FUNCTION "public"\."([^"]+)"/g) || [];
      const triggers = content.match(/CREATE OR REPLACE TRIGGER "([^"]+)"/g) || [];
      
      console.log(`📋 Tabelas encontradas: ${tables.length}`);
      console.log(`🔧 Funções encontradas: ${functions.length}`);
      console.log(`⚡ Triggers encontrados: ${triggers.length}`);
      
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
  const backupFile = path.join(backupDir, `estrutura_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Criando backup da estrutura...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  try {
    const command = `supabase db dump --schema public --schema-only --file "${backupFile}"`;
    await executeCommand(command, 'Exportando estrutura');
    
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
  const backupFile = path.join(backupDir, `dados_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Criando backup dos dados...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  try {
    const command = `supabase db dump --schema public --data-only --file "${backupFile}"`;
    await executeCommand(command, 'Exportando dados');
    
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

// Função para listar informações do projeto
async function showProjectInfo() {
  console.log('📋 Informações do projeto...');
  
  try {
    await executeCommand('supabase projects list', 'Listando projetos');
    await executeCommand('supabase status', 'Status do projeto');
  } catch (error) {
    console.error('❌ Erro ao obter informações:', error.message);
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'full';

  try {
    console.log('🚀 Iniciando processo de backup da base de dados...');
    console.log(`📋 Tipo de backup: ${type}`);
    console.log('');

    switch (type) {
      case 'structure':
        await createStructureBackup();
        break;
      case 'data':
        await createDataBackup();
        break;
      case 'info':
        await showProjectInfo();
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
  showProjectInfo
}; 