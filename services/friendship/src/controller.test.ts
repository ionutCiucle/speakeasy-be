import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendRequest, acceptRequest, rejectRequest, blockUser, getFriends } from './controller';
import * as store from './store';
import * as publisher from './publisher';

vi.mock('./store');
vi.mock('./publisher');

const mockReq = (overrides: object) => ({
  user: { userId: 'u1', email: 'a@b.com' },
  body: {},
  params: {},
  ...overrides,
} as never);

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const fakeFriendship = {
  id: 'f1', requesterId: 'u1', addresseeId: 'u2',
  status: 'PENDING' as const, createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('sendRequest', () => {
  it('returns 400 when sending request to self', async () => {
    const res = mockRes();
    await sendRequest(mockReq({ body: { addresseeId: 'u1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates request and publishes event', async () => {
    vi.mocked(store.createRequest).mockResolvedValue(fakeFriendship);
    vi.mocked(publisher.publish).mockResolvedValue(undefined);
    const res = mockRes();
    await sendRequest(mockReq({ body: { addresseeId: 'u2' } }), res as never);
    expect(store.createRequest).toHaveBeenCalledWith('u1', 'u2');
    expect(publisher.publish).toHaveBeenCalledWith('friendship.requested', expect.objectContaining({ requesterId: 'u1', addresseeId: 'u2' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('acceptRequest', () => {
  it('returns 404 when friendship not found', async () => {
    vi.mocked(store.findById).mockResolvedValue(null);
    const res = mockRes();
    await acceptRequest(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when caller is not the addressee', async () => {
    vi.mocked(store.findById).mockResolvedValue({ ...fakeFriendship, addresseeId: 'u3' });
    const res = mockRes();
    await acceptRequest(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('accepts and publishes event', async () => {
    const accepted = { ...fakeFriendship, addresseeId: 'u1', status: 'ACCEPTED' as const };
    vi.mocked(store.findById).mockResolvedValue({ ...fakeFriendship, addresseeId: 'u1' });
    vi.mocked(store.updateStatus).mockResolvedValue(accepted);
    vi.mocked(publisher.publish).mockResolvedValue(undefined);
    const res = mockRes();
    await acceptRequest(mockReq({ params: { id: 'f1' } }), res as never);
    expect(publisher.publish).toHaveBeenCalledWith('friendship.accepted', expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(accepted);
  });
});

describe('rejectRequest', () => {
  it('returns 404 when not found', async () => {
    vi.mocked(store.findById).mockResolvedValue(null);
    const res = mockRes();
    await rejectRequest(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when caller is not the addressee', async () => {
    vi.mocked(store.findById).mockResolvedValue({ ...fakeFriendship, addresseeId: 'u3' });
    const res = mockRes();
    await rejectRequest(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rejects the request', async () => {
    const rejected = { ...fakeFriendship, addresseeId: 'u1', status: 'REJECTED' as const };
    vi.mocked(store.findById).mockResolvedValue({ ...fakeFriendship, addresseeId: 'u1' });
    vi.mocked(store.updateStatus).mockResolvedValue(rejected);
    const res = mockRes();
    await rejectRequest(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.json).toHaveBeenCalledWith(rejected);
  });
});

describe('blockUser', () => {
  it('returns 404 when not found', async () => {
    vi.mocked(store.findById).mockResolvedValue(null);
    const res = mockRes();
    await blockUser(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when caller is not a participant', async () => {
    vi.mocked(store.findById).mockResolvedValue({ ...fakeFriendship, requesterId: 'u3', addresseeId: 'u4' });
    const res = mockRes();
    await blockUser(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('blocks when caller is the requester', async () => {
    const blocked = { ...fakeFriendship, status: 'BLOCKED' as const };
    vi.mocked(store.findById).mockResolvedValue(fakeFriendship);
    vi.mocked(store.updateStatus).mockResolvedValue(blocked);
    const res = mockRes();
    await blockUser(mockReq({ params: { id: 'f1' } }), res as never);
    expect(res.json).toHaveBeenCalledWith(blocked);
  });
});

describe('getFriends', () => {
  it('returns the friends list', async () => {
    vi.mocked(store.listFriends).mockResolvedValue([fakeFriendship]);
    const res = mockRes();
    await getFriends(mockReq({}), res as never);
    expect(store.listFriends).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith([fakeFriendship]);
  });
});
