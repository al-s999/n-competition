import { Payment } from './types';

export const DUMMY_PAYMENTS: Payment[] = [
  { id: 'pay1', participant_id: 'p1', amount: 50000, proof_url: '/dummy-proof1.jpg', status: 'verified', created_at: new Date().toISOString() },
  { id: 'pay2', participant_id: 'p2', amount: 50000, proof_url: '/dummy-proof2.jpg', status: 'verified', created_at: new Date().toISOString() },
  { id: 'pay3', participant_id: 'p3', amount: 50000, proof_url: '/dummy-proof3.jpg', status: 'pending', created_at: new Date().toISOString() },
];
