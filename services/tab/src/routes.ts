import { Router } from 'express';
import { z } from 'zod';
import { authenticate, validate } from '@speakeasy/middleware';
import {
  handleGetTabs,
  handleCreateTab,
  handleGetTab,
  handleUpdateTab,
  handleAddItem,
  handleUpdateItem,
  handleAddMember,
  handleRemoveMember,
  handleUpdateMemberItems,
  handleRecordSettlement,
  handleCloseTab,
} from './controller';

export const createTabSchema = z.object({
  title: z.string().min(1),
  venue: z.string(),
  currency: z.object({ code: z.string(), name: z.string() }),
  notes: z.string().optional(),
  members: z.array(z.object({ userId: z.string().min(1) })),
  menuItems: z.array(z.object({ name: z.string().min(1), price: z.number() })),
});

export const updateTabSchema = z.object({
  menuItems: z.array(z.object({ name: z.string().min(1), price: z.number() })),
});

export const updateMemberItemsSchema = z.object({
  items: z.array(z.object({ menuItemId: z.string().min(1), quantity: z.number().int().positive() })),
});

const router = Router();

router.use(authenticate);

router.get('/', handleGetTabs);
router.post('/', validate(createTabSchema), handleCreateTab);
router.get('/:id', handleGetTab);
router.patch('/:id', validate(updateTabSchema), handleUpdateTab);
router.post('/:id/items', handleAddItem);
router.patch('/:id/items/:itemId', handleUpdateItem);
router.post('/:id/members', handleAddMember);
router.delete('/:id/members/:userId', handleRemoveMember);
router.patch('/:id/members/:userId/items', validate(updateMemberItemsSchema), handleUpdateMemberItems);
router.post('/:id/settle', handleRecordSettlement);
router.post('/:id/close', handleCloseTab);

export default router;
