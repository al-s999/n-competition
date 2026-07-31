import { CompetitionMember } from './types';

export const DUMMY_MEMBERS: CompetitionMember[] = [
  { id: 'cm1', competition_id: 'c1', user_id: 'u2', role: 'MANAGER', created_at: new Date().toISOString() },
  { id: 'cm2', competition_id: 'c1', user_id: 'u3', role: 'RECEPTIONIST', created_at: new Date().toISOString() },
  { id: 'cm3', competition_id: 'c1', user_id: 'u4', role: 'MC', created_at: new Date().toISOString() }
];
