import { Router } from 'express';
import { JobController } from '../controllers/jobController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', JobController.list);
router.get('/:id', JobController.getById);
router.post('/', authMiddleware, requireRole('employer', 'admin'), JobController.create);
router.put('/:id', authMiddleware, requireRole('employer', 'admin'), JobController.update);
router.delete('/:id', authMiddleware, requireRole('employer', 'admin'), JobController.delete);

export default router;
