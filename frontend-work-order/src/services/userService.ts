import api from '@/src/api/axios';
import { User } from '@/src/types/user';

export const userService = {
  getUsers: async (role?: string): Promise<User[]> => {
    const params = role ? { role } : {};
    const { data } = await api.get('/users', { params });
    return data;
  },

  getUserById: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  }
};
