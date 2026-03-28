import type { TeamPalette } from "./team-colors";

export type IplTeam = {
  id: string;
  name: string;
  short_code: string;
  primary_color: string;
  secondary_color: string;
};

export type Player = {
  id: string;
  player_name: string;
  player_role: string;
  ipl_team: IplTeam | null;
};

export type AuctionTeam = {
  id: string;
  team_name: string;
  owner_name: string;
  players: Player[];
};

export type FilterOptions = {
  roles: string[];
  auctionTeams: { id: string; name: string }[];
  iplTeams: { id: string; name: string; shortCode: string; palette: TeamPalette }[];
};
