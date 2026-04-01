import { Response } from 'express';
import { AuthRequest } from '@speakeasy/middleware';
import {
  CreateTabBody,
  AddItemBody,
  UpdateItemBody,
  AddParticipantBody,
  AddMemberBody,
  AddMenuItemBody,
  UpdateMenuItemBody,
  RecordSettlementBody,
} from './types';
import {
  createTab,
  findAllTabs,
  findTabById,
  addItem,
  findItemById,
  updateItem,
  addParticipant,
  addMember,
  findMemberById,
  removeMember,
  addMenuItem,
  findMenuItemById,
  updateMenuItem,
  removeMenuItem,
  recordSettlement,
  closeTab,
} from './store';
import { publish } from './publisher';
import { logger } from './logger';

type TabRequest = AuthRequest & { params: { id: string } };
type ItemRequest = AuthRequest & { params: { id: string; itemId: string } };
type MemberRequest = AuthRequest & { params: { id: string; memberId: string } };
type MenuItemRequest = AuthRequest & { params: { id: string; menuItemId: string } };

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

  const member = await addMember(tab.id, req.body.name);
  logger.info({ tabId: tab.id, memberId: member.id }, 'handleAddMember: member added');
  res.status(201).json(member);
};

export const handleRemoveMember = async (req: MemberRequest, res: Response): Promise<void> => {
  const member = await findMemberById(req.params.memberId);
  if (!member || member.tabId !== req.params.id) {
    logger.warn({ tabId: req.params.id, memberId: req.params.memberId }, 'handleRemoveMember: not found');
    res.status(404).json({ message: 'Member not found' });
    return;
  }

  await removeMember(member.id);
  logger.info({ tabId: req.params.id, memberId: member.id }, 'handleRemoveMember: member removed');
  res.status(204).send();
};

export const handleAddMenuItem = async (
  req: TabRequest & { body: AddMenuItemBody },
  res: Response,
): Promise<void> => {
  const tab = await findTabById(req.params.id);
  if (!tab) {
    logger.warn({ tabId: req.params.id }, 'handleAddMenuItem: tab not found');
    res.status(404).json({ message: 'Tab not found' });
    return;
  }

  const menuItem = await addMenuItem(tab.id, req.body.name, req.body.price);
  logger.info({ tabId: tab.id, menuItemId: menuItem.id }, 'handleAddMenuItem: menu item added');
  res.status(201).json(menuItem);
};

export const handleUpdateMenuItem = async (
  req: MenuItemRequest & { body: UpdateMenuItemBody },
  res: Response,
): Promise<void> => {
  const menuItem = await findMenuItemById(req.params.menuItemId);
  if (!menuItem || menuItem.tabId !== req.params.id) {
    logger.warn({ tabId: req.params.id, menuItemId: req.params.menuItemId }, 'handleUpdateMenuItem: not found');
    res.status(404).json({ message: 'Menu item not found' });
    return;
  }

  logger.info({ menuItemId: menuItem.id }, 'handleUpdateMenuItem: menu item updated');
  res.json(await updateMenuItem(menuItem.id, req.body));
};

export const handleRemoveMenuItem = async (req: MenuItemRequest, res: Response): Promise<void> => {
  const menuItem = await findMenuItemById(req.params.menuItemId);
  if (!menuItem || menuItem.tabId !== req.params.id) {
    logger.warn({ tabId: req.params.id, menuItemId: req.params.menuItemId }, 'handleRemoveMenuItem: not found');
    res.status(404).json({ message: 'Menu item not found' });
    return;
  }

  await removeMenuItem(menuItem.id);
  logger.info({ tabId: req.params.id, menuItemId: menuItem.id }, 'handleRemoveMenuItem: menu item removed');
  res.status(204).send();
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
