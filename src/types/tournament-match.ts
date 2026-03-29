export type TournamentMatchRow = {
  id: string;
  tournament_id: string;
  sort_index: number;
  match_phase?: "group" | "ko";
  group_code: string;
  pitch: number;
  start_time: string | null;
  slot_home: number | null;
  slot_away: number | null;
  label_home?: string | null;
  label_away?: string | null;
  goals_home: number | null;
  goals_away: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
