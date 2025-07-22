import request from 'supertest';
import app from '../../index';

describe('Integração: autenticação e permissões', () => {
  let accessToken = '';
  let testEmail = `perm_test_${Date.now()}@example.com`;
  let testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Registar utilizador de teste
    await request(app)
      .post('/auth/signup')
      .send({ email: testEmail, password: testPassword, nome: 'Perm Test User' });
    // Fazer login para obter token
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    accessToken = loginRes.body?.data?.access_token;
  });

  it('deve rejeitar acesso sem token', async () => {
    const res = await request(app)
      .get('/transactions');
    expect(res.status).toBe(401);
  });

  it('deve rejeitar acesso com token inválido', async () => {
    const res = await request(app)
      .get('/transactions')
      .set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  it('deve permitir acesso com token válido', async () => {
    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${accessToken}`);
    // Espera 200 ou 403/404 se não houver dados, mas nunca 401
    expect([200, 403, 404]).toContain(res.status);
  });
}); 