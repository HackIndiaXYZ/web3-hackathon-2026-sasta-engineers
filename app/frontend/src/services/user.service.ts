import api from '@/lib/axios';
import { User, UpdateProfileForm, PaginatedResponse } from '@/types';

export const userService = {
  // Get current user profile
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  // Update current user profile
  async updateProfile(data: UpdateProfileForm): Promise<User> {
    const response = await api.put<User>('/users/me', data);
    return response.data;
  },

  // Get all users (admin only)
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    role?: string
  ): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(role && { role }),
    });
    const response = await api.get<PaginatedResponse<User>>(`/users?${params}`);
    return response.data;
  },

  // Get user by ID (admin only)
  async getUserById(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  // Delete user (admin only)
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
