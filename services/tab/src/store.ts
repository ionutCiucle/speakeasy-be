import { PrismaClient } from '../prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

const tabInclude = { items: true, participants: true, settlements: true, members: true, menuItems: true };

export const createTab = async (
  createdById: string,
  data: {
    title: string;
    venue: string;
    currencyCode: string;
    currencyName: string;
    notes?: string;
    members: { name: string }[];
    menuItems: { name: string; price: number }[];
  },
) => {
  logger.debug({ title: data.title, createdById }, 'store: createTab');
  try {
    return await prisma.tab.create({
      data: {
        title: data.title,
        venue: data.venue,
        currencyCode: data.currencyCode,
        currencyName: data.currencyName,
        notes: data.notes,
        createdById,
        participants: { create: { userId: createdById } },
        members: data.members.length ? { create: data.members } : undefined,
        menuItems: data.menuItems.length ? { create: data.menuItems } : undefined,
      },
      include: tabInclude,
    });
  } catch (err) {
    logger.error({ err, title: data.title, createdById }, 'store: createTab failed');
    throw err;
  }
};

export const findTabById = async (id: string) => {
  logger.debug({ id }, 'store: findTabById');
  try {
    return await prisma.tab.findUnique({ where: { id }, include: tabInclude });
  } catch (err) {
    logger.error({ err, id }, 'store: findTabById failed');
    throw err;
  }
};

export const addItem = async (tabId: string, label: string, amount: number, paidById: string) => {
  logger.debug({ tabId, label }, 'store: addItem');
  try {
    return await prisma.item.create({ data: { tabId, label, amount, paidById } });
  } catch (err) {
    logger.error({ err, tabId }, 'store: addItem failed');
    throw err;
  }
};

export const findItemById = async (id: string) => {
  logger.debug({ id }, 'store: findItemById');
  try {
    return await prisma.item.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: findItemById failed');
    throw err;
  }
};

export const updateItem = async (id: string, data: { label?: string; amount?: number; paidById?: string }) => {
  logger.debug({ id }, 'store: updateItem');
  try {
    return await prisma.item.update({ where: { id }, data });
  } catch (err) {
    logger.error({ err, id }, 'store: updateItem failed');
    throw err;
  }
};

export const addParticipant = async (tabId: string, userId: string) => {
  logger.debug({ tabId, userId }, 'store: addParticipant');
  try {
    return await prisma.participant.create({ data: { tabId, userId } });
  } catch (err) {
    logger.error({ err, tabId, userId }, 'store: addParticipant failed');
    throw err;
  }
};

export const addMember = async (tabId: string, name: string) => {
  logger.debug({ tabId, name }, 'store: addMember');
  try {
    return await prisma.member.create({ data: { tabId, name } });
  } catch (err) {
    logger.error({ err, tabId, name }, 'store: addMember failed');
    throw err;
  }
};

export const findMemberById = async (id: string) => {
  logger.debug({ id }, 'store: findMemberById');
  try {
    return await prisma.member.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: findMemberById failed');
    throw err;
  }
};

export const removeMember = async (id: string) => {
  logger.debug({ id }, 'store: removeMember');
  try {
    return await prisma.member.delete({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: removeMember failed');
    throw err;
  }
};

export const addMenuItem = async (tabId: string, name: string, price: number) => {
  logger.debug({ tabId, name }, 'store: addMenuItem');
  try {
    return await prisma.menuItem.create({ data: { tabId, name, price } });
  } catch (err) {
    logger.error({ err, tabId, name }, 'store: addMenuItem failed');
    throw err;
  }
};

export const findMenuItemById = async (id: string) => {
  logger.debug({ id }, 'store: findMenuItemById');
  try {
    return await prisma.menuItem.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: findMenuItemById failed');
    throw err;
  }
};

export const updateMenuItem = async (id: string, data: { name?: string; price?: number }) => {
  logger.debug({ id }, 'store: updateMenuItem');
  try {
    return await prisma.menuItem.update({ where: { id }, data });
  } catch (err) {
    logger.error({ err, id }, 'store: updateMenuItem failed');
    throw err;
  }
};

export const removeMenuItem = async (id: string) => {
  logger.debug({ id }, 'store: removeMenuItem');
  try {
    return await prisma.menuItem.delete({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: removeMenuItem failed');
    throw err;
  }
};

export const recordSettlement = async (tabId: string, payerId: string, payeeId: string, amount: number) => {
  logger.debug({ tabId, payerId, payeeId }, 'store: recordSettlement');
  try {
    return await prisma.settlement.create({ data: { tabId, payerId, payeeId, amount } });
  } catch (err) {
    logger.error({ err, tabId }, 'store: recordSettlement failed');
    throw err;
  }
};

export const closeTab = async (id: string) => {
  logger.debug({ id }, 'store: closeTab');
  try {
    return await prisma.tab.update({ where: { id }, data: { closedAt: new Date() }, include: tabInclude });
  } catch (err) {
    logger.error({ err, id }, 'store: closeTab failed');
    throw err;
  }
};
