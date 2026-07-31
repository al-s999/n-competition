export type CompetitionStatus = 'draft' | 'registration' | 'ongoing' | 'finished';

export interface Competition {
  id: string;
  name: string; // Used as title in admin
  title?: string; // For compatibility with admin
  slug?: string;
  description: string;
  owner_id: string;
  status: CompetitionStatus;
  created_at: string;
  updated_at: string;
  rules?: string[];
  registration_start_date?: string;
  registration_end_date?: string;
  qualification_start_date?: string | null;
  qualification_end_date?: string | null;
  final_start_date?: string | null;
  final_end_date?: string | null;
  poster_url?: string | null;
  category?: string | null;
  registration_fee?: string | null;
  prize_pool?: string | null;
  registration_link?: string | null;
  gallery?: string[] | null;

  // Additional fields used by page.tsx
  registration_start?: string | null;
  registration_end?: string | null;
  qualification_start?: string | null;
  qualification_end?: string | null;
  grandfinal_start?: string | null;
  grandfinal_end?: string | null;
  banner_url?: string | null;
  entry_fee?: number | string;
  total_prize?: number | string;
  max_participants?: number | null;
  categories?: any;
  subjects?: any;
  is_split_by_subject?: boolean;
  prize_allocation?: any;
  progression_details?: {
    toSemifinal?: number;
    toFinal?: number;
  } | null;
  is_limit?: boolean;
  registration_fees?: any[];
  location?: string | null;
}
