import { Competition, CompetitionStatus } from "./types";
import { createClient } from "@/utils/supabase/client";
import { appCache } from "@/utils/cache";

export class CompetitionService {
  /**
   * Maps a raw Supabase competition row to the UI's Competition interface
   */
  private static mapToCompetition(row: any): Competition {
    return {
      id: row.id,
      name: row.title || '', // Map title to name for UI compatibility
      title: row.title,
      description: row.description || '',
      owner_id: row.creator_id, // Map creator_id to owner_id
      status: row.status as CompetitionStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      rules: row.rules ? [row.rules] : undefined, // Quick array wrap if needed
      registration_start_date: row.registration_start,
      registration_end_date: row.registration_end,
      registration_start: row.registration_start,
      registration_end: row.registration_end,
      qualification_start: row.match_start,
      qualification_end: row.match_end,
      poster_url: row.poster_url,
      registration_link: row.registration_link,
      is_limit: row.is_limit,
      max_participants: row.max_participants,
      progression_details: {
        toSemifinal: row.to_semifinal,
        toFinal: row.to_final,
      },
      is_split_by_subject: row.is_split_by_subject,
      entry_fee: row.fee,
      total_prize: row.total_prize,
      categories: row.categories || [],
      subjects: row.subjects || [],
      prize_allocation: row.prize_allocations || {},
      location: row.location,
    };
  }

  static async getCompetitionsByOwner(
    ownerId: string
  ): Promise<Competition[]> {
    return appCache.withCache(`comps_owner_${ownerId}`, async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('creator_id', ownerId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.error("Error fetching competitions by owner:", error);
        return [];
      }
      return data.map(this.mapToCompetition);
    }, 5 * 60 * 1000);
  }

  static async getCompetitionById(id: string): Promise<Competition | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToCompetition(data);
  }

  static async updateStatus(
    competitionId: string,
    status: CompetitionStatus
  ): Promise<void> {
    const supabase = createClient();
    await supabase
      .from('competitions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', competitionId);
  }

  static async createCompetition(
    name: string,
    description: string,
    ownerId: string,
    otherData: any = {}
  ): Promise<Competition | null> {
    const supabase = createClient();
    
    // Map from UI format to Supabase format
    const insertData = {
      title: name,
      description,
      creator_id: ownerId,
      status: "draft",
      location: otherData.location || null,
      rules: otherData.rules || null,
      registration_link: otherData.registration_link || null,
      is_limit: otherData.is_limit || false,
      max_participants: otherData.max_participants || null,
      to_semifinal: otherData.to_semifinal || null,
      to_final: otherData.to_final || null,
      is_split_by_subject: otherData.is_split_by_subject || false,
      fee: otherData.entry_fee || null,
      total_prize: otherData.total_prize || null,
      is_auto_calculating: otherData.is_auto_calculating || false,
      registration_start: otherData.registration_start || null,
      registration_end: otherData.registration_end || null,
      match_start: otherData.qualification_start || null,
      match_end: otherData.qualification_end || null,
      poster_url: otherData.poster_url || null,
      categories: otherData.categories || [],
      subjects: otherData.subjects || [],
      prize_allocations: otherData.prize_allocation || {}
    };

    const { data, error } = await supabase
      .from('competitions')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create competition:", error);
      throw error;
    }

    return this.mapToCompetition(data);
  }

  static async updateCompetition(id: string, data: Partial<Competition>): Promise<void> {
    const supabase = createClient();
    
    // Map what might have been updated from UI to DB format
    const updateData: any = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updateData.title = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.rules !== undefined) updateData.rules = typeof data.rules === 'string' ? data.rules : (data.rules ? data.rules[0] : null);
    if (data.registration_link !== undefined) updateData.registration_link = data.registration_link;
    if (data.is_limit !== undefined) updateData.is_limit = data.is_limit;
    if (data.max_participants !== undefined) updateData.max_participants = data.max_participants;
    if (data.progression_details) {
      if (data.progression_details.toSemifinal !== undefined) updateData.to_semifinal = data.progression_details.toSemifinal;
      if (data.progression_details.toFinal !== undefined) updateData.to_final = data.progression_details.toFinal;
    }
    if (data.is_split_by_subject !== undefined) updateData.is_split_by_subject = data.is_split_by_subject;
    if (data.entry_fee !== undefined) updateData.fee = data.entry_fee;
    if (data.total_prize !== undefined) updateData.total_prize = data.total_prize;
    if (data.registration_start !== undefined) updateData.registration_start = data.registration_start;
    if (data.registration_end !== undefined) updateData.registration_end = data.registration_end;
    if (data.qualification_start !== undefined) updateData.match_start = data.qualification_start;
    if (data.qualification_end !== undefined) updateData.match_end = data.qualification_end;
    if (data.poster_url !== undefined) updateData.poster_url = data.poster_url;
    if (data.categories !== undefined) updateData.categories = data.categories;
    if (data.subjects !== undefined) updateData.subjects = data.subjects;
    if (data.prize_allocation !== undefined) updateData.prize_allocations = data.prize_allocation;

    const { error } = await supabase
      .from('competitions')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error("Failed to update competition:", error);
      throw error;
    }
  }

  static async deleteCompetition(id: string): Promise<void> {
    const supabase = createClient();
    await supabase.from('competitions').delete().eq('id', id);
  }

  static async getAll(): Promise<Competition[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(this.mapToCompetition);
  }
}
