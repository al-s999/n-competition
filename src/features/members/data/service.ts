import { CompetitionMember, CompetitionRole } from "./types";
import { createClient } from "@/utils/supabase/client";

export class MemberService {
  static async getMember(
    competitionId: string,
    userId: string
  ): Promise<CompetitionMember | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitions')
      .select('id, mc_id, manager_id, receptionist_id, created_at')
      .eq('id', competitionId)
      .single();

    if (error || !data) return null;

    if (data.mc_id === userId) return { id: data.id, competition_id: data.id, user_id: userId, role: 'MC', created_at: data.created_at };
    if (data.manager_id === userId) return { id: data.id, competition_id: data.id, user_id: userId, role: 'MANAGER', created_at: data.created_at };
    if (data.receptionist_id === userId) return { id: data.id, competition_id: data.id, user_id: userId, role: 'RECEPTIONIST', created_at: data.created_at };

    return null;
  }

  static async getMembersByCompetition(
    competitionId: string
  ): Promise<CompetitionMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitions')
      .select('id, mc_id, manager_id, receptionist_id, created_at')
      .eq('id', competitionId)
      .single();

    if (error || !data) return [];

    const members: CompetitionMember[] = [];
    if (data.mc_id) members.push({ id: data.id + '-mc', competition_id: data.id, user_id: data.mc_id, role: 'MC', created_at: data.created_at });
    if (data.manager_id) members.push({ id: data.id + '-mgr', competition_id: data.id, user_id: data.manager_id, role: 'MANAGER', created_at: data.created_at });
    if (data.receptionist_id) members.push({ id: data.id + '-rec', competition_id: data.id, user_id: data.receptionist_id, role: 'RECEPTIONIST', created_at: data.created_at });

    return members;
  }

  static async getMembersByUser(
    userId: string
  ): Promise<CompetitionMember[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('competitions')
      .select('id, mc_id, manager_id, receptionist_id, created_at')
      .or(`mc_id.eq.${userId},manager_id.eq.${userId},receptionist_id.eq.${userId}`);

    if (error || !data) return [];

    const members: CompetitionMember[] = [];
    for (const comp of data) {
      if (comp.mc_id === userId) members.push({ id: comp.id + '-mc', competition_id: comp.id, user_id: userId, role: 'MC', created_at: comp.created_at });
      if (comp.manager_id === userId) members.push({ id: comp.id + '-mgr', competition_id: comp.id, user_id: userId, role: 'MANAGER', created_at: comp.created_at });
      if (comp.receptionist_id === userId) members.push({ id: comp.id + '-rec', competition_id: comp.id, user_id: userId, role: 'RECEPTIONIST', created_at: comp.created_at });
    }
    return members;
  }

  // Note: These mutations might need adjusting if the UI is trying to add multiple members
  static async releaseMembers(competitionId: string): Promise<void> {
    const supabase = createClient();
    await supabase.from('competitions').update({ mc_id: null, manager_id: null, receptionist_id: null }).eq('id', competitionId);
  }

  static async createMember(member: CompetitionMember): Promise<CompetitionMember> {
    const supabase = createClient();
    const updateData: any = {};
    if (member.role === 'MC') updateData.mc_id = member.user_id;
    if (member.role === 'MANAGER') updateData.manager_id = member.user_id;
    if (member.role === 'RECEPTIONIST') updateData.receptionist_id = member.user_id;
    
    await supabase.from('competitions').update(updateData).eq('id', member.competition_id);
    return { ...member, id: crypto.randomUUID() };
  }

  static async deleteMember(id: string): Promise<void> {
    // Cannot easily delete without knowing competition ID and role from just 'id', unless we parse it.
    // Our ID is formatted as `${competitionId}-${role}`.
    const parts = id.split('-');
    if (parts.length >= 2) {
      const roleStr = parts.pop();
      const compId = parts.join('-');
      const supabase = createClient();
      const updateData: any = {};
      if (roleStr === 'mc') updateData.mc_id = null;
      if (roleStr === 'mgr') updateData.manager_id = null;
      if (roleStr === 'rec') updateData.receptionist_id = null;
      await supabase.from('competitions').update(updateData).eq('id', compId);
    }
  }
}
