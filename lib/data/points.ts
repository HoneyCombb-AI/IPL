import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { MatchSummary, PointsAuctionTeam, PointsIplTeam, PointsPlayer } from "@/lib/points/types";

type IplTeamRow = {
  id: string;
  name: string;
  short_code: string;
};

type PlayerRow = {
  id: string;
  player_name: string;
  player_role: string;
  ipl_team_id: string;
  ipl_teams: IplTeamRow | IplTeamRow[] | null;
};

type AuctionTeamRow = {
  id: string;
  team_name: string;
  owner_name: string;
  players: PlayerRow[];
};

type MatchRow = {
  id: string;
  match_date: string;
  match_label: string | null;
  venue: string | null;
  status: "draft" | "finalized";
  ipl_team_1: IplTeamRow | IplTeamRow[] | null;
  ipl_team_2: IplTeamRow | IplTeamRow[] | null;
  match_auction_team_totals: {
    total_points: number;
    is_completed: boolean;
    auction_teams: { id: string; team_name: string } | { id: string; team_name: string }[] | null;
  }[];
};

export async function getPointsPageData(): Promise<{
  iplTeams: PointsIplTeam[];
  auctionTeams: PointsAuctionTeam[];
  matches: MatchSummary[];
  usesDemoData: boolean;
}> {
  if (!hasSupabaseEnv) {
    return {
      iplTeams: [],
      auctionTeams: [],
      matches: [],
      usesDemoData: true,
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      iplTeams: [],
      auctionTeams: [],
      matches: [],
      usesDemoData: true,
    };
  }

  const [iplResult, auctionResult, matchesResult] = await Promise.all([
    supabase.from("ipl_teams").select("id, name, short_code").order("name", { ascending: true }),
    supabase
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
          ipl_team_id,
          ipl_teams (
            id,
            name,
            short_code
          )
        )
      `,
      )
      .order("team_name", { ascending: true }),
    supabase
      .from("matches")
      .select(
        `
        id,
        match_date,
        match_label,
        venue,
        status,
        ipl_team_1:ipl_team_1_id(id, name, short_code),
        ipl_team_2:ipl_team_2_id(id, name, short_code),
        match_auction_team_totals (
          total_points,
          is_completed,
          auction_teams:auction_team_id (
            id,
            team_name
          )
        )
      `,
      )
      .order("match_date", { ascending: false }),
  ]);

  if (iplResult.error || auctionResult.error || matchesResult.error) {
    return {
      iplTeams: [],
      auctionTeams: [],
      matches: [],
      usesDemoData: true,
    };
  }

  const iplTeams: PointsIplTeam[] = ((iplResult.data ?? []) as IplTeamRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    short_code: row.short_code,
  }));

  const auctionTeams: PointsAuctionTeam[] = ((auctionResult.data ?? []) as AuctionTeamRow[]).map(
    (team) => ({
      id: team.id,
      team_name: team.team_name,
      owner_name: team.owner_name,
      players: (team.players ?? [])
        .map((player) => {
          const iplTeam = Array.isArray(player.ipl_teams)
            ? player.ipl_teams[0] ?? null
            : player.ipl_teams;
          if (!iplTeam) {
            return null;
          }
          const normalized: PointsPlayer = {
            id: player.id,
            player_name: player.player_name,
            player_role: player.player_role,
            ipl_team_id: player.ipl_team_id,
            ipl_team: {
              id: iplTeam.id,
              name: iplTeam.name,
              short_code: iplTeam.short_code,
            },
          };
          return normalized;
        })
        .filter((player): player is PointsPlayer => Boolean(player))
        .sort((a, b) => a.player_name.localeCompare(b.player_name)),
    }),
  );

  const matches: MatchSummary[] = ((matchesResult.data ?? []) as MatchRow[])
    .map((match) => {
      const ipl1 = Array.isArray(match.ipl_team_1) ? match.ipl_team_1[0] ?? null : match.ipl_team_1;
      const ipl2 = Array.isArray(match.ipl_team_2) ? match.ipl_team_2[0] ?? null : match.ipl_team_2;
      if (!ipl1 || !ipl2) {
        return null;
      }

      return {
        id: match.id,
        match_date: match.match_date,
        match_label: match.match_label,
        venue: match.venue,
        status: match.status,
        ipl_team_1: {
          id: ipl1.id,
          name: ipl1.name,
          short_code: ipl1.short_code,
        },
        ipl_team_2: {
          id: ipl2.id,
          name: ipl2.name,
          short_code: ipl2.short_code,
        },
        totals: (match.match_auction_team_totals ?? []).map((total) => {
          const team = Array.isArray(total.auction_teams)
            ? total.auction_teams[0] ?? null
            : total.auction_teams;
          return {
            auction_team_id: team?.id ?? "",
            auction_team_name: team?.team_name ?? "Unknown",
            total_points: Number(total.total_points ?? 0),
            is_completed: Boolean(total.is_completed),
          };
        }),
      } as MatchSummary;
    })
    .filter((match): match is MatchSummary => Boolean(match));

  return {
    iplTeams,
    auctionTeams,
    matches,
    usesDemoData: false,
  };
}
