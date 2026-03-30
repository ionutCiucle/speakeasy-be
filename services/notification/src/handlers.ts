import {
  FriendshipRequestedPayload,
  FriendshipAcceptedPayload,
  TabInviteSentPayload,
  TabSettledPayload,
} from './types';
import { logger } from './logger';

export function onFriendshipRequested(payload: FriendshipRequestedPayload): void {
  logger.info({ addresseeId: payload.addresseeId, requesterId: payload.requesterId }, 'notify: friendship.requested');
}

export function onFriendshipAccepted(payload: FriendshipAcceptedPayload): void {
  logger.info({ requesterId: payload.requesterId, addresseeId: payload.addresseeId }, 'notify: friendship.accepted');
}

export function onTabInviteSent(payload: TabInviteSentPayload): void {
  logger.info({ invitedUserId: payload.invitedUserId, tabId: payload.tabId, invitedById: payload.invitedById }, 'notify: tab.invite_sent');
}

export function onTabSettled(payload: TabSettledPayload): void {
  logger.info({ tabId: payload.tabId, participantIds: payload.participantIds }, 'notify: tab.settled');
}
