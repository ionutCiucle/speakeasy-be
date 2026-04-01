import { Router } from 'express';
import { z } from 'zod';
import { authenticate, validate } from '@speakeasy/middleware';
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

export const createTabSchema = z.object({
  title: z.string().min(1),
  venue: z.string(),
  currency: z.object({ code: z.string(), name: z.string() }),
  notes: z.string().optional(),
  members: z.array(z.object({ name: z.string() })),
  menuItems: z.array(z.object({ name: z.string(), price: z.number() })),
});

const router = Router();

router.use(authenticate);

router.get('/', handleGetTabs);
router.post('/', validate(createTabSchema), handleCreateTab);
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
