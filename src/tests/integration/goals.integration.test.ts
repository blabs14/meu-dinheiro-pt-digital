import request from 'supertest';
import { createApp } from '../../appFactory';
import { makeGoalService } from '../../features/goals/services/goalService';
import { createGoalsRoutes } from '../../features/goals/routes/goalsRoutes';
import { makeJwtAuth } from '../../features/auth/middleware/jwtAuth';
import { supabaseMock } from '../../../test-utils/supabaseMockUtil.js';
import { Router } from 'express';

let accessToken = 'validtoken';
let testUserId = '11111111-1111-1111-1111-111111111111';
let createdGoalId = '';

// Router de autenticação mockado (mínimo)
const mockAuthRouter = Router();
mockAuthRouter.post('/signup', (req, res) => res.status(200).json({ success: true, data: { user: { id: testUserId, email: req.body.email } } }));
mockAuthRouter.post('/login', (req, res) => res.status(200).json({ success: true, data: { access_token: accessToken, user: { id: testUserId } } }));

const goalService = makeGoalService(supabaseMock);
const jwtAuth = makeJwtAuth(supabaseMock);
const goalsRouter = createGoalsRoutes(goalService, jwtAuth);
const app = createApp({ authRoutes: mockAuthRouter });
app.use('/goals', goalsRouter);

describe('Integração: /goals', () => {
  it('deve rejeitar acesso sem token', async () => {
    const res = await request(app).get('/goals');
    expect([401, 403]).toContain(res.status);
  });

  it('deve rejeitar acesso com token inválido', async () => {
    const res = await request(app).get('/goals').set('Authorization', 'Bearer invalidtoken');
    expect([401, 403]).toContain(res.status);
  });

  it('deve listar metas (mesmo que vazio)', async () => {
    const res = await request(app)
      .get('/goals')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('deve rejeitar criação de meta inválida', async () => {
    const res = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ nome: '', valor_objetivo: -100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  it('deve criar uma meta pessoal válida', async () => {
    const payload = {
      nome: 'Meta Pessoal Teste',
      valor_objetivo: 1000,
      valor_atual: 0,
      user_id: testUserId,
      tipo: 'pessoal',
      data_objetivo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const res = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    createdGoalId = res.body.data[0]?.id || res.body.data.id;
  });

  it('deve criar uma meta familiar válida', async () => {
    const payload = {
      nome: 'Meta Familiar Teste',
      valor_objetivo: 5000,
      valor_atual: 0,
      user_id: testUserId,
      tipo: 'familiar',
      family_id: '33333333-3333-3333-3333-333333333333',
      data_objetivo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    const res = await request(app)
      .post('/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('deve atualizar progresso da meta', async () => {
    if (!createdGoalId) {
      console.warn('ID da meta não disponível, pulando teste');
      return;
    }
    const res = await request(app)
      .put(`/goals/${createdGoalId}/progress`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valor_atual: 500 });
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });

  it('deve obter detalhes da meta criada', async () => {
    if (!createdGoalId) {
      console.warn('ID da meta não disponível, pulando teste');
      return;
    }
    const res = await request(app)
      .get(`/goals/${createdGoalId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
  });
}); 