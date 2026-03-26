import prisma from './prisma';
import { FriendshipStatus } from '../prisma/client';

export const createRequest = (requesterId: string, addresseeId: string) =>
  prisma.friendship.create({ data: { requesterId, addresseeId } });

export const findById = (id: string) =>
  prisma.friendship.findUnique({ where: { id } });

export const updateStatus = (id: string, status: FriendshipStatus) =>
  prisma.friendship.update({ where: { id }, data: { status } });

export const listFriends = (userId: string) =>
  prisma.friendship.findMany({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
