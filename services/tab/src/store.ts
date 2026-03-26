import { PrismaClient } from '../prisma/client';

const prisma = new PrismaClient();

export const createTab = (title: string, createdById: string) =>
  prisma.tab.create({
    data: { title, createdById, participants: { create: { userId: createdById } } },
    include: { items: true, participants: true, settlements: true },
  });

export const findTabById = (id: string) =>
  prisma.tab.findUnique({
    where: { id },
    include: { items: true, participants: true, settlements: true },
  });

export const addItem = (tabId: string, label: string, amount: number, paidById: string) =>
  prisma.item.create({ data: { tabId, label, amount, paidById } });

export const findItemById = (id: string) => prisma.item.findUnique({ where: { id } });

export const updateItem = (id: string, data: { label?: string; amount?: number; paidById?: string }) =>
  prisma.item.update({ where: { id }, data });

export const addParticipant = (tabId: string, userId: string) =>
  prisma.participant.create({ data: { tabId, userId } });

export const recordSettlement = (tabId: string, payerId: string, payeeId: string, amount: number) =>
  prisma.settlement.create({ data: { tabId, payerId, payeeId, amount } });

export const closeTab = (id: string) =>
  prisma.tab.update({
    where: { id },
    data: { closedAt: new Date() },
    include: { items: true, participants: true, settlements: true },
  });
