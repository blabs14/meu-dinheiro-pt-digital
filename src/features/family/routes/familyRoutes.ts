import { Router } from 'express';
import { withETagCache } from '@/utils/etagCache';
import { requireRole } from '@/middleware/roleAuth';
import { asyncHandler } from '@/utils/asyncHandler';

export function createFamilyRoutes(familyService, jwtAuth) {
  const router = Router();
  // NÃO usar router.use(jwtAuth) aqui!

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
  router.get('/', withETagCache(), asyncHandler(async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const { data, error } = await familyService.fetchFamilies(userId);
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.json({ success: true, data: data ?? [] });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }));

  // GET /family/:id
  router.get('/:id', asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { data, error } = await familyService.fetchFamilyById(id);
    if (error || !data) {
      console.log('[FAMILY ROUTES] GET /family/:id erro:', error);
      return res.status(404).json({ success: false, error: error?.message || 'Família não encontrada' });
    }
    res.json({ success: true, data });
  }));

  // POST /family
  router.post('/', asyncHandler(async (req, res) => {
    try {
      const { data, error } = await familyService.createFamily(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.set('Cache-Control', 'no-store');
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }));

  // PUT /family/:id
  router.put('/:id', asyncHandler(async (req, res) => {
    const { data, error } = await familyService.updateFamily(req.params.id, req.body);
    if (error) {
      console.log('[FAMILY ROUTES] PUT /family/:id erro:', error);
      return res.status(400).json({ success: false, error: error.message });
    }
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data });
  }));

  // DELETE /family/:familyId/member/:userId
  router.delete('/:familyId/member/:userId', asyncHandler(async (req, res) => {
    const { data, error } = await familyService.removeMember(req.params.familyId, req.params.userId);
    if (error) {
      console.log('[FAMILY ROUTES] DELETE /family/:familyId/member/:userId erro:', error);
      return res.status(400).json({ success: false, error: error.message });
    }
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data });
  }));

  // POST /family/:familyId/transfer-ownership
  router.post('/:familyId/transfer-ownership', requireRole(['owner']), asyncHandler(async (req, res) => {
    const { familyId } = req.params;
    const { newOwnerId } = req.body;
    const { data, error } = await familyService.transferOwnership(familyId, newOwnerId);
    if (error) {
      console.log('[FAMILY ROUTES] POST /family/:familyId/transfer-ownership erro:', error);
      return res.status(400).json({ success: false, error });
    }
    res.json({ success: true, data });
  }));

  return router;
} 