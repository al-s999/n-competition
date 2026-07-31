import { Participant } from './types';

const indonesianCategories = ["Kindergarten", "SD/MI", "SMP/MTs", "SMA/SMK/MA", "University"];
const subjectsList = ["Mathematics", "Science", "English"];
let pCounter = 0;

const generateDummyParticipant = (id: string, name: string, email: string, status: Participant['status'], isFinalist = false): Participant => {
  const category = indonesianCategories[pCounter % indonesianCategories.length];
  const subject = subjectsList[pCounter % subjectsList.length];
  pCounter++;
  
  return {
    id,
    competition_id: 'c1',
    user_id: `user_${id}`,
    name,
    username: name.toLowerCase().replace(' ', '_'),
    email,
    status,
    is_paid: ['paid', 'qualified', 'final'].includes(status),
    is_finalist: isFinalist,
    is_present: isFinalist ? true : false,
    school_name: 'SMA Negeri 1 Jakarta',
    category,
    subject,
    games_played: ['qualified', 'final'].includes(status) ? 3 : 0,
    avg_score: ['qualified', 'final'].includes(status) ? 85.5 : 0,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    registered_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

export const DUMMY_PARTICIPANTS: Participant[] = [
  generateDummyParticipant('p1', 'Budi Santoso', 'budi@example.com', 'final', true),
  generateDummyParticipant('p2', 'Andi M', 'andi@example.com', 'final', true),
  generateDummyParticipant('p3', 'Siti K', 'siti@example.com', 'final', true),
  generateDummyParticipant('p4', 'Dina A', 'dina@example.com', 'final', true),
  generateDummyParticipant('p5', 'Reza F', 'reza@example.com', 'qualified'),
  generateDummyParticipant('p6', 'Linda B', 'linda@example.com', 'qualified'),
  generateDummyParticipant('p7', 'Surya C', 'surya@example.com', 'qualified'),
  generateDummyParticipant('p8', 'Maya D', 'maya@example.com', 'qualified'),
  generateDummyParticipant('p9', 'Agus E', 'agus@example.com', 'paid'),
  generateDummyParticipant('p10', 'Bela F', 'bela@example.com', 'paid'),
  generateDummyParticipant('p11', 'Citra G', 'citra@example.com', 'registered'),
  generateDummyParticipant('p12', 'Doni H', 'doni@example.com', 'registered'),
];
