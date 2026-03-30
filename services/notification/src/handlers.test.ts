import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./logger', () => ({ logger: { info: vi.fn() } }));

import { logger } from './logger';
import { onFriendshipRequested, onFriendshipAccepted, onTabInviteSent, onTabSettled } from './handlers';

afterEach(() => vi.clearAllMocks());

describe('onFriendshipRequested', () => {
  it('logs notification for addressee', () => {
    onFriendshipRequested({ friendshipId: 'f1', requesterId: 'u1', addresseeId: 'u2' });
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ addresseeId: 'u2' }), expect.any(String));
  });
});

describe('onFriendshipAccepted', () => {
  it('logs notification for requester', () => {
    onFriendshipAccepted({ friendshipId: 'f1', requesterId: 'u1', addresseeId: 'u2' });
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ requesterId: 'u1' }), expect.any(String));
  });
});

describe('onTabInviteSent', () => {
  it('logs notification for invited user', () => {
    onTabInviteSent({ tabId: 't1', invitedUserId: 'u2', invitedById: 'u1' });
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ invitedUserId: 'u2' }), expect.any(String));
  });
});

describe('onTabSettled', () => {
  it('logs notification for all participants', () => {
    onTabSettled({ tabId: 't1', settlementId: 's1', payerId: 'u1', payeeId: 'u2', participantIds: ['u1', 'u2'] });
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ tabId: 't1' }), expect.any(String));
  });
});
