import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findUserById, upsertUser, updateUser } from './store';

const mockUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
}));

vi.mock('../prisma/client', () => ({
  PrismaClient: class {
    user = mockUser;
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('findUserById', () => {
  it('calls prisma.user.findUnique with id', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    await findUserById('u1');
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});

describe('upsertUser', () => {
  it('calls prisma.user.upsert with id', async () => {
    mockUser.upsert.mockResolvedValue({ id: 'u1' });
    await upsertUser('u1');
    expect(mockUser.upsert).toHaveBeenCalledWith({ where: { id: 'u1' }, create: { id: 'u1' }, update: {} });
  });
});

describe('updateUser', () => {
  it('calls prisma.user.update with id and data', async () => {
    mockUser.update.mockResolvedValue({ id: 'u1', displayName: 'Alice' });
    await updateUser('u1', { displayName: 'Alice' });
    expect(mockUser.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { displayName: 'Alice' } });
  });
});
