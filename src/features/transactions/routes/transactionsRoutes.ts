import { Router } from 'express';
import { withETagCache } from '@/utils/etagCache';
import { asyncHandler } from '@/utils/asyncHandler';

export function createTransactionsRoutes(transactionService, jwtAuth) {
  const router = Router();
  router.use(jwtAuth);

  // GET /transactions
  router.get('/', withETagCache(), asyncHandler(async (req, res) => {
    const filters = {
      userId: req.query.userId,
      familyId: req.query.familyId,
      accountId: req.query.accountId,
      month: req.query.month
    };
    const { data, error } = await transactionService.fetchTransactions(filters);
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.json({ success: true, data: data ?? [] });
  }));

  // POST /transactions
  router.post('/', asyncHandler(async (req, res) => {
    const { data, error } = await transactionService.createTransaction(req.body);
    if (error) return res.status(400).json({ success: false, error: error.message });
    res.set('Cache-Control', 'no-store');
    res.status(201).json({ success: true, data });
  }));

  // (Poderão ser adicionados outros endpoints, como update/delete, conforme necessário)

  return router;
} 