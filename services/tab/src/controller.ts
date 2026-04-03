import { Response } from 'express';
import { AuthRequest } from '@speakeasy/middleware';
import {
  CreateTabBody,
  AddItemsBody,
  AddMemberBody,
  UpdateTabBody,
  UpdateMemberItemsBody,
  RecordSettlementBody,
} from './types';
import {
  createTab,
  findAllTabs,
  findTabById,
  addItems,
  findItemById,
  removeItem,
  addMember,
  findMemberById,
  removeMember,
  updateTabMenuItems,
  updateMemberItems,
  recordSettlement,
  closeTab,
} from './store';
import { publish } from './publisher';
import { logger } from './logger';

type TabRequest = AuthRequest & { params: { id: string } };
type ItemRequest = AuthRequest & { params: { id: string; itemId: string } };
type MemberRequest = AuthRequest & { params: { id: string; userId: string } };

export const handleGetTabs = async (_req: AuthRequest, res: Response): Promise<void> => {
  const tabs = await findAllTabs();
  res.json(tabs);
};

export const handleCreateTab = async (
  req: AuthRequest & { body: CreateTabBody },
  res: Response,
): Promise<void> => {
  const { title, venue, currency, notes, members, menuItems } = req.body;
  const tab = await createTab(req.user!.userId, {
    title,
    venue,
    currencyCode: currency.code,
    currencyName: currency.name,
    notes,
    members,
    menuItems,
  });
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

export const handleUpdateTab = async (
  req: TabRequest & { body: UpdateTabBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleUpdateTab: not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const names = req.body.menuItems.map((item: { name: string; price: number }) => item.name);
  if (new Set(names).size !== names.length) {
    logger.warn({ tabId: req.params.id }, 'handleUpdateTab: duplicate menu item names');
    res.status(400).json({ message: 'Duplicate menu item names are not allowed' });
    return;
  }

  logger.info({ tabId: tab.id }, 'handleUpdateTab: menu items updated');
  res.json(await updateTabMenuItems(tab.id, req.user!.userId, req.body.menuItems));
};

export const handleAddItem = async (
  req: TabRequest & { body: AddItemsBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleAddItem: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const items = await addItems(tab.id, req.body.items);
  logger.info({ tabId: tab.id, count: items.length }, 'handleAddItem: items added');
  res.status(201).json(items);
};

export const handleRemoveItem = async (req: ItemRequest, res: Response): Promise<void> => {
  const item = await findItemById(req.params.itemId);
  if (!item || item.tabId !== req.params.id) {
    logger.warn({ tabId: req.params.id, itemId: req.params.itemId }, 'handleRemoveItem: not found');
    res.status(404).json({ message: 'Item not found' });
    return;
  }

  await removeItem(item.id);
  logger.info({ tabId: req.params.id, itemId: item.id }, 'handleRemoveItem: item removed');
  res.status(204).send();
};

export const handleAddMember = async (
  req: TabRequest & { body: AddMemberBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleAddMember: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const member = await addMember(tab.id, req.body.userId);
  logger.info({ tabId: tab.id, userId: member.userId }, 'handleAddMember: member added');
  void publish('tab.invite_sent', { tabId: tab.id, invitedUserId: member.userId, invitedById: req.user!.userId });
  res.status(201).json(member);
};

export const handleRemoveMember = async (req: MemberRequest, res: Response): Promise<void> => {
  const member = await findMemberById(req.params.id, req.params.userId);
  if (!member) {
    logger.warn({ tabId: req.params.id, userId: req.params.userId }, 'handleRemoveMember: not found');
    res.status(404).json({ message: 'Member not found' });
    return;
  }

  await removeMember(member.tabId, member.userId);
  logger.info({ tabId: req.params.id, userId: req.params.userId }, 'handleRemoveMember: member removed');
  res.status(204).send();
};

export const handleUpdateMemberItems = async (
  req: MemberRequest & { body: UpdateMemberItemsBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleUpdateMemberItems: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const member = await findMemberById(req.params.id, req.params.userId);
  if (!member) {
    logger.warn({ tabId: req.params.id, userId: req.params.userId }, 'handleUpdateMemberItems: member not found');
    res.status(404).json({ message: 'Member not found' });
    return;
  }

  const validMenuItemIds = new Set(tab.menuItems.map((m) => m.id));
  const invalid = req.body.items.find((item: { menuItemId: string; quantity: number }) => !validMenuItemIds.has(item.menuItemId));
  if (invalid) {
    logger.warn({ tabId: req.params.id, menuItemId: invalid.menuItemId }, 'handleUpdateMemberItems: unknown menu item');
    res.status(400).json({ message: `Menu item ${invalid.menuItemId} does not exist in this tab` });
    return;
  }

  logger.info({ tabId: req.params.id, userId: req.params.userId }, 'handleUpdateMemberItems: items updated');
  res.json(await updateMemberItems(req.params.id, req.params.userId, req.body.items));
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
  const memberUserIds = tab.members.map((m) => m.userId);
  void publish('tab.settled', { tabId: tab.id, settlementId: settlement.id, payerId: settlement.payerId, payeeId: settlement.payeeId, participantIds: memberUserIds });
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
