export type AttendanceStatus = 'present' | 'absent';

export interface Attendance {
  id: string;
  match_id: string;
  participant_id: string;
  status: AttendanceStatus;
  marked_by: string;
  timestamp: string;
}
