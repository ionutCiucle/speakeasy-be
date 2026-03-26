import { describe, it, expect, vi, afterEach } from 'vitest';
import { onFriendshipRequested, onFriendshipAccepted, onTabInviteSent, onTabSettled } from './handlers';

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
afterEach(() => consoleSpy.mockClear());

describe('onFriendshipRequested', () => {
  it('logs notification for addressee', () => {
    onFriendshipRequested({ friendshipId: 'f1', requesterId: 'u1', addresseeId: 'u2' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('u2'));
  });
});

describe('onFriendshipAccepted', () => {
  it('logs notification for requester', () => {
    onFriendshipAccepted({ friendshipId: 'f1', requesterId: 'u1', addresseeId: 'u2' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('u1'));
  });
});

describe('onTabInviteSent', () => {
  it('logs notification for invited user', () => {
    onTabInviteSent({ tabId: 't1', invitedUserId: 'u2', invitedById: 'u1' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('u2'));
  });
});

describe('onTabSettled', () => {
  it('logs notification for all participants', () => {
    onTabSettled({ tabId: 't1', settlementId: 's1', payerId: 'u1', payeeId: 'u2', participantIds: ['u1', 'u2'] });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('t1'));
  });
});
