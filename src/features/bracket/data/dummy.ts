import { Stage, Match } from './types';

export const DUMMY_STAGES: Stage[] = [
  { id: 's1', competition_id: 'c1', type: 'qualification', name: 'Kualifikasi' },
  { id: 's2', competition_id: 'c1', type: 'knockout', name: 'Semifinal' },
  { id: 's3', competition_id: 'c1', type: 'knockout', name: 'Final' },
];

export const DUMMY_MATCHES: Match[] = [
  { id: 'm1', stage_id: 's1', participant_1: 'Budi Santoso', participant_2: 'Andi M', winner_id: null, schedule: '2026-08-01T09:00:00Z' },
  { id: 'm2', stage_id: 's1', participant_1: 'Siti K', participant_2: 'Dina A', winner_id: null, schedule: '2026-08-01T10:00:00Z' },
  { id: 'm3', stage_id: 's2', participant_1: null, participant_2: null, winner_id: null, schedule: '2026-08-02T09:00:00Z' },
  { id: 'm4', stage_id: 's3', participant_1: null, participant_2: null, winner_id: null, schedule: '2026-08-03T09:00:00Z' },
];
