import { PrismaClient } from '../prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export const findUserById = async (id: string) => {
  logger.debug({ id }, 'store: findUserById');
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: findUserById failed');
    throw err;
  }
};

export const upsertUser = async (id: string) => {
  logger.debug({ id }, 'store: upsertUser');
  try {
    return await prisma.user.upsert({
      where: { id },
      create: { id },
      update: {},
    });
  } catch (err) {
    logger.error({ err, id }, 'store: upsertUser failed');
    throw err;
  }
};

export const updateUser = async (id: string, data: { displayName?: string; avatarUrl?: string }) => {
  logger.debug({ id }, 'store: updateUser');
  try {
    return await prisma.user.update({ where: { id }, data });
  } catch (err) {
    logger.error({ err, id }, 'store: updateUser failed');
    throw err;
  }
};
