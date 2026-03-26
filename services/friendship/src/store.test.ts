import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, findById, updateStatus, listFriends } from './store';

const mockFriendship = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('../prisma/client', () => ({
  PrismaClient: class {
    friendship = mockFriendship;
  },
  FriendshipStatus: { PENDING: 'PENDING', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED', BLOCKED: 'BLOCKED' },
}));

beforeEach(() => vi.clearAllMocks());

describe('createRequest', () => {
  it('calls prisma.friendship.create', async () => {
    mockFriendship.create.mockResolvedValue({});
    await createRequest('u1', 'u2');
    expect(mockFriendship.create).toHaveBeenCalledWith({ data: { requesterId: 'u1', addresseeId: 'u2' } });
  });
});

describe('findById', () => {
  it('calls prisma.friendship.findUnique with id', async () => {
    mockFriendship.findUnique.mockResolvedValue(null);
    await findById('f1');
    expect(mockFriendship.findUnique).toHaveBeenCalledWith({ where: { id: 'f1' } });
  });
});

describe('updateStatus', () => {
  it('calls prisma.friendship.update with status', async () => {
    mockFriendship.update.mockResolvedValue({});
    await updateStatus('f1', 'ACCEPTED' as never);
    expect(mockFriendship.update).toHaveBeenCalledWith({ where: { id: 'f1' }, data: { status: 'ACCEPTED' } });
  });
});

describe('listFriends', () => {
  it('queries accepted friendships for the user', async () => {
    mockFriendship.findMany.mockResolvedValue([]);
    await listFriends('u1');
    expect(mockFriendship.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: 'ACCEPTED' }) }),
    );
  });
});
