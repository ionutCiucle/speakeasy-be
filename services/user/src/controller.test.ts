import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMe, updateMe, getUserById } from './controller';
import * as store from './store';

vi.mock('./store');

const mockReq = (overrides: object) => ({ user: { userId: 'u1', email: 'a@b.com' }, body: {}, params: {}, ...overrides } as never);
const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const fakeUser = { id: 'u1', displayName: 'Alice', avatarUrl: null, createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('getMe', () => {
  it('upserts and returns the current user', async () => {
    vi.mocked(store.upsertUser).mockResolvedValue(fakeUser);
    const res = mockRes();
    await getMe(mockReq({}), res as never);
    expect(store.upsertUser).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });
});

describe('updateMe', () => {
  it('updates and returns the current user', async () => {
    const updated = { ...fakeUser, displayName: 'Bob' };
    vi.mocked(store.updateUser).mockResolvedValue(updated);
    const res = mockRes();
    await updateMe(mockReq({ body: { displayName: 'Bob' } }), res as never);
    expect(store.updateUser).toHaveBeenCalledWith('u1', { displayName: 'Bob', avatarUrl: undefined });
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

describe('getUserById', () => {
  it('returns 404 when user not found', async () => {
    vi.mocked(store.findUserById).mockResolvedValue(null);
    const res = mockRes();
    await getUserById(mockReq({ params: { id: 'missing' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('returns the user when found', async () => {
    vi.mocked(store.findUserById).mockResolvedValue(fakeUser);
    const res = mockRes();
    await getUserById(mockReq({ params: { id: 'u1' } }), res as never);
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });
});
