import { Router } from 'express';
import { withETagCache } from '@/utils/etagCache';
import { asyncHandler } from '@/utils/asyncHandler';

export function createGoalsRoutes(goalService, jwtAuth) {
  const router = Router();
  router.use(jwtAuth);

  /**
   * @swagger
   * /goals:
   *   get:
   *     summary: Lista metas do utilizador
   *     tags: [Goals]
   *     parameters:
   *       - in: query
   *         name: accountId
   *         schema:
   *           type: string
   *         description: Filtrar por conta bancária
   *       - in: query
   *         name: familyId
   *         schema:
   *           type: string
   *         description: Filtrar por família
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filtrar por status
   *     responses:
   *       200:
   *         description: Lista de metas
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *       401:
   *         description: Não autorizado
   *
   *   post:
   *     summary: Cria uma nova meta
   *     tags: [Goals]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - nome
   *               - valor_objetivo
   *               - valor_atual
   *               - data_limite
   *               - account_id
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *               nome:
   *                 type: string
   *               valor_objetivo:
   *                 type: number
   *               valor_atual:
   *                 type: number
   *               data_limite:
   *                 type: string
   *                 format: date
   *               descricao:
   *                 type: string
   *               account_id:
   *                 type: string
   *                 format: uuid
   *               family_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       201:
   *         description: Meta criada com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   *
   * /goals/{id}/progress:
   *   put:
   *     summary: Atualiza o progresso de uma meta
   *     tags: [Goals]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID da meta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - valor_atual
   *             properties:
   *               valor_atual:
   *                 type: number
   *     responses:
   *       200:
   *         description: Progresso atualizado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *       400:
   *         description: Dados inválidos
   *       401:
   *         description: Não autorizado
   *
   * /goals/{id}:
   *   delete:
   *     summary: Remove uma meta
   *     tags: [Goals]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: ID da meta
   *     responses:
   *       200:
   *         description: Meta removida
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *       401:
   *         description: Não autorizado
   */
  // GET /goals
  router.get('/', withETagCache(), asyncHandler(async (req, res) => {
    const filters = {
      userId: req.query.userId,
      familyId: req.query.familyId,
      accountId: req.query.accountId,
      status: req.query.status
    };
    const { data, error } = await goalService.fetchGoals(filters);
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, data: data ?? [] });
  }));

  // POST /goals
  router.post('/', asyncHandler(async (req, res) => {
    const { data, error } = await goalService.createGoal(req.body);
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.set('Cache-Control', 'no-store');
    res.status(201).json({ success: true, data });
  }));

  // GET /goals/:id
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await goalService.fetchGoalById(id);
    if (error || !data) return res.status(404).json({ success: false, error: error?.message || 'Meta não encontrada' });
    res.json({ success: true, data });
  }));

  // PUT /goals/:id/progress
  router.put('/:id/progress', asyncHandler(async (req, res) => {
    const { data, error } = await goalService.updateGoalProgress(req.params.id, req.body.valorAtual);
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data });
  }));

  // DELETE /goals/:id
  router.delete('/:id', asyncHandler(async (req, res) => {
    const { data, error } = await goalService.deleteGoal(req.params.id);
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data });
  }));

  return router;
} 