import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";

type MatchRef = {
  id: string;
  match_date: string;
  status: string;
};

type AuctionTeamRef = {
  id: string;
  team_name: string;
  owner_name: string;
};

type PlayerRef = {
  id: string;
  player_name: string;
  player_role: string;
  auction_team: { id: string; team_name: string } | { id: string; team_name: string }[] | null;
};

type TotalsRow = {
  total_points: number;
  is_completed: boolean;
  match: MatchRef | MatchRef[] | null;
  auction_team: AuctionTeamRef | AuctionTeamRef[] | null;
};

type PlayerStatsRow = {
  player_id: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  overs: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  catches: number;
  stumpings: number;
  runout_direct: number;
  runout_assist: number;
  total_points: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  points_breakdown_json: Record<string, number> | null;
  match: MatchRef | MatchRef[] | null;
  player: PlayerRef | PlayerRef[] | null;
};

export type StatsKpi = {
  label: string;
  value: string;
  helper?: string;
};

export type AuctionTeamStanding = {
  rank: number;
  auctionTeamId: string;
  auctionTeamName: string;
  ownerName: string;
  totalPoints: number;
  matchesCompleted: number;
  averagePoints: number;
  bestMatchPoints: number;
  recentFormAvg: number;
  recentFormTotal: number;
  topPlayerName: string;
  topPlayerPoints: number;
  totalRuns: number;
  totalBoundaries: number;
  totalSixes: number;
  totalWickets: number;
  totalDotBalls: number;
  totalMaidens: number;
  totalCatches: number;
  totalStumpings: number;
  totalRunoutInvolvements: number;
  captainVicePoints: number;
};

export type PlayerStatsSummary = {
  rank: number;
  playerId: string;
  playerName: string;
  auctionTeamId: string;
  auctionTeamName: string;
  playerRole: string;
  totalPoints: number;
  matchesPlayed: number;
  averagePoints: number;
  bestPoints: number;
  games50Plus: number;
  games100Plus: number;
  totalRuns: number;
  totalWickets: number;
  totalCatches: number;
  strikeRate: number;
  economy: number;
};

export type FantasyInsights = {
  highestSingleMatchPlayer: { playerName: string; points: number };
  mostConsistentPlayer: { playerName: string; games50Plus: number };
  mostExplosivePlayer: { playerName: string; games100Plus: number };
  topAuctionTeam: { teamName: string; points: number };
};

export type StatsPageData = {
  usesDemoData: boolean;
  kpis: StatsKpi[];
  auctionTeamStandings: AuctionTeamStanding[];
  playerLeaderboard: PlayerStatsSummary[];
  topBatters: PlayerStatsSummary[];
  topBowlers: PlayerStatsSummary[];
  topFielders: PlayerStatsSummary[];
  insights: FantasyInsights | null;
};

function toObject<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toNum(value: unknown): number {
  return Number(value ?? 0) || 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function oversToBalls(overs: number): number {
  const whole = Math.floor(overs);
  const part = Math.round((overs - whole) * 10);
  return whole * 6 + part;
}

export async function getStatsPageData(): Promise<StatsPageData> {
  if (!hasSupabaseEnv) {
    return {
      usesDemoData: true,
      kpis: [],
      auctionTeamStandings: [],
      playerLeaderboard: [],
      topBatters: [],
      topBowlers: [],
      topFielders: [],
      insights: null,
    };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return {
      usesDemoData: true,
      kpis: [],
      auctionTeamStandings: [],
      playerLeaderboard: [],
      topBatters: [],
      topBowlers: [],
      topFielders: [],
      insights: null,
    };
  }

  const [totalsResult, playerStatsResult] = await Promise.all([
    supabase
      .from("match_auction_team_totals")
      .select(
        `
        total_points,
        is_completed,
        match:match_id!inner(id, match_date, status),
        auction_team:auction_team_id!inner(id, team_name, owner_name)
      `,
      )
      .eq("match.status", "finalized"),
    supabase
      .from("match_player_stats")
      .select(
        `
        player_id,
        runs,
        balls,
        fours,
        sixes,
        overs,
        maidens,
        runs_conceded,
        wickets,
        catches,
        stumpings,
        runout_direct,
        runout_assist,
        total_points,
        is_captain,
        is_vice_captain,
        points_breakdown_json,
        match:match_id!inner(id, match_date, status),
        player:player_id!inner(
          id,
          player_name,
          player_role,
          auction_team:auction_team_id(id, team_name)
        )
      `,
      )
      .eq("match.status", "finalized"),
  ]);

  if (totalsResult.error || playerStatsResult.error) {
    return {
      usesDemoData: true,
      kpis: [],
      auctionTeamStandings: [],
      playerLeaderboard: [],
      topBatters: [],
      topBowlers: [],
      topFielders: [],
      insights: null,
    };
  }

  const totalsRows = (totalsResult.data ?? []) as TotalsRow[];
  const playerRows = (playerStatsResult.data ?? []) as PlayerStatsRow[];

  if (totalsRows.length === 0) {
    return {
      usesDemoData: false,
      kpis: [],
      auctionTeamStandings: [],
      playerLeaderboard: [],
      topBatters: [],
      topBowlers: [],
      topFielders: [],
      insights: null,
    };
  }

  const finalizedMatches = new Map<string, string>();
  for (const row of totalsRows) {
    const match = toObject(row.match);
    if (match?.id) {
      finalizedMatches.set(match.id, match.match_date);
    }
  }

  const teamBaseMap = new Map<string, { name: string; ownerName: string }>();
  const teamMatchPoints = new Map<string, { date: string; points: number }[]>();
  const teamCompletedCount = new Map<string, number>();
  const teamTotalPoints = new Map<string, number>();

  for (const row of totalsRows) {
    const team = toObject(row.auction_team);
    const match = toObject(row.match);
    if (!team || !match) {
      continue;
    }
    teamBaseMap.set(team.id, { name: team.team_name, ownerName: team.owner_name });
    const points = toNum(row.total_points);
    teamTotalPoints.set(team.id, (teamTotalPoints.get(team.id) ?? 0) + points);
    if (row.is_completed) {
      teamCompletedCount.set(team.id, (teamCompletedCount.get(team.id) ?? 0) + 1);
      const all = teamMatchPoints.get(team.id) ?? [];
      all.push({ date: match.match_date, points });
      teamMatchPoints.set(team.id, all);
    }
  }

  const playerMap = new Map<
    string,
    {
      playerName: string;
      auctionTeamId: string;
      auctionTeamName: string;
      playerRole: string;
      totalPoints: number;
      matchesPlayed: number;
      bestPoints: number;
      games50Plus: number;
      games100Plus: number;
      totalRuns: number;
      totalBalls: number;
      totalWickets: number;
      totalCatches: number;
      totalRunsConceded: number;
      totalBallsBowled: number;
    }
  >();

  const teamStatMap = new Map<
    string,
    {
      totalRuns: number;
      totalBoundaries: number;
      totalSixes: number;
      totalWickets: number;
      totalDotBalls: number;
      totalMaidens: number;
      totalCatches: number;
      totalStumpings: number;
      totalRunoutInvolvements: number;
      captainVicePoints: number;
    }
  >();

  for (const row of playerRows) {
    const player = toObject(row.player);
    const team = toObject(player?.auction_team ?? null);
    if (!player || !team) {
      continue;
    }

    const totalPoints = toNum(row.total_points);
    const current = playerMap.get(row.player_id) ?? {
      playerName: player.player_name,
      auctionTeamId: team.id,
      auctionTeamName: team.team_name,
      playerRole: player.player_role,
      totalPoints: 0,
      matchesPlayed: 0,
      bestPoints: 0,
      games50Plus: 0,
      games100Plus: 0,
      totalRuns: 0,
      totalBalls: 0,
      totalWickets: 0,
      totalCatches: 0,
      totalRunsConceded: 0,
      totalBallsBowled: 0,
    };
    current.totalPoints += totalPoints;
    current.matchesPlayed += 1;
    current.bestPoints = Math.max(current.bestPoints, totalPoints);
    if (totalPoints >= 50 && totalPoints < 100) {
      current.games50Plus += 1;
    }
    if (totalPoints >= 100) {
      current.games100Plus += 1;
    }
    current.totalRuns += toNum(row.runs);
    current.totalBalls += toNum(row.balls);
    current.totalWickets += toNum(row.wickets);
    current.totalCatches += toNum(row.catches);
    current.totalRunsConceded += toNum(row.runs_conceded);
    current.totalBallsBowled += oversToBalls(toNum(row.overs));
    playerMap.set(row.player_id, current);

    const teamCurrent = teamStatMap.get(team.id) ?? {
      totalRuns: 0,
      totalBoundaries: 0,
      totalSixes: 0,
      totalWickets: 0,
      totalDotBalls: 0,
      totalMaidens: 0,
      totalCatches: 0,
      totalStumpings: 0,
      totalRunoutInvolvements: 0,
      captainVicePoints: 0,
    };
    const breakdown = row.points_breakdown_json ?? {};
    const dotBalls = toNum(breakdown.dotBalls);
    teamCurrent.totalRuns += toNum(row.runs);
    teamCurrent.totalBoundaries += toNum(row.fours);
    teamCurrent.totalSixes += toNum(row.sixes);
    teamCurrent.totalWickets += toNum(row.wickets);
    teamCurrent.totalDotBalls += dotBalls;
    teamCurrent.totalMaidens += toNum(row.maidens);
    teamCurrent.totalCatches += toNum(row.catches);
    teamCurrent.totalStumpings += toNum(row.stumpings);
    teamCurrent.totalRunoutInvolvements += toNum(row.runout_direct) + toNum(row.runout_assist);
    if (row.is_captain || row.is_vice_captain) {
      teamCurrent.captainVicePoints += totalPoints;
    }
    teamStatMap.set(team.id, teamCurrent);
  }

  const playerLeaderboard = Array.from(playerMap.entries())
    .map(([playerId, player], index) => {
      const strikeRate = player.totalBalls > 0 ? (player.totalRuns / player.totalBalls) * 100 : 0;
      const economy =
        player.totalBallsBowled > 0 ? (player.totalRunsConceded * 6) / player.totalBallsBowled : 0;
      return {
        rank: index + 1,
        playerId,
        playerName: player.playerName,
        auctionTeamId: player.auctionTeamId,
        auctionTeamName: player.auctionTeamName,
        playerRole: player.playerRole,
        totalPoints: round2(player.totalPoints),
        matchesPlayed: player.matchesPlayed,
        averagePoints: round2(player.totalPoints / Math.max(1, player.matchesPlayed)),
        bestPoints: round2(player.bestPoints),
        games50Plus: player.games50Plus,
        games100Plus: player.games100Plus,
        totalRuns: player.totalRuns,
        totalWickets: player.totalWickets,
        totalCatches: player.totalCatches,
        strikeRate: round2(strikeRate),
        economy: round2(economy),
      } satisfies PlayerStatsSummary;
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.averagePoints !== a.averagePoints) {
        return b.averagePoints - a.averagePoints;
      }
      return a.playerName.localeCompare(b.playerName);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const topPlayerByTeam = new Map<string, { name: string; points: number }>();
  for (const row of playerLeaderboard) {
    const existing = topPlayerByTeam.get(row.auctionTeamId);
    if (!existing || row.totalPoints > existing.points) {
      topPlayerByTeam.set(row.auctionTeamId, { name: row.playerName, points: row.totalPoints });
    }
  }

  const auctionTeamStandings = Array.from(teamBaseMap.entries())
    .map(([teamId, team]) => {
      const totalPoints = round2(teamTotalPoints.get(teamId) ?? 0);
      const matchesCompleted = teamCompletedCount.get(teamId) ?? 0;
      const averagePoints = matchesCompleted > 0 ? round2(totalPoints / matchesCompleted) : 0;
      const recent = [...(teamMatchPoints.get(teamId) ?? [])]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);
      const recentFormTotal = round2(recent.reduce((sum, item) => sum + item.points, 0));
      const recentFormAvg = recent.length > 0 ? round2(recentFormTotal / recent.length) : 0;
      const bestMatchPoints = round2(
        (teamMatchPoints.get(teamId) ?? []).reduce((best, item) => Math.max(best, item.points), 0),
      );
      const topPlayer = topPlayerByTeam.get(teamId) ?? { name: "N/A", points: 0 };
      const teamStats = teamStatMap.get(teamId) ?? {
        totalRuns: 0,
        totalBoundaries: 0,
        totalSixes: 0,
        totalWickets: 0,
        totalDotBalls: 0,
        totalMaidens: 0,
        totalCatches: 0,
        totalStumpings: 0,
        totalRunoutInvolvements: 0,
        captainVicePoints: 0,
      };
      return {
        rank: 0,
        auctionTeamId: teamId,
        auctionTeamName: team.name,
        ownerName: team.ownerName,
        totalPoints,
        matchesCompleted,
        averagePoints,
        bestMatchPoints,
        recentFormAvg,
        recentFormTotal,
        topPlayerName: topPlayer.name,
        topPlayerPoints: topPlayer.points,
        ...teamStats,
      } satisfies AuctionTeamStanding;
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.averagePoints !== a.averagePoints) {
        return b.averagePoints - a.averagePoints;
      }
      return a.auctionTeamName.localeCompare(b.auctionTeamName);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const totalPointsAwarded = round2(
    auctionTeamStandings.reduce((sum, team) => sum + toNum(team.totalPoints), 0),
  );
  const matchCount = finalizedMatches.size;
  const avgPointsPerMatch = matchCount > 0 ? round2(totalPointsAwarded / matchCount) : 0;
  const topTeam = auctionTeamStandings[0] ?? null;
  const topPlayer = playerLeaderboard[0] ?? null;

  const bestSinglePlayer = [...playerLeaderboard].sort((a, b) => b.bestPoints - a.bestPoints)[0] ?? null;
  const consistentPlayer =
    [...playerLeaderboard].sort((a, b) => b.games50Plus - a.games50Plus)[0] ?? null;
  const explosivePlayer =
    [...playerLeaderboard].sort((a, b) => b.games100Plus - a.games100Plus)[0] ?? null;

  const insights: FantasyInsights | null =
    topTeam && topPlayer
      ? {
          highestSingleMatchPlayer: {
            playerName: bestSinglePlayer?.playerName ?? "N/A",
            points: bestSinglePlayer?.bestPoints ?? 0,
          },
          mostConsistentPlayer: {
            playerName: consistentPlayer?.playerName ?? "N/A",
            games50Plus: consistentPlayer?.games50Plus ?? 0,
          },
          mostExplosivePlayer: {
            playerName: explosivePlayer?.playerName ?? "N/A",
            games100Plus: explosivePlayer?.games100Plus ?? 0,
          },
          topAuctionTeam: {
            teamName: topTeam.auctionTeamName,
            points: topTeam.totalPoints,
          },
        }
      : null;

  const topBatters = [...playerLeaderboard]
    .sort((a, b) => {
      if (b.totalRuns !== a.totalRuns) {
        return b.totalRuns - a.totalRuns;
      }
      return b.strikeRate - a.strikeRate;
    })
    .slice(0, 8)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const topBowlers = [...playerLeaderboard]
    .sort((a, b) => {
      if (b.totalWickets !== a.totalWickets) {
        return b.totalWickets - a.totalWickets;
      }
      if (a.economy !== b.economy) {
        return a.economy - b.economy;
      }
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, 8)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const topFielders = [...playerLeaderboard]
    .sort((a, b) => {
      if (b.totalCatches !== a.totalCatches) {
        return b.totalCatches - a.totalCatches;
      }
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, 8)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const kpis: StatsKpi[] = [
    { label: "Finalized Matches", value: `${matchCount}` },
    { label: "Total Fantasy Points", value: totalPointsAwarded.toFixed(2) },
    { label: "Avg Points / Match", value: avgPointsPerMatch.toFixed(2) },
    {
      label: "Top Auction Team",
      value: topTeam ? topTeam.auctionTeamName : "N/A",
      helper: topTeam ? `${topTeam.totalPoints.toFixed(2)} pts` : undefined,
    },
    {
      label: "Top Player",
      value: topPlayer ? topPlayer.playerName : "N/A",
      helper: topPlayer ? `${topPlayer.totalPoints.toFixed(2)} pts` : undefined,
    },
  ];

  return {
    usesDemoData: false,
    kpis,
    auctionTeamStandings,
    playerLeaderboard: playerLeaderboard.slice(0, 20),
    topBatters,
    topBowlers,
    topFielders,
    insights,
  };
}
