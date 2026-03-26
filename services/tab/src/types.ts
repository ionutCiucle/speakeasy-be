export interface CreateTabBody {
  title: string;
}

export interface AddItemBody {
  label: string;
  amount: number;
  paidById: string;
}

export interface UpdateItemBody {
  label?: string;
  amount?: number;
  paidById?: string;
}

export interface AddParticipantBody {
  userId: string;
}

export interface RecordSettlementBody {
  payerId: string;
  payeeId: string;
  amount: number;
}
