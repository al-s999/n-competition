export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface Payment {
  id: string;
  participant_id: string;
  amount: number;
  proof_url: string;
  status: PaymentStatus;
  created_at: string;
}
