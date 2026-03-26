import { PrismaClient } from '../prisma/client';

const prisma = new PrismaClient();

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } });

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const createUser = (data: { email: string; passwordHash: string }) =>
  prisma.user.create({ data });
