import { Router } from 'express';
import { userController } from './user.controller';

const router = Router();

router.post('/', userController.create);
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.delete('/:id', userController.delete);

export const userRoutes = router;