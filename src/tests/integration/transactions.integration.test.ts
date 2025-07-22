import request from 'supertest';
import { createApp } from '../../appFactory';
import { makeTransactionService } from '../../features/transactions/services/transactionService';
import { createTransactionsRoutes } from '../../features/transactions/routes/transactionsRoutes';
import { makeJwtAuth } from '../../features/auth/middleware/jwtAuth';
import { supabaseMock } from '../../../test-utils/supabaseMockUtil.js';
import { Router } from 'express';

let accessToken = 'validtoken';
let testUserId = '11111111-1111-1111-1111-111111111111';
let createdTransactionId = '';

// Router de autenticação mockado (mínimo)
const mockAuthRouter = Router();
mockAuthRouter.post('/signup', (req, res) => res.status(200).json({ success: true, data: { user: { id: testUserId, email: req.body.email } } }));
mockAuthRouter.post('/login', (req, res) => res.status(200).json({ success: true, data: { access_token: accessToken, user: { id: testUserId } } }));

const transactionService = makeTransactionService(supabaseMock);
const jwtAuth = makeJwtAuth(supabaseMock);
const transactionsRouter = createTransactionsRoutes(transactionService, jwtAuth);
const app = createApp({ authRoutes: mockAuthRouter });
app.use('/transactions', transactionsRouter);

describe('Integração: /transactions', () => {
  it('deve rejeitar acesso sem token', async () => {
    const res = await request(app).get('/transactions');
    expect([401, 403]).toContain(res.status);
  });

  it('deve rejeitar acesso com token inválido', async () => {
    const res = await request(app).get('/transactions').set('Authorization', 'Bearer invalidtoken');
    expect([401, 403]).toContain(res.status);
  });

  it('deve listar transações (mesmo que vazio)', async () => {
    const res = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.headers).toHaveProperty('etag');
    if (res.headers['cache-control']) {
      expect(res.headers['cache-control']).toMatch(/public/);
    }
  });

  it('deve rejeitar criação de transação inválida', async () => {
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valor: -10 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('deve criar uma transação pessoal válida', async () => {
    const payload = {
      valor: 100.50,
      tipo: 'receita',
      categoria_id: '11111111-1111-1111-1111-111111111111',
      data: new Date().toISOString().split('T')[0],
      descricao: 'Teste de transação pessoal',
      user_id: testUserId,
      account_id: '11111111-1111-1111-1111-111111111111'
    };
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    createdTransactionId = res.body.data[0]?.id || res.body.data.id;
    if (res.headers['cache-control']) {
      expect(res.headers['cache-control']).toMatch(/no-store/);
    }
  });

  it('deve criar uma transação familiar válida', async () => {
    const payload = {
      valor: 75.25,
      tipo: 'despesa',
      categoria_id: '22222222-2222-2222-2222-222222222222',
      data: new Date().toISOString().split('T')[0],
      descricao: 'Teste de transação familiar',
      user_id: testUserId,
      account_id: '11111111-1111-1111-1111-111111111111',
      family_id: '33333333-3333-3333-3333-333333333333'
    };
    const res = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('deve atualizar transação criada', async () => {
    if (!createdTransactionId) {
      console.warn('ID da transação não disponível, pulando teste');
      return;
    }
    const res = await request(app)
      .put(`/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ 
        valor: 150.75,
        descricao: 'Transação atualizada'
      });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('deve obter detalhes da transação criada', async () => {
    if (!createdTransactionId) {
      console.warn('ID da transação não disponível, pulando teste');
      return;
    }
    const res = await request(app)
      .get(`/transactions/${createdTransactionId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('deve filtrar transações por período', async () => {
    const res = await request(app)
      .get('/transactions')
      .query({ 
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      })
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
}); 