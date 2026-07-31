import { Stage, Match } from "./types";
import { createClient } from "@/utils/supabase/client";

export class BracketService {
  static async getStages(competitionId: string): Promise<Stage[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("stages")
      .select("*")
      .eq("competition_id", competitionId);
    
    if (error || !data) return [];
    return data;
  }

  static async getMatches(stageId: string): Promise<Match[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .eq("stage_id", stageId)
      .order("start_time", { ascending: true });

    if (error || !data) return [];
    
    return data.map((m: any) => ({
      id: m.id,
      stage_id: m.stage_id,
      participant_1: m.participant_1,
      participant_2: m.participant_2,
      winner_id: m.winner_id,
      schedule: m.start_time || new Date().toISOString(),
    }));
  }

  static async setWinner(matchId: string, winnerId: string): Promise<void> {
    const supabase = createClient();
    await supabase.from("matches").update({ winner_id: winnerId }).eq("id", matchId);
  }

  static async updateMatchParticipants(
    matchId: string,
    p1: string | null,
    p2: string | null
  ): Promise<void> {
    const supabase = createClient();
    await supabase.from("matches").update({ participant_1: p1, participant_2: p2 }).eq("id", matchId);
  }
}
