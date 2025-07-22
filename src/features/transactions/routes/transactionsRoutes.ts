import { Router } from 'express';
import { jwtAuth } from '@/features/auth/middleware/jwtAuth';
import { withETagCache } from '@/utils/etagCache';
import { fetchTransactions, createTransaction } from '../services/transactionService';

const router = Router();

router.use(jwtAuth);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Lista transações do utilizador
 *     tags: [Transactions]
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
 *         name: month
 *         schema:
 *           type: string
 *         description: Filtrar por mês (YYYY-MM)
 *     responses:
 *       200:
 *         description: Lista de transações
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
 *     summary: Cria uma nova transação
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - valor
 *               - tipo
 *               - categoria_id
 *               - data
 *               - account_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               valor:
 *                 type: number
 *               tipo:
 *                 type: string
 *                 enum: [receita, despesa]
 *               categoria_id:
 *                 type: string
 *                 format: uuid
 *               data:
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
 *         description: Transação criada com sucesso
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
 */
// GET /transactions
router.get('/', withETagCache(), async (req, res) => {
  // Exemplo: filtros via query params
  const filters = {
    userId: req.query.userId,
    familyId: req.query.familyId,
    accountId: req.query.accountId,
    month: req.query.month
  };
  const { data, error } = await fetchTransactions(filters);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /transactions
router.post('/', async (req, res) => {
  const { data, error } = await createTransaction(req.body);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

export default router; 