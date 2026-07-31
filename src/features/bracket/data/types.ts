export type StageType = 'qualification' | 'group' | 'knockout';

export interface Stage {
  id: string;
  competition_id: string;
  type: StageType;
  name: string;
}

export interface Match {
  id: string;
  stage_id: string;
  participant_1: string | null;
  participant_2: string | null;
  winner_id: string | null;
  schedule: string;
}
