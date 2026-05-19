import api from '@/lib/axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  WalletConnectRequest,
  User,
} from '@/types';

export const authService = {
  // Register with email/password
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login with email/password
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  // Connect with wallet
  async walletConnect(data: WalletConnectRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/wallet-connect', data);
    return response.data;
  },

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
    return response.data;
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },
};
