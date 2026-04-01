import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginBody, RegisterBody } from './types';
import { findUserByEmail, createUser } from './store';
import { logger } from './logger';

const signToken = (userId: string, email: string): string =>
  jwt.sign(
    { userId, email },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}` },
  );

export const register = async (
  req: Request<object, object, RegisterBody>,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  if (await findUserByEmail(email)) {
    logger.warn({ email }, 'register: email already in use');
    res.status(409).json({ message: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ email, passwordHash });

  logger.info({ userId: user.id, email }, 'register: user created');
  const token = signToken(user.id, user.email);
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
};

export const login = async (
  req: Request<object, object, LoginBody>,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    logger.warn({ email }, 'login: invalid credentials');
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  logger.info({ userId: user.id, email }, 'login: success');
  const token = signToken(user.id, user.email);
  res.json({ token, user: { id: user.id, email: user.email } });
};
