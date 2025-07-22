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

  // GET /transactions/:id
  router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await transactionService.fetchTransactionById(id);
    if (error || !data) return res.status(404).json({ success: false, error: error?.message || 'Transação não encontrada' });
    res.json({ success: true, data });
  }));

  // PUT /transactions/:id
  router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await transactionService.updateTransaction(id, req.body);
    if (error || !data) return res.status(404).json({ success: false, error: error?.message || 'Transação não encontrada' });
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, data });
  }));

  // (Poderão ser adicionados outros endpoints, como update/delete, conforme necessário)

  return router;
} 