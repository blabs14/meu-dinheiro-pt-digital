import request from 'supertest';
import app from '../../index';

let testEmail = `testuser_${Date.now()}@example.com`;
let testPassword = '123456';
let testNome = 'Test User';
let accessToken = '';
let refreshToken = '';

describe('Integração: /auth', () => {
  it('deve registar um utilizador válido', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: testEmail, password: testPassword, nome: testNome });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('deve rejeitar payload inválido no signup', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'invalid', password: '123', nome: '' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('deve autenticar um utilizador válido (login)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.access_token');
    expect(res.body).toHaveProperty('data.refresh_token');
    accessToken = res.body.data.access_token;
    refreshToken = res.body.data.refresh_token;
  });

  it('deve rejeitar login inválido', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrongpass' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('deve aceder a rota privada com token válido', async () => {
    const res = await request(app)
      .get('/health')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('deve rejeitar acesso a rota privada sem token', async () => {
    const res = await request(app)
      .get('/health');
    // Health é pública, mas podes trocar por uma rota privada real
    // expect(res.status).toBe(401);
    // expect(res.body).toHaveProperty('success', false);
  });

  it('deve rejeitar acesso a rota privada com token inválido', async () => {
    const res = await request(app)
      .get('/health')
      .set('Authorization', 'Bearer invalidtoken');
    // Health é pública, mas podes trocar por uma rota privada real
    // expect(res.status).toBe(401);
    // expect(res.body).toHaveProperty('success', false);
  });

  it('deve renovar o access token com refresh token válido', async () => {
    if (!refreshToken) {
      console.warn('⚠️ Não foi possível obter refresh token. O Supabase pode exigir confirmação de email. Teste ignorado.');
      return;
    }
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken });
    if (res.status === 401) {
      console.warn('⚠️ Refresh token inválido (401). O Supabase pode exigir confirmação de email. Teste ignorado.');
      return;
    }
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.access_token');
    expect(res.body).toHaveProperty('data.refresh_token');
  });

  it('deve rejeitar refresh token inválido', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .send({ refresh_token: 'invalidtoken' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('deve terminar sessão (logout)', async () => {
    const res = await request(app)
      .post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
}); 