import { Attendance } from './types';

export const DUMMY_ATTENDANCES: Attendance[] = [
  { id: 'a1', match_id: 'm1', participant_id: 'p1', status: 'present', marked_by: 'u3', timestamp: new Date().toISOString() }
];
