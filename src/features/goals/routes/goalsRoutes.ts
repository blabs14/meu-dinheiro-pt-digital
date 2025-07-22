import { Router } from 'express';
import { jwtAuth } from '@/features/auth/middleware/jwtAuth';
import { withETagCache } from '@/utils/etagCache';
import { fetchGoals, createGoal, updateGoalProgress, deleteGoal } from '../services/goalService';

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
router.get('/', withETagCache(), async (req, res) => {
  const filters = {
    userId: req.query.userId,
    familyId: req.query.familyId,
    accountId: req.query.accountId,
    status: req.query.status
  };
  const { data, error } = await fetchGoals(filters);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /goals
router.post('/', async (req, res) => {
  const { data, error } = await createGoal(req.body);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

// PUT /goals/:id/progress
router.put('/:id/progress', async (req, res) => {
  const { data, error } = await updateGoalProgress(req.params.id, req.body.valorAtual);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

// DELETE /goals/:id
router.delete('/:id', async (req, res) => {
  const { data, error } = await deleteGoal(req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

export default router; 