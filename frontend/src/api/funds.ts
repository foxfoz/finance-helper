import api from './axios';
import type { Fund } from '../types';

export const fundsApi = {
  getAll: () => api.get<{ results: Fund[] }>('/funds/'),
  create: (data: Partial<Fund>) => api.post<Fund>('/funds/', data),
  update: (id: number, data: Partial<Fund>) => api.put<Fund>(`/funds/${id}/`, data),
  delete: (id: number) => api.delete(`/funds/${id}/`),
  deposit: (id: number, amount: number, date: string, comment?: string) =>
    api.post<Fund>(`/funds/${id}/deposit/`, { operation: 'deposit', amount, date, comment }),
  withdraw: (id: number, amount: number, date: string, comment?: string) =>
    api.post<Fund>(`/funds/${id}/deposit/`, { operation: 'withdraw', amount, date, comment }),
};
