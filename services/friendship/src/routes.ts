import { Router } from 'express';
import { authenticate } from '@speakeasy/middleware';
import { sendRequest, acceptRequest, rejectRequest, blockUser, getFriends } from './controller';

const router = Router();

router.use(authenticate);

router.post('/request', sendRequest);
router.patch('/:id/accept', acceptRequest);
router.patch('/:id/reject', rejectRequest);
router.patch('/:id/block', blockUser);
router.get('/', getFriends);

export default router;
