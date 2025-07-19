import { Router } from 'express';
import { userController } from '@/modules/user/user.controller';

const router = Router();

router.post('/', userController.create);
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.delete('/:id', userController.delete);

export const userRoutes = router;