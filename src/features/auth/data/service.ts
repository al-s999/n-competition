import { User } from './types';
import { DUMMY_USERS } from './dummy';

export class AuthService {
  static async getCurrentUser(userId: string): Promise<User | null> {
    return DUMMY_USERS.find(u => u.id === userId) || null;
  }

  static async getAllUsers(): Promise<User[]> {
    return DUMMY_USERS;
  }
}
