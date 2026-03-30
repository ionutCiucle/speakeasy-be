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
import { publish } from './publisher';
import { logger } from './logger';

type TabRequest = AuthRequest & { params: { id: string } };
type ItemRequest = AuthRequest & { params: { id: string; itemId: string } };

export const handleCreateTab = async (
  req: AuthRequest & { body: CreateTabBody },
  res: Response,
): Promise<void> => {
  const tab = await createTab(req.body.title, req.user!.userId);
  logger.info({ tabId: tab.id, userId: req.user!.userId }, 'handleCreateTab: tab created');
  res.status(201).json(tab);
};

export const handleGetTab = async (req: TabRequest, res: Response): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleGetTab: not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }
  res.json(tab);
};

export const handleAddItem = async (
  req: TabRequest & { body: AddItemBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleAddItem: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const item = await addItem(tab.id, req.body.label, req.body.amount, req.body.paidById);
  logger.info({ tabId: tab.id, itemId: item.id }, 'handleAddItem: item added');
  res.status(201).json(item);
};

export const handleUpdateItem = async (
  req: ItemRequest & { body: UpdateItemBody },
  res: Response,
): Promise<void> => {
  const item = await findItemById(req.params.itemId);
  if (!item || item.tabId !== req.params.id) {
    logger.warn({ tabId: req.params.id, itemId: req.params.itemId }, 'handleUpdateItem: not found');
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  logger.info({ itemId: item.id }, 'handleUpdateItem: item updated');
  res.json(await updateItem(item.id, req.body));
};

export const handleAddParticipant = async (
  req: TabRequest & { body: AddParticipantBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleAddParticipant: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const participant = await addParticipant(tab.id, req.body.userId);
  logger.info({ tabId: tab.id, userId: participant.userId }, 'handleAddParticipant: participant added');
  void publish('tab.invite_sent', { tabId: tab.id, invitedUserId: participant.userId, invitedById: req.user!.userId });
  res.status(201).json(participant);
};

export const handleRecordSettlement = async (
  req: TabRequest & { body: RecordSettlementBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleRecordSettlement: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const settlement = await recordSettlement(tab.id, req.body.payerId, req.body.payeeId, req.body.amount);
  logger.info({ tabId: tab.id, settlementId: settlement.id }, 'handleRecordSettlement: settlement recorded');
  const participantIds = tab.participants.map((p) => p.userId);
  void publish('tab.settled', { tabId: tab.id, settlementId: settlement.id, payerId: settlement.payerId, payeeId: settlement.payeeId, participantIds });
  res.status(201).json(settlement);
};

export const handleCloseTab = async (req: TabRequest, res: Response): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleCloseTab: not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  if (tab.createdById !== req.user!.userId) {
    logger.warn({ tabId: tab.id, userId: req.user!.userId }, 'handleCloseTab: forbidden');
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  logger.info({ tabId: tab.id }, 'handleCloseTab: tab closed');
  res.json(await closeTab(tab.id));
};
