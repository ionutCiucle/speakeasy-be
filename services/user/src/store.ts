import { PrismaClient } from '../prisma/client';

const prisma = new PrismaClient();

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const upsertUser = (id: string) =>
  prisma.user.upsert({
    where: { id },
    create: { id },
    update: {},
  });

export const updateUser = (id: string, data: { displayName?: string; avatarUrl?: string }) =>
  prisma.user.update({ where: { id }, data });
