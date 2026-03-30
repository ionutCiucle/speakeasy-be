import { PrismaClient } from '../prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export const findUserByEmail = async (email: string) => {
  logger.debug({ email }, 'store: findUserByEmail');
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    logger.error({ err, email }, 'store: findUserByEmail failed');
    throw err;
  }
};

export const findUserById = async (id: string) => {
  logger.debug({ id }, 'store: findUserById');
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: findUserById failed');
    throw err;
  }
};

export const createUser = async (data: { email: string; passwordHash: string }) => {
  logger.debug({ email: data.email }, 'store: createUser');
  try {
    return await prisma.user.create({ data });
  } catch (err) {
    logger.error({ err, email: data.email }, 'store: createUser failed');
    throw err;
  }
};
