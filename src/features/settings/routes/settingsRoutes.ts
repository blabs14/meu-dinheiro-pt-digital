import { Router } from 'express';
import { jwtAuth } from '@/features/auth/middleware/jwtAuth';
import { withETagCache } from '@/utils/etagCache';
// import { fetchSettings, updateSettings } from '../services/settingsService';

const router = Router();

router.use(jwtAuth);

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Obtém as definições do utilizador
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Definições do utilizador
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
 *
 *   post:
 *     summary: Atualiza as definições do utilizador
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificacoes:
 *                 type: boolean
 *               tema:
 *                 type: string
 *                 enum: [claro, escuro, sistema]
 *     responses:
 *       200:
 *         description: Definições atualizadas
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
// GET /settings
router.get('/', withETagCache(), async (req, res) => {
  // Exemplo: fetchSettings pode ser implementado depois
  // const { data, error } = await fetchSettings(req.query.userId);
  // if (error) return res.status(400).json({ error: error.message });
  // res.json(data);
  res.json({ message: 'Endpoint de settings em construção.' });
});

// POST /settings (exemplo de endpoint de escrita)
router.post('/', async (req, res) => {
  // const { data, error } = await updateSettings(req.body);
  // if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json({ message: 'Endpoint de update de settings em construção.' });
});

export default router; 