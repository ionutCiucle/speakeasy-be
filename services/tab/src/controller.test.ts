import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '../prisma/client/runtime/library';
import {
  handleCreateTab, handleGetTab, handleUpdateTab, handleAddItem, handleUpdateItem,
  handleAddMember, handleRemoveMember, handleUpdateMemberItems,
  handleRecordSettlement, handleCloseTab,
} from './controller';
import { validate } from '@speakeasy/middleware';
import { createTabSchema, updateTabSchema, updateMemberItemsSchema } from './routes';
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
  const res = { status: vi.fn(), json: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const fakeMenuItem = { id: 'm1', tabId: 't1', name: 'Burger', price: new Decimal(10), createdAt: new Date(), updatedAt: new Date() };

const fakeTab = {
  id: 't1', title: 'Dinner', venue: '', currencyCode: 'USD', currencyName: 'US Dollar', notes: null,
  status: 'active' as const, createdById: 'u1', closedAt: null, createdAt: new Date(), updatedAt: new Date(),
  items: [], settlements: [],
  members: [{ tabId: 't1', userId: 'u1', memberMenuItems: [] }],
  menuItems: [fakeMenuItem],
};

const fakeItem = { id: 'i1', tabId: 't1', label: 'Pizza', amount: new Decimal(10), paidById: 'u1', createdAt: new Date(), updatedAt: new Date() };

beforeEach(() => vi.clearAllMocks());

// ─── Validation ──────────────────────────────────────────────────────────────

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

describe('updateTab payload validation', () => {
  const validateUpdateTab = validate(updateTabSchema);
  const next = vi.fn();

  beforeEach(() => next.mockReset());

  it.each([
    ['missing menuItems', {}],
    ['non-array menuItems', { menuItems: 'bad' }],
    ['item missing name', { menuItems: [{ price: 10 }] }],
    ['item empty name', { menuItems: [{ name: '', price: 10 }] }],
    ['item missing price', { menuItems: [{ name: 'Burger' }] }],
  ])('returns 400 when %s', (_label, body) => {
    const res = mockRes();
    validateUpdateTab(mockReq({ body }), res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Validation failed' }));
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid payload', () => {
    const res = mockRes();
    validateUpdateTab(mockReq({ body: { menuItems: [{ name: 'Burger', price: 12 }] } }), res as never, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for an empty menuItems array', () => {
    const res = mockRes();
    validateUpdateTab(mockReq({ body: { menuItems: [] } }), res as never, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('updateMemberItems payload validation', () => {
  const validateUpdateMemberItems = validate(updateMemberItemsSchema);
  const next = vi.fn();

  beforeEach(() => next.mockReset());

  it.each([
    ['missing items', {}],
    ['non-array items', { items: 'bad' }],
    ['item missing menuItemId', { items: [{ quantity: 2 }] }],
    ['item missing quantity', { items: [{ menuItemId: 'm1' }] }],
    ['item zero quantity', { items: [{ menuItemId: 'm1', quantity: 0 }] }],
    ['item negative quantity', { items: [{ menuItemId: 'm1', quantity: -1 }] }],
  ])('returns 400 when %s', (_label, body) => {
    const res = mockRes();
    validateUpdateMemberItems(mockReq({ body }), res as never, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid payload', () => {
    const res = mockRes();
    validateUpdateMemberItems(mockReq({ body: { items: [{ menuItemId: 'm1', quantity: 2 }] } }), res as never, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for an empty items array', () => {
    const res = mockRes();
    validateUpdateMemberItems(mockReq({ body: { items: [] } }), res as never, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─── Controllers ─────────────────────────────────────────────────────────────

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

describe('handleUpdateTab', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleUpdateTab(mockReq({ params: { id: 't1' }, body: { menuItems: [] } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when menu item names are duplicated', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    const res = mockRes();
    const body = { menuItems: [{ name: 'Burger', price: 10 }, { name: 'Burger', price: 12 }] };
    await handleUpdateTab(mockReq({ params: { id: 't1' }, body }), res as never);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Duplicate menu item names are not allowed' });
  });

  it('replaces menu items and returns the updated tab', async () => {
    const updatedTab = { ...fakeTab, menuItems: [{ ...fakeMenuItem, name: 'Burger' }] };
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.updateTabMenuItems).mockResolvedValue(updatedTab);
    const res = mockRes();
    await handleUpdateTab(mockReq({ params: { id: 't1' }, body: { menuItems: [{ name: 'Burger', price: 10 }] } }), res as never);
    expect(store.updateTabMenuItems).toHaveBeenCalledWith('t1', [{ name: 'Burger', price: 10 }]);
    expect(res.json).toHaveBeenCalledWith(updatedTab);
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

describe('handleAddMember', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleAddMember(mockReq({ params: { id: 't1' }, body: { userId: 'u2' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('adds member, publishes invite event, and returns 201', async () => {
    const member = { tabId: 't1', userId: 'u2' };
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.addMember).mockResolvedValue(member);
    vi.mocked(publisher.publish).mockResolvedValue(undefined);
    const res = mockRes();
    await handleAddMember(mockReq({ params: { id: 't1' }, body: { userId: 'u2' } }), res as never);
    expect(publisher.publish).toHaveBeenCalledWith('tab.invite_sent', expect.objectContaining({ invitedUserId: 'u2' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('handleRemoveMember', () => {
  it('returns 404 when member not found', async () => {
    vi.mocked(store.findMemberById).mockResolvedValue(null);
    const res = mockRes();
    await handleRemoveMember(mockReq({ params: { id: 't1', userId: 'u2' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('removes member and returns 204', async () => {
    const member = { tabId: 't1', userId: 'u2' };
    vi.mocked(store.findMemberById).mockResolvedValue(member);
    vi.mocked(store.removeMember).mockResolvedValue(member);
    const res = mockRes();
    await handleRemoveMember(mockReq({ params: { id: 't1', userId: 'u2' } }), res as never);
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe('handleUpdateMemberItems', () => {
  it('returns 404 when tab not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(null);
    const res = mockRes();
    await handleUpdateMemberItems(mockReq({ params: { id: 't1', userId: 'u1' }, body: { items: [] } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when member not found', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.findMemberById).mockResolvedValue(null);
    const res = mockRes();
    await handleUpdateMemberItems(mockReq({ params: { id: 't1', userId: 'u2' }, body: { items: [] } }), res as never);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 400 when a menuItemId does not exist in the tab', async () => {
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.findMemberById).mockResolvedValue({ tabId: 't1', userId: 'u1' });
    const res = mockRes();
    await handleUpdateMemberItems(mockReq({ params: { id: 't1', userId: 'u1' }, body: { items: [{ menuItemId: 'unknown', quantity: 1 }] } }), res as never);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates member items and returns the member', async () => {
    const updatedMember = { tabId: 't1', userId: 'u1', memberMenuItems: [{ tabId: 't1', userId: 'u1', menuItemId: 'm1', quantity: 2, menuItem: fakeMenuItem }] };
    vi.mocked(store.findTabById).mockResolvedValue(fakeTab);
    vi.mocked(store.findMemberById).mockResolvedValue({ tabId: 't1', userId: 'u1' });
    vi.mocked(store.updateMemberItems).mockResolvedValue(updatedMember);
    const res = mockRes();
    await handleUpdateMemberItems(mockReq({ params: { id: 't1', userId: 'u1' }, body: { items: [{ menuItemId: 'm1', quantity: 2 }] } }), res as never);
    expect(store.updateMemberItems).toHaveBeenCalledWith('t1', 'u1', [{ menuItemId: 'm1', quantity: 2 }]);
    expect(res.json).toHaveBeenCalledWith(updatedMember);
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
