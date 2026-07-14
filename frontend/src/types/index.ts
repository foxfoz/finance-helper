export interface User {
  id: number;
  email: string;
  first_name: string;
  currency: string;
  created_at: string;
}

export interface DirectoryItem {
  id: number;
  type: 'income' | 'expense';
  name: string;
  color: string;
  icon: string;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  type: 'income' | 'expense' | 'fund';
  directory_item: number | null;
  directory_item_name?: string;
  fund: number | null;
  fund_name?: string;
  amount: number;
  date: string;
  comment: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Fund {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  is_active: boolean;
  progress_percent: number;
  remaining_amount: number;
  monthly_required: number | null;
  estimated_date: string | null;
  created_at: string;
}

export interface DashboardData {
  period: string;
  start: string;
  end: string;
  income: number;
  expense: number;
  fund: number;
  balance: number;
  previous_balance: number;
  balance_change_percent: number | null;
  expense_structure: Array<{ directory_item__name: string; directory_item__color: string; total: number }>;
  income_dynamic: Array<{ date?: string; date__month?: number; total: number }>;
  expense_dynamic: Array<{ date?: string; date__month?: number; total: number }>;
  top_expenses: Array<{ directory_item__name: string; directory_item__color: string; total: number }>;
  funds: Array<{
    id: number;
    name: string;
    target_amount: number;
    current_amount: number;
    progress_percent: number;
    remaining_amount: number;
  }>;
}

export interface Advice {
  type: 'warning' | 'info' | 'tip' | 'goal';
  title: string;
  text: string;
}
