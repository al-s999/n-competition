import { Participant } from "./types";
import { createClient } from "@/utils/supabase/client";
import { appCache } from "@/utils/cache";

export class ParticipantService {
  /**
   * Maps Supabase row (including joined user data) to UI Participant type
   */
  private static mapToParticipant(row: any): Participant {
    return {
      id: row.id,
      competition_id: row.competition_id,
      user_id: row.user_id,
      name: row.users?.name || 'Unknown',
      email: row.users?.email || 'Unknown',
      status: row.registration_status as Participant["status"],
      is_paid: row.payment_status === 'paid',
      is_finalist: row.is_finalist || false,
      is_present: row.is_present || false,
      category: row.category || undefined,
      subject: row.subject || undefined,
      school_name: row.school_name || undefined,
      games_played: row.games_played || 0,
      avg_score: row.avg_score || 0,
      created_at: row.joined_at,
      registered_at: row.joined_at,
    };
  }

  static async getParticipantsByCompetition(competitionId: string): Promise<Participant[]> {
    return appCache.withCache(`parts_${competitionId}`, async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          users!inner (name, email)
        `)
        .eq('competition_id', competitionId);

      if (error) {
        console.error('Error fetching participants:', error);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        competition_id: row.competition_id,
        user_id: row.user_id,
        name: row.users?.name || 'Unknown User',
        email: row.users?.email || 'No Email',
        school_name: row.school_name,
        category: row.category,
        subject: row.subject,
        paid: row.payment_status === 'PAID',
        is_finalist: row.is_finalist || false,
        is_present: row.is_present || false,
        games_played: row.games_played || 0,
        avg_score: row.avg_score || 0,
        joined_at: row.joined_at,
      })) as unknown as Participant[];
    }, 5 * 60 * 1000); // 5 minutes cache
  }

  static async updateStatus(
    participantId: string,
    status: Participant["status"]
  ): Promise<void> {
    const supabase = createClient();
    const updateData: any = { registration_status: status };
    if (['paid', 'qualified', 'final'].includes(status)) {
      updateData.payment_status = 'paid';
    }
    await supabase.from('participants').update(updateData).eq('id', participantId);
  }
  
  static async updatePayment(participantId: string, isPaid: boolean): Promise<void> {
    const supabase = createClient();
    // Retrieve current status
    const { data } = await supabase.from('participants').select('registration_status').eq('id', participantId).single();
    
    const updateData: any = { payment_status: isPaid ? 'paid' : 'unpaid' };
    
    if (isPaid && data?.registration_status === 'registered') {
      updateData.registration_status = 'paid';
    }
    
    await supabase.from('participants').update(updateData).eq('id', participantId);
  }

  static async toggleFinalist(participantId: string): Promise<void> {
    const supabase = createClient();
    const { data } = await supabase.from('participants').select('is_finalist').eq('id', participantId).single();
    if (data) {
      const isFinalist = !data.is_finalist;
      const status = isFinalist ? 'final' : 'qualified';
      await supabase.from('participants').update({ is_finalist: isFinalist, registration_status: status }).eq('id', participantId);
    }
  }

  static async batchFinalist(participantIds: string[], isFinalist: boolean): Promise<void> {
    const supabase = createClient();
    const status = isFinalist ? 'final' : 'qualified';
    await supabase
      .from('participants')
      .update({ is_finalist: isFinalist, registration_status: status })
      .in('id', participantIds);
  }

  static async toggleAttendance(participantId: string, isPresent: boolean): Promise<void> {
    const supabase = createClient();
    await supabase.from('participants').update({ is_present: isPresent }).eq('id', participantId);
  }
}
