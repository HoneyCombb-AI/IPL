import { DEFAULT_TEAM_PALETTE, IPL_TEAM_COLORS } from "../team-colors";
import type { AuctionTeam, FilterOptions, IplTeam } from "../types";
import { getSupabaseServerClient, hasSupabaseEnv } from "../supabase/server";
import { FALLBACK_TEAMS } from "@/data/fallback-teams";

type PlayersRow = {
  id: string;
  player_name: string;
  player_role: string;
  ipl_teams: IplTeam | IplTeam[] | null;
};

type TeamRow = {
  id: string;
  team_name: string;
  owner_name: string;
  players: PlayersRow[];
};

export async function getTeamsPageData(): Promise<{
  teams: AuctionTeam[];
  filterOptions: FilterOptions;
  usesDemoData: boolean;
}> {
  if (!hasSupabaseEnv) {
    return {
      teams: FALLBACK_TEAMS,
      filterOptions: buildFilters(FALLBACK_TEAMS),
      usesDemoData: true,
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      teams: FALLBACK_TEAMS,
      filterOptions: buildFilters(FALLBACK_TEAMS),
      usesDemoData: true,
    };
  }

  const { data, error } = await supabase
    .from("auction_teams")
    .select(
      `
      id,
      team_name,
      owner_name,
      players (
        id,
        player_name,
        player_role,
        ipl_teams (
          id,
          name,
          short_code,
          primary_color,
          secondary_color
        )
      )
    `,
    )
    .order("team_name", { ascending: true });

  if (error || !data) {
    return {
      teams: FALLBACK_TEAMS,
      filterOptions: buildFilters(FALLBACK_TEAMS),
      usesDemoData: true,
    };
  }

  const teams: AuctionTeam[] = (data as TeamRow[]).map((team) => ({
    id: team.id,
    team_name: team.team_name,
    owner_name: team.owner_name,
    players: (team.players ?? [])
      .map((player) => ({
        id: player.id,
        player_name: player.player_name,
        player_role: player.player_role,
        ipl_team: Array.isArray(player.ipl_teams)
          ? (player.ipl_teams[0] ?? null)
          : (player.ipl_teams ?? null),
      }))
      .sort((a, b) => a.player_name.localeCompare(b.player_name)),
  }));

  return {
    teams,
    filterOptions: buildFilters(teams),
    usesDemoData: false,
  };
}

function buildFilters(teams: AuctionTeam[]): FilterOptions {
  const roleSet = new Set<string>();
  const iplTeamMap = new Map<string, { id: string; name: string; shortCode: string }>();
  const auctionTeams = teams
    .map((team) => ({ id: team.id, name: team.team_name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const team of teams) {
    for (const player of team.players) {
      roleSet.add(player.player_role);
      if (player.ipl_team) {
        iplTeamMap.set(player.ipl_team.id, {
          id: player.ipl_team.id,
          name: player.ipl_team.name,
          shortCode: player.ipl_team.short_code,
        });
      }
    }
  }

  return {
    roles: [...roleSet].sort(),
    auctionTeams,
    iplTeams: [...iplTeamMap.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((team) => ({
        ...team,
        palette: IPL_TEAM_COLORS[team.shortCode] ?? DEFAULT_TEAM_PALETTE,
      })),
  };
}
