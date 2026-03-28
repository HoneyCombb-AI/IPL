export type PointsIplTeam = {
  id: string;
  name: string;
  short_code: string;
};

export type PointsPlayer = {
  id: string;
  player_name: string;
  player_role: string;
  ipl_team_id: string;
  ipl_team: PointsIplTeam;
};

export type PointsAuctionTeam = {
  id: string;
  team_name: string;
  owner_name: string;
  players: PointsPlayer[];
};

export type MatchSummary = {
  id: string;
  match_date: string;
  match_label: string | null;
  venue: string | null;
  status: "draft" | "finalized";
  ipl_team_1: PointsIplTeam;
  ipl_team_2: PointsIplTeam;
  totals: {
    auction_team_id: string;
    auction_team_name: string;
    total_points: number;
    is_completed: boolean;
  }[];
};

export type MatchPlayerStatsRecord = {
  id: string;
  match_id: string;
  player_id: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissed_for_duck: boolean;
  overs: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  wides: number;
  no_balls: number;
  catches: number;
  stumpings: number;
  runout_direct: number;
  runout_assist: number;
  is_playing_xi: boolean;
  is_impact_player: boolean;
  is_captain: boolean;
  is_vice_captain: boolean;
  base_points: number;
  multiplier: number;
  total_points: number;
  points_breakdown_json: Record<string, number>;
};

export type MatchPlayerStatsDraftInput = Omit<
  MatchPlayerStatsRecord,
  "id" | "match_id" | "points_breakdown_json"
> & {
  points_breakdown_json: Record<string, number>;
};
