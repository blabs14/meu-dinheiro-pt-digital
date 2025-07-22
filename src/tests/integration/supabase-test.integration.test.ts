import { supabase } from '../../integrations/supabase/client';

describe('Debug: Supabase Connection', () => {
  it('deve testar conexão com Supabase', async () => {
    console.error('🔧 Testando conexão com Supabase...');
    
    // Testar se conseguimos aceder ao Supabase usando uma tabela que existe
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    console.error('📊 Supabase query result:', { data, error });
    
    // Se conseguirmos fazer uma query, o problema não é de conexão
    if (!error) {
      console.error('✅ Conexão com Supabase OK');
    } else {
      console.error('❌ Erro na conexão com Supabase:', error);
    }
  });

  it('deve testar autenticação Supabase diretamente', async () => {
    console.error('🔧 Testando autenticação Supabase...');
    
    const testEmail = `direct_test_${Date.now()}@example.com`;
    console.error('📧 Test email:', testEmail);
    
    // Testar registo diretamente
    const signupResult = await supabase.auth.signUp({
      email: testEmail,
      password: '123456'
    });
    console.error('📝 Signup result:', {
      success: !signupResult.error,
      error: signupResult.error?.message,
      user: signupResult.data?.user?.email
    });
    
    // Se registo falhar, tentar login
    if (signupResult.error) {
      console.error('⚠️ Signup falhou, tentando login...');
      const loginResult = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: '123456'
      });
      console.error('🔑 Login result:', {
        success: !loginResult.error,
        error: loginResult.error?.message,
        session: !!loginResult.data?.session
      });
    }
  });

  it('deve testar com email permitido', async () => {
    console.error('🔧 Testando com email permitido...');
    
    // Tentar com um email que pode ser aceite
    const testEmail = `test_${Date.now()}@gmail.com`;
    console.error('📧 Test email:', testEmail);
    
    const signupResult = await supabase.auth.signUp({
      email: testEmail,
      password: '123456'
    });
    console.error('📝 Signup result:', {
      success: !signupResult.error,
      error: signupResult.error?.message,
      user: signupResult.data?.user?.email
    });
    
    if (!signupResult.error && signupResult.data?.session) {
      console.error('✅ Signup bem-sucedido!');
      console.error('🎫 Access token:', signupResult.data.session.access_token ? 'Present' : 'Missing');
    }
  });
}); 