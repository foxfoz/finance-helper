import api from './axios';
import type { DashboardData, Advice } from '../types';

export const analyticsApi = {
  getDashboard: (period: 'month' | 'quarter' | 'year' = 'month') =>
    api.get<DashboardData>('/analytics/dashboard/', { params: { period } }),
  getAdvice: () => api.get<{ advice: Advice[] }>('/analytics/advice/'),
};
