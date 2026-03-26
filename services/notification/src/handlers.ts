import {
  FriendshipRequestedPayload,
  FriendshipAcceptedPayload,
  TabInviteSentPayload,
  TabSettledPayload,
} from './types';

export function onFriendshipRequested(payload: FriendshipRequestedPayload): void {
  console.log(`[notify] friendship.requested — notify user ${payload.addresseeId}: new friend request from ${payload.requesterId}`);
}

export function onFriendshipAccepted(payload: FriendshipAcceptedPayload): void {
  console.log(`[notify] friendship.accepted — notify user ${payload.requesterId}: ${payload.addresseeId} accepted your friend request`);
}

export function onTabInviteSent(payload: TabInviteSentPayload): void {
  console.log(`[notify] tab.invite_sent — notify user ${payload.invitedUserId}: invited to tab ${payload.tabId} by ${payload.invitedById}`);
}

export function onTabSettled(payload: TabSettledPayload): void {
  console.log(`[notify] tab.settled — notify participants ${payload.participantIds.join(', ')}: settlement recorded on tab ${payload.tabId}`);
}
