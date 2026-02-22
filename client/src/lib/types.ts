export interface User {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  member_count: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  joined_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  user_name: string;
  avatar_color: string;
  owed_amount: string;
  is_settled: boolean;
  settled_at: string | null;
}

export interface Expense {
  id: string;
  group_id: string;
  paid_by: string;
  paid_by_name: string;
  paid_by_avatar_color: string;
  title: string;
  amount: string;
  split_type: 'equal' | 'custom' | 'percentage';
  created_at: string;
  your_share?: string;
  your_share_settled?: boolean;
  splits?: ExpenseSplit[];
}

export interface Balance {
  user: GroupMember;
  netBalance: number;
}

export interface Settlement {
  from: GroupMember;
  to: GroupMember;
  amount: number;
}

export interface SettlementRecord {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  from_name: string;
  to_name: string;
  from_avatar_color: string;
  to_avatar_color: string;
  amount: string;
  note: string | null;
  created_at: string;
}
