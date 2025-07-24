#!/usr/bin/env node

/**
 * Script para fazer backup completo da base de dados Supabase usando o cliente oficial
 * 
 * Este script:
 * 1. Conecta à base de dados via Supabase client
 * 2. Exporta todas as tabelas
 * 3. Inclui estrutura (DDL) e dados (DML)
 * 4. Gera um ficheiro timestamped
 * 5. Salva no diretório archive/sql/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = 'https://ebitcwrrcumsvqjgrapw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaXRjd3JybXVyaXVyZnd4YmphY2MiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM1NzE5NzYwLCJleHAiOjIwNTEyOTU3NjB9.YourServiceKeyHere'; // Substituir pela chave real

// Função para gerar timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// Função para obter estrutura das tabelas
async function getTableStructure(supabase) {
  console.log('📋 Obtendo estrutura das tabelas...');
  
  const tables = [
    'profiles',
    'categories', 
    'accounts',
    'transactions',
    'goals',
    'families',
    'family_members',
    'family_invites'
  ];

  let structureSQL = '';

  for (const table of tables) {
    try {
      // Obter estrutura da tabela
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', table)
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (error) {
        console.log(`⚠️ Erro ao obter estrutura de ${table}:`, error.message);
        continue;
      }

      if (columns && columns.length > 0) {
        structureSQL += `\n-- Estrutura da tabela ${table}\n`;
        structureSQL += `CREATE TABLE IF NOT EXISTS "${table}" (\n`;
        
        const columnDefs = columns.map(col => {
          let def = `  "${col.column_name}" ${col.data_type}`;
          if (col.is_nullable === 'NO') def += ' NOT NULL';
          if (col.column_default) def += ` DEFAULT ${col.column_default}`;
          return def;
        });
        
        structureSQL += columnDefs.join(',\n');
        structureSQL += '\n);\n';
      }
    } catch (err) {
      console.log(`⚠️ Erro ao processar tabela ${table}:`, err.message);
    }
  }

  return structureSQL;
}

// Função para obter dados das tabelas
async function getTableData(supabase) {
  console.log('📊 Obtendo dados das tabelas...');
  
  const tables = [
    'profiles',
    'categories', 
    'accounts',
    'transactions',
    'goals',
    'families',
    'family_members',
    'family_invites'
  ];

  let dataSQL = '';

  for (const table of tables) {
    try {
      console.log(`📤 Exportando dados de ${table}...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.log(`⚠️ Erro ao obter dados de ${table}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        dataSQL += `\n-- Dados da tabela ${table}\n`;
        
        for (const row of data) {
          const columns = Object.keys(row);
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          });
          
          dataSQL += `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      } else {
        console.log(`ℹ️ Tabela ${table} está vazia`);
      }
    } catch (err) {
      console.log(`⚠️ Erro ao processar dados de ${table}:`, err.message);
    }
  }

  return dataSQL;
}

// Função para criar backup completo
async function createBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `backup_supabase_${timestamp}.sql`);
  
  // Garantir que o diretório existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Iniciando backup via Supabase client...');
  console.log(`📁 Ficheiro de destino: ${backupFile}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log('');

  try {
    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Header do ficheiro SQL
    let backupContent = `-- Backup completo da base de dados Supabase
-- Gerado em: ${new Date().toISOString()}
-- Projeto: ebitcwrrcumsvqjgrapw
-- Método: Supabase Client

-- ========================================
-- ESTRUTURA DA BASE DE DADOS
-- ========================================

`;

    // Obter estrutura
    const structure = await getTableStructure(supabase);
    backupContent += structure;

    backupContent += `
-- ========================================
-- DADOS DA BASE DE DADOS
-- ========================================

`;

    // Obter dados
    const data = await getTableData(supabase);
    backupContent += data;

    // Escrever ficheiro
    fs.writeFileSync(backupFile, backupContent, 'utf8');

    console.log('✅ Backup concluído com sucesso!');
    console.log(`📄 Ficheiro criado: ${backupFile}`);
    
    // Verificar tamanho do ficheiro
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamanho do ficheiro: ${fileSizeInMB} MB`);

    return backupFile;

  } catch (error) {
    console.error('❌ Erro durante o backup:', error.message);
    throw error;
  }
}

// Função para criar backup apenas da estrutura
async function createStructureBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `estrutura_supabase_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Criando backup da estrutura...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const structure = await getTableStructure(supabase);
    
    const backupContent = `-- Estrutura da base de dados Supabase
-- Gerado em: ${new Date().toISOString()}
-- Projeto: ebitcwrrcumsvqjgrapw

${structure}`;

    fs.writeFileSync(backupFile, backupContent, 'utf8');
    console.log('✅ Estrutura exportada com sucesso!');
    return backupFile;

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Função para criar backup apenas dos dados
async function createDataBackup() {
  const timestamp = getTimestamp();
  const backupDir = path.join(__dirname, '..', 'archive', 'sql');
  const backupFile = path.join(backupDir, `dados_supabase_${timestamp}.sql`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Criando backup dos dados...');
  console.log(`📁 Ficheiro: ${backupFile}`);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const data = await getTableData(supabase);
    
    const backupContent = `-- Dados da base de dados Supabase
-- Gerado em: ${new Date().toISOString()}
-- Projeto: ebitcwrrcumsvqjgrapw

${data}`;

    fs.writeFileSync(backupFile, backupContent, 'utf8');
    console.log('✅ Dados exportados com sucesso!');
    return backupFile;

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'full';

  try {
    console.log('🚀 Iniciando processo de backup via Supabase...');
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