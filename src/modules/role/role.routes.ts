import { Router } from 'express';
import { roleController } from '@/modules/role/role.controller';

const router = Router();

router.post('/', roleController.create);
router.get('/', roleController.getAll);
router.get('/:id', roleController.getById);
router.delete('/:id', roleController.delete);

export const roleRoutes = router;
