import api from './axios';
import type { DirectoryItem } from '../types';

export const directoriesApi = {
  getAll: (type?: 'income' | 'expense') =>
    api.get<{ results: DirectoryItem[] }>('/directories/', { params: { type } }),
  create: (data: Partial<DirectoryItem>) => api.post<DirectoryItem>('/directories/', data),
  update: (id: number, data: Partial<DirectoryItem>) =>
    api.put<DirectoryItem>(`/directories/${id}/`, data),
  delete: (id: number) => api.delete(`/directories/${id}/`),
};
