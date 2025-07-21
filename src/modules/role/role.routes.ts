import { Router } from 'express';
import { roleController } from '@/modules/role/role.controller';
import { authenticateJWT, isAdmin } from '@/middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT, isAdmin);

router.post('/', roleController.create);
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.delete('/:id', roleController.delete);

export const roleRoutes = router;
