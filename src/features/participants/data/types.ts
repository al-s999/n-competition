export type ParticipantStatus = 'registered' | 'confirmed' | 'paid' | 'qualified' | 'final' | 'rejected';

export interface Participant {
  id: string;
  competition_id: string;
  user_id?: string;
  name: string;
  username?: string;
  avatar?: string | null;
  email: string;
  status: ParticipantStatus;
  is_paid?: boolean;
  is_finalist?: boolean;
  is_present?: boolean;
  category?: string;
  subject?: string;
  school_name?: string;
  games_played?: number;
  avg_score?: number;
  created_at: string;
  registered_at?: string;
}
