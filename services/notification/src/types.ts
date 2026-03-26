export interface FriendshipRequestedPayload {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
}

export interface FriendshipAcceptedPayload {
  friendshipId: string;
  requesterId: string;
  addresseeId: string;
}

export interface TabInviteSentPayload {
  tabId: string;
  invitedUserId: string;
  invitedById: string;
}

export interface TabSettledPayload {
  tabId: string;
  settlementId: string;
  payerId: string;
  payeeId: string;
  participantIds: string[];
}
