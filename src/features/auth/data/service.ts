import { User } from './types';
import { createClient } from '@/utils/supabase/client';

export class AuthService {
  static async getCurrentUser(userId: string): Promise<User | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
    };
  }

  static async getAllUsers(): Promise<User[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    if (error || !data) return [];
    return data.map(d => ({
      id: d.id,
      email: d.email,
      name: d.name,
      role: d.role,
    }));
  }
}
