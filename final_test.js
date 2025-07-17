import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebitcwrrcumsvqjgrapw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaXRjd3JyY3Vtc3ZxamdyYXB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjcyMTYsImV4cCI6MjA2ODM0MzIxNn0.hLlTeSD2VzVCjvUSXLYQypXNYqthDx0q1N86aOftfEY'
);

async function finalTest() {
  console.log('🧪 TESTE FINAL - Verificação das tabelas de família');
  console.log('================================================\n');

  const tables = ['families', 'family_members', 'family_invites'];
  let allGood = true;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(0);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ ${table}: OK (${count || 0} registos)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allGood = false;
    }
  }

  console.log('\n================================================');
  if (allGood) {
    console.log('🎉 SUCESSO! Todas as tabelas estão funcionais!');
    console.log('');
    console.log('📱 Próximos passos:');
    console.log('1. Aceda a http://localhost:8080/');
    console.log('2. Registe-se ou faça login');
    console.log('3. Vá para Configurações > Família');
    console.log('4. Teste criar uma família!');
  } else {
    console.log('⚠️  Ainda há problemas. Execute fix_family_policies.sql no Supabase SQL Editor');
  }
  console.log('================================================');
}

finalTest(); 