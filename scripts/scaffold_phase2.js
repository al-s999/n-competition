const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src/features');

const domains = {
  auth: {
    types: `export type GlobalRole = 'competition' | 'none';

export interface User {
  id: string;
  email: string;
  role: GlobalRole;
}
`,
    dummy: `import { User } from './types';

export const DUMMY_USERS: User[] = [
  { id: 'u1', email: 'owner@example.com', role: 'competition' },
  { id: 'u2', email: 'manager@example.com', role: 'none' },
  { id: 'u3', email: 'receptionist@example.com', role: 'none' },
  { id: 'u4', email: 'mc@example.com', role: 'none' },
  { id: 'u5', email: 'player@example.com', role: 'none' },
];
`,
    service: `import { User } from './types';
import { DUMMY_USERS } from './dummy';

export class AuthService {
  static async getCurrentUser(userId: string): Promise<User | null> {
    return DUMMY_USERS.find(u => u.id === userId) || null;
  }
}
`
  },
  competitions: {
    types: `export type CompetitionStatus = 'draft' | 'registration' | 'ongoing' | 'finished';

export interface Competition {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  status: CompetitionStatus;
  created_at: string;
  updated_at: string;
}
`,
    dummy: `import { Competition } from './types';

export const DUMMY_COMPETITIONS: Competition[] = [
  {
    id: 'c1',
    name: 'Turnamen Catur Tahunan',
    description: 'Turnamen catur untuk memperebutkan gelar master',
    owner_id: 'u1',
    status: 'ongoing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
`,
    service: `import { Competition } from './types';
import { DUMMY_COMPETITIONS } from './dummy';

export class CompetitionService {
  static async getCompetitionsByOwner(ownerId: string): Promise<Competition[]> {
    return DUMMY_COMPETITIONS.filter(c => c.owner_id === ownerId);
  }

  static async getCompetitionById(id: string): Promise<Competition | null> {
    return DUMMY_COMPETITIONS.find(c => c.id === id) || null;
  }
}
`
  },
  members: {
    types: `export type CompetitionRole = 'manager' | 'receptionist' | 'mc';

export interface CompetitionMember {
  id: string;
  competition_id: string;
  user_id: string;
  role: CompetitionRole;
  created_at: string;
}
`,
    dummy: `import { CompetitionMember } from './types';

export const DUMMY_MEMBERS: CompetitionMember[] = [
  { id: 'cm1', competition_id: 'c1', user_id: 'u2', role: 'manager', created_at: new Date().toISOString() },
  { id: 'cm2', competition_id: 'c1', user_id: 'u3', role: 'receptionist', created_at: new Date().toISOString() },
  { id: 'cm3', competition_id: 'c1', user_id: 'u4', role: 'mc', created_at: new Date().toISOString() }
];
`,
    service: `import { CompetitionMember } from './types';
import { DUMMY_MEMBERS } from './dummy';

export class MemberService {
  static async getMember(competitionId: string, userId: string): Promise<CompetitionMember | null> {
    return DUMMY_MEMBERS.find(m => m.competition_id === competitionId && m.user_id === userId) || null;
  }
  
  static async getMembersByCompetition(competitionId: string): Promise<CompetitionMember[]> {
    return DUMMY_MEMBERS.filter(m => m.competition_id === competitionId);
  }
}
`
  },
  participants: {
    types: `export type ParticipantStatus = 'registered' | 'confirmed' | 'paid' | 'qualified' | 'final';

export interface Participant {
  id: string;
  competition_id: string;
  name: string;
  email: string;
  status: ParticipantStatus;
  created_at: string;
}
`,
    dummy: `import { Participant } from './types';

export const DUMMY_PARTICIPANTS: Participant[] = [
  { id: 'p1', competition_id: 'c1', name: 'Budi Santoso', email: 'budi@example.com', status: 'final', created_at: new Date().toISOString() },
  { id: 'p2', competition_id: 'c1', name: 'Andi M', email: 'andi@example.com', status: 'final', created_at: new Date().toISOString() },
  { id: 'p3', competition_id: 'c1', name: 'Siti K', email: 'siti@example.com', status: 'paid', created_at: new Date().toISOString() },
];
`,
    service: `import { Participant } from './types';
import { DUMMY_PARTICIPANTS } from './dummy';

export class ParticipantService {
  static async getParticipantsByCompetition(competitionId: string): Promise<Participant[]> {
    return DUMMY_PARTICIPANTS.filter(p => p.competition_id === competitionId);
  }
}
`
  },
  payments: {
    types: `export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface Payment {
  id: string;
  participant_id: string;
  amount: number;
  proof_url: string;
  status: PaymentStatus;
  created_at: string;
}
`,
    dummy: `import { Payment } from './types';

export const DUMMY_PAYMENTS: Payment[] = [
  { id: 'pay1', participant_id: 'p1', amount: 50000, proof_url: '/dummy-proof1.jpg', status: 'verified', created_at: new Date().toISOString() },
  { id: 'pay2', participant_id: 'p2', amount: 50000, proof_url: '/dummy-proof2.jpg', status: 'verified', created_at: new Date().toISOString() },
  { id: 'pay3', participant_id: 'p3', amount: 50000, proof_url: '/dummy-proof3.jpg', status: 'pending', created_at: new Date().toISOString() },
];
`,
    service: `import { Payment } from './types';
import { DUMMY_PAYMENTS } from './dummy';

export class PaymentService {
  static async getPaymentByParticipant(participantId: string): Promise<Payment | null> {
    return DUMMY_PAYMENTS.find(p => p.participant_id === participantId) || null;
  }
}
`
  },
  bracket: {
    types: `export type StageType = 'qualification' | 'group' | 'knockout';

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
`,
    dummy: `import { Stage, Match } from './types';

export const DUMMY_STAGES: Stage[] = [
  { id: 's1', competition_id: 'c1', type: 'knockout', name: 'Final' }
];

export const DUMMY_MATCHES: Match[] = [
  { id: 'm1', stage_id: 's1', participant_1: 'p1', participant_2: 'p2', winner_id: null, schedule: new Date().toISOString() }
];
`,
    service: `import { Stage, Match } from './types';
import { DUMMY_STAGES, DUMMY_MATCHES } from './dummy';

export class BracketService {
  static async getStages(competitionId: string): Promise<Stage[]> {
    return DUMMY_STAGES.filter(s => s.competition_id === competitionId);
  }

  static async getMatches(stageId: string): Promise<Match[]> {
    return DUMMY_MATCHES.filter(m => m.stage_id === stageId);
  }
}
`
  },
  attendance: {
    types: `export type AttendanceStatus = 'present' | 'absent';

export interface Attendance {
  id: string;
  match_id: string;
  participant_id: string;
  status: AttendanceStatus;
  marked_by: string;
  timestamp: string;
}
`,
    dummy: `import { Attendance } from './types';

export const DUMMY_ATTENDANCES: Attendance[] = [
  { id: 'a1', match_id: 'm1', participant_id: 'p1', status: 'present', marked_by: 'u3', timestamp: new Date().toISOString() }
];
`,
    service: `import { Attendance } from './types';
import { DUMMY_ATTENDANCES } from './dummy';

export class AttendanceService {
  static async getAttendance(matchId: string): Promise<Attendance[]> {
    return DUMMY_ATTENDANCES.filter(a => a.match_id === matchId);
  }
}
`
  }
};

for (const [domain, files] of Object.entries(domains)) {
  const domainPath = path.join(srcDir, domain, 'data');
  fs.mkdirSync(domainPath, { recursive: true });
  fs.writeFileSync(path.join(domainPath, 'types.ts'), files.types);
  fs.writeFileSync(path.join(domainPath, 'dummy.ts'), files.dummy);
  fs.writeFileSync(path.join(domainPath, 'service.ts'), files.service);
}

console.log('Phase 2 scaffolding completed.');
