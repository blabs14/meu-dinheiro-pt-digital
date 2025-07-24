# 📊 GUIA DE BACKUP DA BASE DE DADOS

## 🎯 **Visão Geral**

Este guia explica como fazer backup completo da base de dados Supabase do projeto "Meu Dinheiro". O backup inclui estrutura, dados, funções RPC, triggers e políticas RLS.

## 🚀 **Backup Completo (Recomendado)**

### **Método 1: Comando Direto (Mais Simples)**

```bash
# Backup completo com timestamp automático
supabase db dump --schema public --file "archive/sql/backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss').sql"
```

### **Método 2: Scripts NPM**

```bash
# Backup completo
npm run backup:final:full

# Backup apenas da estrutura
npm run backup:final:structure

# Backup apenas dos dados
npm run backup:final:data

# Informações do projeto
npm run backup:final:info
```

## 📋 **Scripts Disponíveis**

### **Scripts Principais:**
- `backup:final:full` - Backup completo (estrutura + dados)
- `backup:final:structure` - Apenas estrutura (DDL)
- `backup:final:data` - Apenas dados (DML)
- `backup:final:info` - Informações do projeto

### **Scripts Alternativos:**
- `backup:cli:*` - Versões usando Supabase CLI
- `backup:supabase:*` - Versões usando cliente Supabase
- `backup:simple` - Versão simples com pg_dump

## 📁 **Localização dos Backups**

Todos os backups são salvos em: `archive/sql/`

### **Estrutura de Ficheiros:**
```
archive/sql/
├── backup_completo_YYYY-MM-DD_HH-mm-ss.sql    # Backup completo
├── estrutura_YYYY-MM-DD_HH-mm-ss.sql          # Apenas estrutura
├── dados_YYYY-MM-DD_HH-mm-ss.sql             # Apenas dados
└── backup_direct_YYYY-MM-DD_HH-mm-ss.sql     # Backup direto
```

## 🔧 **Conteúdo do Backup**

### **O que está incluído:**
- ✅ **Estrutura completa** (tabelas, colunas, constraints)
- ✅ **Dados de todas as tabelas**
- ✅ **Funções RPC** (Row Level Security)
- ✅ **Triggers** (atualização automática de timestamps)
- ✅ **Políticas RLS** (Row Level Security)
- ✅ **Sequências e índices**
- ✅ **Comentários e metadados**

### **Tabelas incluídas:**
- `profiles` - Perfis dos utilizadores
- `categories` - Categorias de transações
- `accounts` - Contas bancárias
- `transactions` - Transações financeiras
- `goals` - Metas de poupança
- `families` - Famílias
- `family_members` - Membros das famílias
- `family_invites` - Convites para famílias
- `debug_logs` - Logs de debug
- `fixed_expenses` - Despesas fixas

## 📊 **Estatísticas do Backup Atual**

- **Tamanho:** ~59KB
- **Linhas:** ~1,898 linhas
- **Tabelas:** 10 tabelas
- **Funções:** 20+ funções RPC
- **Triggers:** 2 triggers
- **Políticas RLS:** Múltiplas políticas de segurança

## 🔄 **Restaurar Backup**

### **Para restaurar um backup:**

```bash
# 1. Conectar à base de dados
supabase db reset

# 2. Executar o ficheiro SQL
psql -h db.ebitcwrrcumsvqjgrapw.supabase.co -U postgres -d postgres -f archive/sql/backup_YYYY-MM-DD_HH-mm-ss.sql
```

### **Ou usar o Supabase CLI:**

```bash
# Restaurar estrutura
supabase db push

# Restaurar dados
psql -h db.ebitcwrrcumsvqjgrapw.supabase.co -U postgres -d postgres -f archive/sql/dados_YYYY-MM-DD_HH-mm-ss.sql
```

## ⚠️ **Notas Importantes**

### **Segurança:**
- Os backups contêm dados sensíveis
- Guarde os ficheiros em local seguro
- Não partilhe backups em repositórios públicos

### **Compatibilidade:**
- Backups são compatíveis com PostgreSQL
- Podem ser restaurados em qualquer instância PostgreSQL
- Mantêm todas as funcionalidades RLS e RPC

### **Frequência Recomendada:**
- **Desenvolvimento:** Antes de grandes alterações
- **Produção:** Diariamente ou semanalmente
- **Antes de migrações:** Sempre

## 🛠️ **Troubleshooting**

### **Erro: "pg_dump not found"**
```bash
# Instalar PostgreSQL client tools
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql-client
```

### **Erro: "Authentication failed"**
```bash
# Verificar se está ligado ao projeto correto
supabase projects list
supabase link --project-ref ebitcwrrcumsvqjgrapw
```

### **Erro: "Permission denied"**
```bash
# Verificar permissões do diretório
mkdir -p archive/sql
chmod 755 archive/sql
```

## 📞 **Suporte**

Se encontrar problemas:

1. Verificar se o Supabase CLI está instalado: `supabase --version`
2. Verificar ligação ao projeto: `supabase projects list`
3. Verificar status: `supabase status`
4. Consultar logs: `supabase logs`

## 🎉 **Conclusão**

O backup completo da base de dados foi criado com sucesso e está disponível em `archive/sql/backup_final_2025-07-24_01-46-50.sql`.

**Último backup:** 24 de Julho de 2025 às 01:46:50
**Tamanho:** 59KB
**Estado:** ✅ Completo e funcional 