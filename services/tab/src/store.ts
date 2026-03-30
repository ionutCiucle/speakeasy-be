import { PrismaClient } from '../prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export const createTab = async (title: string, createdById: string) => {
  logger.debug({ title, createdById }, 'store: createTab');
  try {
    return await prisma.tab.create({
      data: { title, createdById, participants: { create: { userId: createdById } } },
      include: { items: true, participants: true, settlements: true },
    });
  } catch (err) {
    logger.error({ err, title, createdById }, 'store: createTab failed');
    throw err;
  }
};

export const findTabById = async (id: string) => {
  logger.debug({ id }, 'store: findTabById');
  try {
    return await prisma.tab.findUnique({
      where: { id },
      include: { items: true, participants: true, settlements: true },
    });
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
    return await prisma.tab.update({
      where: { id },
      data: { closedAt: new Date() },
      include: { items: true, participants: true, settlements: true },
    });
  } catch (err) {
    logger.error({ err, id }, 'store: closeTab failed');
    throw err;
  }
};
