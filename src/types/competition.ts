// ===== Dummy Player (for local mockup testing) =====

export interface PlayerSession {
  id: string;
  application?: string;
  quizTitle?: string;
  score: number;
  timeSeconds: number;
  createdAt: string;
}

export interface DummyPlayer {
  id: string;
  userId?: string;
  name: string;
  username?: string;
  avatar: string | null;
  gamesPlayed: number;
  avgScore: number;
  paid: boolean;
  registeredAt: string;
  isFinalist?: boolean;
  isPresent?: boolean;
  category?: string;
  subject?: string;
  schoolName?: string;
  sessions?: PlayerSession[];
}

export type RoundStatus = "pending" | "active" | "completed";

export interface CompetitionRound {
  id: string;
  competition_id: string;
  name: string;
  round_order: number;
  status: RoundStatus;
  created_at: string;
  groups?: CompetitionGroup[];
}

export interface CompetitionGroup {
  id: string;
  round_id: string;
  name: string;
  quiz_ids: string[] | null;
  created_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  participant_id: string;
  score: number;
  time_seconds: number;
  is_advanced: boolean;
  created_at: string;
  participant?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}



// ===== Mock Quiz (for local mockup testing) =====

export interface MockQuiz {
  id: string;
  title: string;
  questionCount: number;
  duration: number; // minutes
  isPublic?: boolean;
  creatorId?: string;
}

// ===== Competition Phase =====

export type CompetitionPhase =
  | "registration"
  | "payment"
  | "qualification"
  | "standings"
  | "group_stage"
  | "completed";
