import { Router } from 'express';
import { authenticate } from '@speakeasy/middleware';
import {
  handleGetTabs,
  handleCreateTab,
  handleGetTab,
  handleAddItem,
  handleUpdateItem,
  handleAddParticipant,
  handleAddMember,
  handleRemoveMember,
  handleAddMenuItem,
  handleUpdateMenuItem,
  handleRemoveMenuItem,
  handleRecordSettlement,
  handleCloseTab,
} from './controller';

const router = Router();

router.use(authenticate);

router.get('/', handleGetTabs);
router.post('/', handleCreateTab);
router.get('/:id', handleGetTab);
router.post('/:id/items', handleAddItem);
router.patch('/:id/items/:itemId', handleUpdateItem);
router.post('/:id/participants', handleAddParticipant);
router.post('/:id/members', handleAddMember);
router.delete('/:id/members/:memberId', handleRemoveMember);
router.post('/:id/menu-items', handleAddMenuItem);
router.patch('/:id/menu-items/:menuItemId', handleUpdateMenuItem);
router.delete('/:id/menu-items/:menuItemId', handleRemoveMenuItem);
router.post('/:id/settle', handleRecordSettlement);
router.post('/:id/close', handleCloseTab);

export default router;
