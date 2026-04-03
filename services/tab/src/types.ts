export interface Currency {
  code: string;
  name: string;
}

export interface CreateTabBody {
  title: string;
  venue: string;
  currency: Currency;
  notes?: string;
  members: { userId: string }[];
  menuItems: { name: string; price: number }[];
}

export interface AddItemsBody {
  items: { label: string; amount: number; addedBy: string }[];
}

export interface AddMemberBody {
  userId: string;
}

export interface UpdateTabBody {
  menuItems: { name: string; price: number }[];
}

export interface UpdateMemberItemsBody {
  items: { menuItemId: string; quantity: number }[];
}

export interface RecordSettlementBody {
  payerId: string;
  payeeId: string;
  amount: number;
}
