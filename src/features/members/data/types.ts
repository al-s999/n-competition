export type CompetitionRole = 'MANAGER' | 'RECEPTIONIST' | 'MC' | 'COMPETITION';

export interface CompetitionMember {
  id: string;
  competition_id: string;
  user_id: string;
  role: CompetitionRole;
  created_at: string;
}
