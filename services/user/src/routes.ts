import { Router } from 'express';
import { authenticate } from '@speakeasy/middleware';
import { getMe, updateMe, getUserById } from './controller';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.get('/:id', authenticate, getUserById);

export default router;
