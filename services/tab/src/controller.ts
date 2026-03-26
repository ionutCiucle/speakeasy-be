import { Response } from 'express';
import { AuthRequest } from '@speakeasy/middleware';
import {
  CreateTabBody,
  AddItemBody,
  UpdateItemBody,
  AddParticipantBody,
  RecordSettlementBody,
} from './types';
import {
  createTab,
  findTabById,
  addItem,
  findItemById,
  updateItem,
  addParticipant,
  recordSettlement,
  closeTab,
} from './store';

type TabRequest = AuthRequest & { params: { id: string } };
type ItemRequest = AuthRequest & { params: { id: string; itemId: string } };

export const handleCreateTab = async (
  req: AuthRequest & { body: CreateTabBody },
  res: Response,
): Promise<void> => {
  const tab = await createTab(req.body.title, req.user!.userId);
  res.status(201).json(tab);
};

export const handleGetTab = async (req: TabRequest, res: Response): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) { res.status(404).json({ message: 'Tab not found' }); return; }
  res.json(tab);
};

export const handleAddItem = async (
  req: TabRequest & { body: AddItemBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) { res.status(404).json({ message: 'Tab not found' }); return; }

  const item = await addItem(tab.id, req.body.label, req.body.amount, req.body.paidById);
  res.status(201).json(item);
};

export const handleUpdateItem = async (
  req: ItemRequest & { body: UpdateItemBody },
  res: Response,
): Promise<void> => {
  const item = await findItemById(req.params.itemId);
  if (!item || item.tabId !== req.params.id) {
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  res.json(await updateItem(item.id, req.body));
};

export const handleAddParticipant = async (
  req: TabRequest & { body: AddParticipantBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) { res.status(404).json({ message: 'Tab not found' }); return; }

  const participant = await addParticipant(tab.id, req.body.userId);
  res.status(201).json(participant);
};

export const handleRecordSettlement = async (
  req: TabRequest & { body: RecordSettlementBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) { res.status(404).json({ message: 'Tab not found' }); return; }

  const settlement = await recordSettlement(tab.id, req.body.payerId, req.body.payeeId, req.body.amount);
  res.status(201).json(settlement);
};

export const handleCloseTab = async (req: TabRequest, res: Response): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) { res.status(404).json({ message: 'Tab not found' }); return; }

  if (tab.createdById !== req.user!.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json(await closeTab(tab.id));
};
