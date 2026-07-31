import { Attendance } from "./types";
import { createClient } from "@/utils/supabase/client";

export class AttendanceService {
  static async getAttendanceByMatch(matchId: string): Promise<Attendance[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("attendances")
      .select("*")
      .eq("match_id", matchId);
    
    if (error || !data) return [];
    
    return data.map((a: any) => ({
      id: a.id,
      match_id: a.match_id,
      participant_id: a.participant_id,
      status: a.status,
      marked_by: a.marked_by,
      timestamp: a.timestamp,
    }));
  }

  static async markAttendance(
    matchId: string,
    participantId: string,
    status: Attendance["status"],
    markedBy: string
  ): Promise<void> {
    const supabase = createClient();
    // check if it exists
    const { data: existing } = await supabase
      .from("attendances")
      .select("id")
      .eq("match_id", matchId)
      .eq("participant_id", participantId)
      .single();

    if (existing) {
      await supabase
        .from("attendances")
        .update({ status, marked_by: markedBy, timestamp: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("attendances")
        .insert({
          match_id: matchId,
          participant_id: participantId,
          status,
          marked_by: markedBy,
        });
    }
  }
}
