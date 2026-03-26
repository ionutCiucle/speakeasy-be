import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findUserByEmail, findUserById, createUser } from './store';

const mockUser = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../prisma/client', () => ({
  PrismaClient: class {
    user = mockUser;
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('findUserByEmail', () => {
  it('calls prisma.user.findUnique with email', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    await findUserByEmail('a@b.com');
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
  });
});

describe('findUserById', () => {
  it('calls prisma.user.findUnique with id', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    await findUserById('123');
    expect(mockUser.findUnique).toHaveBeenCalledWith({ where: { id: '123' } });
  });
});

describe('createUser', () => {
  it('calls prisma.user.create with data', async () => {
    const data = { email: 'a@b.com', passwordHash: 'h' };
    mockUser.create.mockResolvedValue({ id: '1', ...data, createdAt: new Date() });
    await createUser(data);
    expect(mockUser.create).toHaveBeenCalledWith({ data });
  });
});
