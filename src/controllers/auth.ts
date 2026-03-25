import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginBody, RegisterBody } from '../types';
import { findUserByEmail, createUser } from '../store/userStore';

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

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  if (await findUserByEmail(email)) {
    res.status(409).json({ message: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ email, passwordHash });

  const token = signToken(user.id, user.email);
  res.status(201).json({ token, user: { id: user.id, email: user.email } });
};

export const login = async (
  req: Request<object, object, LoginBody>,
  res: Response,
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const token = signToken(user.id, user.email);
  res.json({ token, user: { id: user.id, email: user.email } });
};
