import api from './axios';
import type { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export const authApi = {
  login: (data: LoginCredentials) => api.post<AuthResponse>('/auth/login/', data),
  register: (data: RegisterCredentials) => api.post<User>('/auth/register/', data),
  refresh: (refresh: string) => api.post<AuthResponse>('/auth/refresh/', { refresh }),
  getProfile: () => api.get<User>('/auth/profile/'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile/', data),
};
