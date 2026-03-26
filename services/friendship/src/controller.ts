import { Response } from 'express';
import { AuthRequest } from '@speakeasy/middleware';
import { FriendshipStatus } from '../prisma/client';
import { SendRequestBody } from './types';
import { createRequest, findById, updateStatus, listFriends } from './store';
import { publish } from './publisher';

export const sendRequest = async (
  req: AuthRequest & { body: SendRequestBody },
  res: Response,
): Promise<void> => {
  const requesterId = req.user!.userId;
  const { addresseeId } = req.body;

  if (requesterId === addresseeId) {
    res.status(400).json({ message: 'Cannot send a friend request to yourself' });
    return;
  }

  const friendship = await createRequest(requesterId, addresseeId);
  void publish('friendship.requested', { friendshipId: friendship.id, requesterId, addresseeId });
  res.status(201).json(friendship);
};

export const acceptRequest = async (
  req: AuthRequest & { params: { id: string } },
  res: Response,
): Promise<void> => {
  const friendship = await findById(req.params.id);

  if (!friendship) {
    res.status(404).json({ message: 'Friend request not found' });
    return;
  }
  if (friendship.addresseeId !== req.user!.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const updated = await updateStatus(req.params.id, FriendshipStatus.ACCEPTED);
  void publish('friendship.accepted', { friendshipId: updated.id, requesterId: updated.requesterId, addresseeId: updated.addresseeId });
  res.json(updated);
};

export const rejectRequest = async (
  req: AuthRequest & { params: { id: string } },
  res: Response,
): Promise<void> => {
  const friendship = await findById(req.params.id);

  if (!friendship) {
    res.status(404).json({ message: 'Friend request not found' });
    return;
  }
  if (friendship.addresseeId !== req.user!.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json(await updateStatus(req.params.id, FriendshipStatus.REJECTED));
};

export const blockUser = async (
  req: AuthRequest & { params: { id: string } },
  res: Response,
): Promise<void> => {
  const friendship = await findById(req.params.id);

  if (!friendship) {
    res.status(404).json({ message: 'Friendship not found' });
    return;
  }

  const userId = req.user!.userId;
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json(await updateStatus(req.params.id, FriendshipStatus.BLOCKED));
};

export const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
  const friends = await listFriends(req.user!.userId);
  res.json(friends);
};
