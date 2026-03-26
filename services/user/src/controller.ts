import { Response } from 'express';
import { AuthRequest } from '@speakeasy/middleware';
import { UpdateUserBody } from './types';
import { findUserById, upsertUser, updateUser } from './store';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const user = await upsertUser(userId);
  res.json(user);
};

export const updateMe = async (
  req: AuthRequest & { body: UpdateUserBody },
  res: Response,
): Promise<void> => {
  const userId = req.user!.userId;
  const { displayName, avatarUrl } = req.body;
  const user = await updateUser(userId, { displayName, avatarUrl });
  res.json(user);
};

export const getUserById = async (req: AuthRequest & { params: { id: string } }, res: Response): Promise<void> => {
  const user = await findUserById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
};
