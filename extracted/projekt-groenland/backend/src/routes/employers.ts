import { Router } from 'express';
import { EmployerModel } from '../models/employer';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res) => {
  const employers = await EmployerModel.findAll(req.tenantId!);
  res.json({ data: employers });
});

router.get('/:id', async (req, res) => {
  const employer = await EmployerModel.findById(parseInt(req.params.id), req.tenantId!);
  if (!employer) return res.status(404).json({ error: 'Not found' });
  res.json({ data: employer });
});

router.post('/', authMiddleware, async (req, res) => {
  const employer = await EmployerModel.create({ ...req.body, tenant_id: req.tenantId });
  res.status(201).json({ data: employer });
});

export default router;
