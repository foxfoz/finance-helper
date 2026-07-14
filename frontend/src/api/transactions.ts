import api from './axios';
import type { Transaction } from '../types';

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'fund';
  directory_item?: number;
  fund?: number;
  date_from?: string;
  date_to?: string;
}

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  total_fund: number;
  balance: number;
}

export const transactionsApi = {
  getAll: (filters?: TransactionFilters) =>
    api.get<{ results: Transaction[] }>('/transactions/', { params: filters }),
  create: (data: Partial<Transaction>) => api.post<Transaction>('/transactions/', data),
  update: (id: number, data: Partial<Transaction>) =>
    api.put<Transaction>(`/transactions/${id}/`, data),
  delete: (id: number) => api.delete(`/transactions/${id}/`),
  getSummary: (params?: { date_from?: string; date_to?: string }) =>
    api.get<TransactionSummary>('/transactions/summary/', { params }),
};
