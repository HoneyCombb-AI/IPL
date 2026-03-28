"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { MatchSummary, MatchPlayerStatsRecord } from "@/lib/points/types";

type DetailRow = MatchPlayerStatsRecord & {
  player_name: string;
  auction_team_name: string;
  ipl_team_short_code: string;
};

type MatchHistoryProps = {
  matches: MatchSummary[];
  onDataChanged: () => Promise<void> | void;
  onEditMatch: (matchId: string) => Promise<void> | void;
};

type MatchRow = {
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
  players:
    | {
        player_name: string;
        auction_teams: { team_name: string } | { team_name: string }[] | null;
        ipl_teams: { short_code: string } | { short_code: string }[] | null;
      }
    | {
        player_name: string;
        auction_teams: { team_name: string } | { team_name: string }[] | null;
        ipl_teams: { short_code: string } | { short_code: string }[] | null;
      }[];
};

export function MatchHistory({ matches, onDataChanged, onEditMatch }: MatchHistoryProps) {
  const supabase = getSupabaseBrowserClient();
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  async function loadMatchDetails(matchId: string) {
    if (!supabase) {
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("match_player_stats")
      .select(
        `
        id,
        match_id,
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
        is_impact_player,
        is_captain,
        is_vice_captain,
        base_points,
        multiplier,
        total_points,
        points_breakdown_json,
        players (
          player_name,
          auction_teams:auction_team_id (
            team_name
          ),
          ipl_teams:ipl_team_id (
            short_code
          )
        )
      `,
      )
      .eq("match_id", matchId)
      .order("total_points", { ascending: false });

    if (error || !data) {
      setDetailRows([]);
      setLoading(false);
      return;
    }

    const normalized = (data as MatchRow[]).map((row) => {
      const player = Array.isArray(row.players) ? row.players[0] : row.players;
      const auctionTeam = Array.isArray(player?.auction_teams)
        ? player?.auction_teams[0]
        : player?.auction_teams;
      const iplTeam = Array.isArray(player?.ipl_teams) ? player?.ipl_teams[0] : player?.ipl_teams;
      return {
        ...(row as MatchPlayerStatsRecord),
        player_name: player?.player_name ?? "Unknown",
        auction_team_name: auctionTeam?.team_name ?? "Unknown",
        ipl_team_short_code: iplTeam?.short_code ?? "-",
      };
    });

    setDetailRows(normalized);
    setLoading(false);
  }

  async function deleteMatch(matchId: string) {
    if (!supabase) {
      return;
    }
    const ok = window.confirm("Are you sure you want to delete this match and all saved points?");
    if (!ok) {
      return;
    }

    const { error } = await supabase.from("matches").delete().eq("id", matchId);
    if (error) {
      return;
    }

    if (selectedMatchId === matchId) {
      setSelectedMatchId("");
      setDetailRows([]);
    }
    await onDataChanged();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-100">Past Matches & Points</h2>
        <p className="text-sm text-zinc-400">
          Shows past matches (teams + date). Click one to open saved stats.
        </p>
      </header>

      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
            No matches saved yet.
          </p>
        ) : (
          matches.map((match) => (
            <div
              key={match.id}
              className={`w-full rounded-xl border px-3 py-2 ${
                selectedMatchId === match.id
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-zinc-700 bg-zinc-950/60"
              }`}
            >
              <button
                type="button"
                onClick={async () => {
                  setSelectedMatchId(match.id);
                  await loadMatchDetails(match.id);
                }}
                className="w-full text-left"
              >
                <p className="text-sm font-semibold text-zinc-100">
                  {match.ipl_team_1.short_code} vs {match.ipl_team_2.short_code}
                </p>
                <p className="text-xs text-zinc-400">{match.match_date}</p>
              </button>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void onEditMatch(match.id)}
                  className="rounded-full border border-indigo-500/60 px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/10"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteMatch(match.id)}
                  className="rounded-full border border-rose-500/60 px-3 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMatch ? (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-950/60 p-3">
          <h3 className="text-base font-semibold text-zinc-100">
            {selectedMatch.ipl_team_1.name} vs {selectedMatch.ipl_team_2.name}
          </h3>
          <p className="text-xs text-zinc-400">
            {selectedMatch.match_date}
            {selectedMatch.venue ? ` · ${selectedMatch.venue}` : ""}
            {selectedMatch.match_label ? ` · ${selectedMatch.match_label}` : ""}
          </p>
          <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {selectedMatch.totals.map((total) => (
              <div
                key={`${selectedMatch.id}-${total.auction_team_id}`}
                className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-2"
              >
                <p className="text-xs text-zinc-400">{total.auction_team_name}</p>
                <p className="text-sm font-semibold text-zinc-100">{total.total_points.toFixed(2)} pts</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-[900px] w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-300">
                <tr>
                  <th className="px-2 py-2">Player</th>
                  <th className="px-2 py-2">Auction Team</th>
                  <th className="px-2 py-2">IPL</th>
                  <th className="px-2 py-2">Runs</th>
                  <th className="px-2 py-2">Wkts</th>
                  <th className="px-2 py-2">Catches</th>
                  <th className="px-2 py-2">Base</th>
                  <th className="px-2 py-2">Mult</th>
                  <th className="px-2 py-2">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-sm text-zinc-400">
                      Loading match details...
                    </td>
                  </tr>
                ) : detailRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-sm text-zinc-400">
                      No saved player stats found for this match.
                    </td>
                  </tr>
                ) : (
                  detailRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-2 py-2 text-zinc-100">{row.player_name}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.auction_team_name}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.ipl_team_short_code}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.runs}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.wickets}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.catches}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.base_points.toFixed(2)}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.multiplier.toFixed(2)}x</td>
                      <td className="px-2 py-2 font-semibold text-zinc-100">{row.total_points.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
