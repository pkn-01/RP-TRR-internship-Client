import { apiFetch } from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'IT' | 'ADMIN';
  department?: string;
  phoneNumber?: string;
  lineId?: string;
  lineUserId?: string; // from LineOALink
  displayName?: string; // from LineOALink
  pictureUrl?: string; // from LineOALink
  profilePicture?: string; // from database
  password?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tickets: number;
    assigned: number;
  };
}

export interface UsersResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const userService = {
  async getAllUsers(page: number = 1, limit: number = 10): Promise<UsersResponse> {
    return apiFetch(`/users?page=${page}&limit=${limit}`);
  },

  async getUserById(id: number): Promise<User> {
    return apiFetch(`/users/${id}`);
  },

  async createUser(data: Partial<User>): Promise<User> {
    return apiFetch('/users', 'POST', data);
  },

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return apiFetch(`/users/${id}`, 'PUT', data);
  },

  async deleteUser(id: number): Promise<void> {
    return apiFetch(`/users/${id}`, 'DELETE');
  },

  async searchUsers(query: string): Promise<User[]> {
    return apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
  },

  async changePassword(id: number, newPassword: string): Promise<void> {
    return apiFetch(`/users/${id}/change-password`, 'POST', { newPassword });
  },
};
