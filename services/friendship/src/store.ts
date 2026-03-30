import { PrismaClient, FriendshipStatus } from '../prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

export const createRequest = async (requesterId: string, addresseeId: string) => {
  logger.debug({ requesterId, addresseeId }, 'store: createRequest');
  try {
    return await prisma.friendship.create({ data: { requesterId, addresseeId } });
  } catch (err) {
    logger.error({ err, requesterId, addresseeId }, 'store: createRequest failed');
    throw err;
  }
};

export const findById = async (id: string) => {
  logger.debug({ id }, 'store: findById');
  try {
    return await prisma.friendship.findUnique({ where: { id } });
  } catch (err) {
    logger.error({ err, id }, 'store: findById failed');
    throw err;
  }
};

export const updateStatus = async (id: string, status: FriendshipStatus) => {
  logger.debug({ id, status }, 'store: updateStatus');
  try {
    return await prisma.friendship.update({ where: { id }, data: { status } });
  } catch (err) {
    logger.error({ err, id }, 'store: updateStatus failed');
    throw err;
  }
};

export const listFriends = async (userId: string) => {
  logger.debug({ userId }, 'store: listFriends');
  try {
    return await prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
  } catch (err) {
    logger.error({ err, userId }, 'store: listFriends failed');
    throw err;
  }
};
