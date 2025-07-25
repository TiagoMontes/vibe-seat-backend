import { Router } from 'express';
import { roleController } from '@/modules/role/role.controller';

const router = Router();

router.post('/', roleController.create);
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.patch('/:id', roleController.update);
router.delete('/:id', roleController.delete);

export const roleRoutes = router;
