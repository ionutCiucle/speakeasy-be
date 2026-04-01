import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '../prisma/client/runtime/library';
import {
  handleCreateTab, handleGetTab, handleAddItem, handleUpdateItem,
  handleAddParticipant, handleRecordSettlement, handleCloseTab,
} from './controller';
import { validate } from '@speakeasy/middleware';
import { createTabSchema } from './routes';
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

const fakeTab = {
  id: 't1', title: 'Dinner', venue: '', currencyCode: 'USD', currencyName: 'US Dollar', notes: null,
  status: 'active' as const, createdById: 'u1', closedAt: null, createdAt: new Date(), updatedAt: new Date(),
  items: [], participants: [{ id: 'p1', tabId: 't1', userId: 'u1', createdAt: new Date() }],
  settlements: [], members: [], menuItems: [],
};

const fakeItem = { id: 'i1', tabId: 't1', label: 'Pizza', amount: new Decimal(10), paidById: 'u1', createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => vi.clearAllMocks());

describe('createTab payload validation', () => {
  const validateCreateTab = validate(createTabSchema);
  const next = vi.fn();
  const validBody = {
    title: 'Dinner',
    venue: 'Restaurant',
    currency: { code: 'USD', name: 'US Dollar' },
    members: [],
    menuItems: [],
  };

  beforeEach(() => next.mockReset());

  it.each([
    ['missing title', { ...validBody, title: undefined }],
    ['empty title', { ...validBody, title: '' }],
    ['missing venue', { ...validBody, venue: undefined }],
    ['missing currency', { ...validBody, currency: undefined }],
    ['missing currency.code', { ...validBody, currency: { name: 'US Dollar' } }],
    ['missing currency.name', { ...validBody, currency: { code: 'USD' } }],
    ['missing members', { ...validBody, members: undefined }],
    ['missing menuItems', { ...validBody, menuItems: undefined }],
  ])('returns 400 when %s', (_label, body) => {
    const res = mockRes();
    validateCreateTab(mockReq({ body }), res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid payload', () => {
    const res = mockRes();
    validateCreateTab(mockReq({ body: validBody }), res as never, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('handleCreateTab', () => {
  it('creates and returns the tab', async () => {
    vi.mocked(store.createTab).mockResolvedValue(fakeTab);
    const res = mockRes();
    const body = { title: 'Dinner', venue: 'Restaurant', currency: { code: 'USD', name: 'US Dollar' }, notes: '', members: [], menuItems: [] };
    await handleCreateTab(mockReq({ body }), res as never);
    expect(store.createTab).toHaveBeenCalledWith('u1', expect.objectContaining({ title: 'Dinner' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('handleGetTab', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleGetTab(mockReq({ params: { id: 't1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the tab', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    const res = mockRes();
    await handleGetTab(mockReq({ params: { id: 't1' } }), res as never);
    expect(res.json).toHaveBeenCalledWith(fakeTab);
  });
});

describe('handleAddItem', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleAddItem(mockReq({ params: { id: 't1' }, body: { label: 'Pizza', amount: 10, paidById: 'u1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('adds item and returns 201', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.addItem).mockResolvedValue(fakeItem);
    const res = mockRes();
    await handleAddItem(mockReq({ params: { id: 't1' }, body: { label: 'Pizza', amount: 10, paidById: 'u1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('handleUpdateItem', () => {
  it('returns 404 when item not found', async () => {
    vi.mocked(store.findItemById).mockResolvedValue(null);
    const res = mockRes();
    await handleUpdateItem(mockReq({ params: { id: 't1', itemId: 'i1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when item belongs to a different tab', async () => {
    vi.mocked(store.findItemById).mockResolvedValue({ ...fakeItem, tabId: 'other' });
    const res = mockRes();
    await handleUpdateItem(mockReq({ params: { id: 't1', itemId: 'i1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates and returns the item', async () => {
    vi.mocked(store.findItemById).mockResolvedValue(fakeItem);
    vi.mocked(store.updateItem).mockResolvedValue({ ...fakeItem, label: 'Pasta' });
    const res = mockRes();
    await handleUpdateItem(mockReq({ params: { id: 't1', itemId: 'i1' }, body: { label: 'Pasta' } }), res as never);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ label: 'Pasta' }));
  });
});

describe('handleAddParticipant', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleAddParticipant(mockReq({ params: { id: 't1' }, body: { userId: 'u2' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('adds participant and publishes invite event', async () => {
    const participant = { id: 'p2', tabId: 't1', userId: 'u2', createdAt: new Date() };
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.addParticipant).mockResolvedValue(participant);
    vi.mocked(publisher.publish).mockResolvedValue(undefined);
    const res = mockRes();
    await handleAddParticipant(mockReq({ params: { id: 't1' }, body: { userId: 'u2' } }), res as never);
    expect(publisher.publish).toHaveBeenCalledWith('tab.invite_sent', expect.objectContaining({ invitedUserId: 'u2' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('handleRecordSettlement', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleRecordSettlement(mockReq({ params: { id: 't1' }, body: { payerId: 'u1', payeeId: 'u2', amount: 5 } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('records settlement and publishes event', async () => {
    const settlement = { id: 's1', tabId: 't1', payerId: 'u1', payeeId: 'u2', amount: new Decimal(5), createdAt: new Date() };
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.recordSettlement).mockResolvedValue(settlement);
    vi.mocked(publisher.publish).mockResolvedValue(undefined);
    const res = mockRes();
    await handleRecordSettlement(mockReq({ params: { id: 't1' }, body: { payerId: 'u1', payeeId: 'u2', amount: 5 } }), res as never);
    expect(publisher.publish).toHaveBeenCalledWith('tab.settled', expect.objectContaining({ tabId: 't1' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('handleCloseTab', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleCloseTab(mockReq({ params: { id: 't1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when caller is not the creator', async () => {
    vi.mocked(store.findTabById).mockResolvedValue({ ...fakeTab, createdById: 'u2' });
    const res = mockRes();
    await handleCloseTab(mockReq({ params: { id: 't1' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('closes and returns the tab', async () => {
    const closed = { ...fakeTab, closedAt: new Date() };
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.closeTab).mockResolvedValue(closed);
    const res = mockRes();
    await handleCloseTab(mockReq({ params: { id: 't1' } }), res as never);
    expect(res.json).toHaveBeenCalledWith(closed);
  });
});
