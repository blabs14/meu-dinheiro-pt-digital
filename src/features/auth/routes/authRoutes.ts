import { Router } from 'express';
import { signup, login, logout, getSession } from '../services/authService';
import { refreshToken } from '../controllers/AuthController';

const router = Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Regista um novo utilizador
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - nome
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               nome:
 *                 type: string
 *     responses:
 *       200:
 *         description: Utilizador registado com sucesso
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/signup', async (req, res) => {
  const { data, error } = await signup(req.body);
  if (error) return res.status(400).json({ success: false, data: null, error });
  res.json({ success: true, data, error: null });
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Autentica um utilizador
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     details:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/login', async (req, res) => {
  const { data, error } = await login(req.body);
  if (error) return res.status(400).json({ success: false, data: null, error });
  res.json({ success: true, data, error: null });
});

router.post('/logout', async (req, res) => {
  const { error } = await logout();
  if (error) return res.status(400).json({ success: false, error });
  res.json({ success: true });
});

router.get('/session', async (req, res) => {
  const { data, error } = await getSession();
  if (error) return res.status(400).json({ success: false, error });
  res.json({ success: true, data });
});

router.post('/refresh', refreshToken);

export default router; 