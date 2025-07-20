import { Router } from 'express';
import { chairController } from '@/modules/chair/chair.controller';
import { authenticateJWT } from '@/middleware/authMiddleware';
import { isAdmin } from '@/middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT, isAdmin);

router.post('/', chairController.create);
router.get('/', chairController.getAll);
router.get('/:id', chairController.getById);
router.patch('/:id', chairController.update);
router.delete('/:id', chairController.delete);

export const chairRoutes = router;
