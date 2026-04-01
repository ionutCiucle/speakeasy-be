export interface Member {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Currency {
  code: string;
  name: string;
}

export interface CreateTabBody {
  title: string;
  venue: string;
  currency: Currency;
  notes?: string;
  members: { name: string }[];
  menuItems: { name: string; price: number }[];
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

export interface AddMemberBody {
  name: string;
}

export interface AddMenuItemBody {
  name: string;
  price: number;
}

export interface UpdateMenuItemBody {
  name?: string;
  price?: number;
}

export interface RecordSettlementBody {
  payerId: string;
  payeeId: string;
  amount: number;
}
