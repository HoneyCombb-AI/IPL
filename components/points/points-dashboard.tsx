"use client";

import { useState } from "react";
import { MatchBuilder } from "@/components/points/match-builder";
import { MatchHistory } from "@/components/points/match-history";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { MatchSummary, PointsAuctionTeam, PointsIplTeam } from "@/lib/points/types";
import type { MatchBuilderDraft, MatchEditSession } from "@/components/points/match-builder";

type PointsDashboardProps = {
  iplTeams: PointsIplTeam[];
  auctionTeams: PointsAuctionTeam[];
  initialMatches: MatchSummary[];
  usesDemoData: boolean;
};

type MatchRow = {
  id: string;
  match_date: string;
  match_label: string | null;
  venue: string | null;
  status: "draft" | "finalized";
  ipl_team_1: PointsIplTeam | PointsIplTeam[] | null;
  ipl_team_2: PointsIplTeam | PointsIplTeam[] | null;
  match_auction_team_totals: {
    total_points: number;
    is_completed: boolean;
    auction_teams: { id: string; team_name: string } | { id: string; team_name: string }[] | null;
  }[];
};

export function PointsDashboard({
  iplTeams,
  auctionTeams,
  initialMatches,
  usesDemoData,
}: PointsDashboardProps) {
  const [matches, setMatches] = useState<MatchSummary[]>(initialMatches);
  const [editSession, setEditSession] = useState<MatchEditSession | null>(null);

  type MatchEditStatsRow = {
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
    is_captain: boolean;
    is_vice_captain: boolean;
    points_breakdown_json: Record<string, number> | null;
  };

  async function refreshMatches() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    const { data, error } = await supabase
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
      .order("match_date", { ascending: false });

    if (error || !data) {
      return;
    }

    const normalized = (data as MatchRow[])
      .map((match) => {
        const t1 = Array.isArray(match.ipl_team_1) ? match.ipl_team_1[0] ?? null : match.ipl_team_1;
        const t2 = Array.isArray(match.ipl_team_2) ? match.ipl_team_2[0] ?? null : match.ipl_team_2;
        if (!t1 || !t2) {
          return null;
        }
        return {
          id: match.id,
          match_date: match.match_date,
          match_label: match.match_label,
          venue: match.venue,
          status: match.status,
          ipl_team_1: t1,
          ipl_team_2: t2,
          totals: (match.match_auction_team_totals ?? []).map((total) => {
            const auctionTeam = Array.isArray(total.auction_teams)
              ? total.auction_teams[0] ?? null
              : total.auction_teams;
            return {
              auction_team_id: auctionTeam?.id ?? "",
              auction_team_name: auctionTeam?.team_name ?? "Unknown",
              total_points: Number(total.total_points ?? 0),
              is_completed: Boolean(total.is_completed),
            };
          }),
        } as MatchSummary;
      })
      .filter((match): match is MatchSummary => Boolean(match));

    setMatches(normalized);
  }

  async function startEditMatch(matchId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }
    const match = matches.find((item) => item.id === matchId);
    if (!match) {
      return;
    }

    const { data, error } = await supabase
      .from("match_player_stats")
      .select(
        `
        player_id,
        runs,
        balls,
        fours,
        sixes,
        dismissed_for_duck,
        overs,
        maidens,
        runs_conceded,
        wickets,
        wides,
        no_balls,
        catches,
        stumpings,
        runout_direct,
        runout_assist,
        is_playing_xi,
        is_captain,
        is_vice_captain,
        points_breakdown_json
      `,
      )
      .eq("match_id", matchId);

    if (error) {
      return;
    }

    const draftByPlayerId = (data as MatchEditStatsRow[]).reduce<Record<string, MatchBuilderDraft>>(
      (acc, row) => {
        const breakdown = row.points_breakdown_json ?? {};
        const dotBalls = Number(breakdown.dotBalls ?? 0);
        const lbwBowledWickets = Math.max(0, Number(breakdown.lbwBowledBonus ?? 0) / 8);
        acc[row.player_id] = {
          runs: Number(row.runs ?? 0),
          balls: Number(row.balls ?? 0),
          fours: Number(row.fours ?? 0),
          sixes: Number(row.sixes ?? 0),
          dismissed_for_duck: Boolean(row.dismissed_for_duck),
          overs: Number(row.overs ?? 0),
          maidens: Number(row.maidens ?? 0),
          runs_conceded: Number(row.runs_conceded ?? 0),
          wickets: Number(row.wickets ?? 0),
          dot_balls: Number.isFinite(dotBalls) ? dotBalls : 0,
          lbw_bowled_wickets: Number.isFinite(lbwBowledWickets) ? lbwBowledWickets : 0,
          wides: Number(row.wides ?? 0),
          no_balls: Number(row.no_balls ?? 0),
          catches: Number(row.catches ?? 0),
          stumpings: Number(row.stumpings ?? 0),
          runout_direct: Number(row.runout_direct ?? 0),
          runout_assist: Number(row.runout_assist ?? 0),
          played: Boolean(row.is_playing_xi),
          is_captain: Boolean(row.is_captain),
          is_vice_captain: Boolean(row.is_vice_captain),
        };
        return acc;
      },
      {},
    );

    const venue = match.venue ?? "";
    const team1VenueCode = `${match.ipl_team_1.short_code}_HOME`;
    const team2VenueCode = `${match.ipl_team_2.short_code}_HOME`;
    const venueSide = venue === team1VenueCode ? "team1" : venue === team2VenueCode ? "team2" : "";

    setEditSession({
      key: `${matchId}-${Date.now()}`,
      matchId: match.id,
      selectedTeam1: match.ipl_team_1.id,
      selectedTeam2: match.ipl_team_2.id,
      matchDate: match.match_date,
      venueSide,
      completedTeamIds: match.totals.filter((total) => total.is_completed).map((total) => total.auction_team_id),
      draftByPlayerId,
    });
  }

  return (
    <div className="space-y-6">
      {usesDemoData ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Supabase env or tables are unavailable. Points page needs Supabase to save and view matches.
        </p>
      ) : null}

      <MatchBuilder
        iplTeams={iplTeams}
        auctionTeams={auctionTeams}
        onDataChanged={refreshMatches}
        editSession={editSession}
      />
      <MatchHistory matches={matches} onDataChanged={refreshMatches} onEditMatch={startEditMatch} />
    </div>
  );
}
