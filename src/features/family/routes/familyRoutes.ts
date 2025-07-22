import { Router } from 'express';
import { jwtAuth } from '@/features/auth/middleware/jwtAuth';
import { withETagCache } from '@/utils/etagCache';
import { fetchFamilies, createFamily, updateFamily, removeMember, transferOwnership } from '../services/familyService';
import { requireRole } from '@/middleware/roleAuth';

const router = Router();

router.use(jwtAuth);

/**
 * @swagger
 * /family:
 *   get:
 *     summary: Lista famílias do utilizador
 *     tags: [Family]
 *     responses:
 *       200:
 *         description: Lista de famílias
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
 *     summary: Cria uma nova família
 *     tags: [Family]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - created_by
 *             properties:
 *               nome:
 *                 type: string
 *               created_by:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Família criada com sucesso
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
 * /family/{id}:
 *   put:
 *     summary: Atualiza dados da família
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da família
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Família atualizada
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
 * /family/{familyId}/member/{userId}:
 *   delete:
 *     summary: Remove um membro da família
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: familyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da família
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do utilizador
 *     responses:
 *       200:
 *         description: Membro removido
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
 * /family/{familyId}/transfer-ownership:
 *   post:
 *     summary: Transfere a propriedade da família
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: familyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da família
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newOwnerId
 *             properties:
 *               newOwnerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Propriedade transferida
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
// GET /family
router.get('/', withETagCache(), async (req, res) => {
  const userId = req.query.userId as string;
  const { data, error } = await fetchFamilies(userId);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// POST /family
router.post('/', async (req, res) => {
  const { data, error } = await createFamily(req.body);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

// PUT /family/:id
router.put('/:id', async (req, res) => {
  const { data, error } = await updateFamily(req.params.id, req.body);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

// DELETE /family/:familyId/member/:userId
router.delete('/:familyId/member/:userId', async (req, res) => {
  const { data, error } = await removeMember(req.params.familyId, req.params.userId);
  if (error) return res.status(400).json({ error: error.message });
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

// POST /family/:familyId/transfer-ownership
router.post('/:familyId/transfer-ownership', requireRole(['owner']), async (req, res) => {
  const { familyId } = req.params;
  const { newOwnerId } = req.body;
  const { data, error } = await transferOwnership(familyId, newOwnerId);
  if (error) return res.status(400).json({ success: false, error });
  res.json({ success: true, data });
});

export default router; 