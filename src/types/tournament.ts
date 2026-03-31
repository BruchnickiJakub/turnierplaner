import type { CountingMode } from "@/lib/tournament-modes";

export type TournamentRow = {
  id: string;
  user_id: string;
  title: string;
  sport: string | null;
  description: string | null;
  format: string | null;
  team_count: number | null;
  modus_key: string | null;
  best_placement: number | null;
  first_match_number: number | null;
  counting_mode: CountingMode | string | null;
  court_count: number | null;
  group_ranking_rule: string | null;
  h2h_includes_gd_gf: boolean | null;
  group_points_preset: string | null;
  participant_names: unknown;
  tournament_start_at?: string | null;
  group_match_duration_minutes?: number | null;
  ko_match_duration_minutes?: number | null;
  created_at: string;
  updated_at: string;
};
