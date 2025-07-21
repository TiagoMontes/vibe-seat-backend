import { Router } from 'express';
import { userController } from '@/modules/user/user.controller';
import { authenticateJWT } from '@/middleware/authMiddleware';

const router = Router();

router.post('/', userController.create);

router.use(authenticateJWT);
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.delete('/:id', userController.delete);

export const userRoutes = router;
