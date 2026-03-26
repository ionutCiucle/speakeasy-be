import { Router } from 'express';
import { authenticate } from '@speakeasy/middleware';
import {
  handleCreateTab,
  handleGetTab,
  handleAddItem,
  handleUpdateItem,
  handleAddParticipant,
  handleRecordSettlement,
  handleCloseTab,
} from './controller';

const router = Router();

router.use(authenticate);

router.post('/', handleCreateTab);
router.get('/:id', handleGetTab);
router.post('/:id/items', handleAddItem);
router.patch('/:id/items/:itemId', handleUpdateItem);
router.post('/:id/participants', handleAddParticipant);
router.post('/:id/settle', handleRecordSettlement);
router.post('/:id/close', handleCloseTab);

export default router;
