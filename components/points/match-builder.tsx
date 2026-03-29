"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculatePlayerPoints } from "@/lib/points/calculate-points";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { PointsAuctionTeam, PointsIplTeam } from "@/lib/points/types";

type StatDraft = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissed_for_duck: boolean;
  overs: number;
  maidens: number;
  runs_conceded: number;
  wickets: number;
  dot_balls: number;
  lbw_bowled_wickets: number;
  wides: number;
  no_balls: number;
  catches: number;
  stumpings: number;
  runout_direct: number;
  runout_assist: number;
  played: boolean;
  is_captain: boolean;
  is_vice_captain: boolean;
};

type MatchBuilderProps = {
  iplTeams: PointsIplTeam[];
  auctionTeams: PointsAuctionTeam[];
  onDataChanged: () => Promise<void> | void;
  editSession?: MatchEditSession | null;
};

type Step = "idle" | "chooseTeams" | "uploadScorecards" | "chooseAuctionTeam" | "enterPlayerStats";
type NumericStatKey =
  | "runs"
  | "balls"
  | "fours"
  | "sixes"
  | "overs"
  | "maidens"
  | "runs_conceded"
  | "wickets"
  | "dot_balls"
  | "lbw_bowled_wickets"
  | "wides"
  | "no_balls"
  | "catches"
  | "stumpings"
  | "runout_direct"
  | "runout_assist";

export type MatchBuilderDraft = StatDraft;

export type MatchEditSession = {
  key: string;
  matchId: string;
  selectedTeam1: string;
  selectedTeam2: string;
  matchDate: string;
  venueSide: "team1" | "team2" | "";
  completedTeamIds: string[];
  draftByPlayerId: Record<string, MatchBuilderDraft>;
};

type UploadedScorecardFiles = {
  inning1Batting: File | null;
  inning1Bowling: File | null;
  inning2Batting: File | null;
  inning2Bowling: File | null;
};

type ExtractedPlayerStat = {
  player_name: string;
  batting?: {
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    dismissed_for_duck?: boolean;
  };
  bowling?: {
    overs?: number;
    maidens?: number;
    runs_conceded?: number;
    wickets?: number;
    dot_balls?: number;
    lbw_bowled_wickets?: number;
    wides?: number;
    no_balls?: number;
  };
  fielding?: {
    catches?: number;
    stumpings?: number;
    runout_direct?: number;
    runout_assist?: number;
  };
};

const defaultDraft: StatDraft = {
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  dismissed_for_duck: false,
  overs: 0,
  maidens: 0,
  runs_conceded: 0,
  wickets: 0,
  dot_balls: 0,
  lbw_bowled_wickets: 0,
  wides: 0,
  no_balls: 0,
  catches: 0,
  stumpings: 0,
  runout_direct: 0,
  runout_assist: 0,
  played: false,
  is_captain: false,
  is_vice_captain: false,
};

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelFor(field: string): string {
  const labels: Record<string, string> = {
    runs: "Runs",
    balls: "Balls",
    fours: "4s",
    sixes: "6s",
    overs: "Overs",
    maidens: "Maidens",
    runs_conceded: "Conceded",
    wickets: "Wickets",
    dot_balls: "Dot Balls",
    lbw_bowled_wickets: "LBW/Bowled",
    wides: "Wides",
    no_balls: "No Balls",
    catches: "Catches",
    stumpings: "Stumpings",
    runout_direct: "Runout Direct",
    runout_assist: "Runout Assist",
  };
  return labels[field] ?? field;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read file as data URL."));
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

export function MatchBuilder({ iplTeams, auctionTeams, onDataChanged, editSession }: MatchBuilderProps) {
  const supabase = getSupabaseBrowserClient();
  const entryTopRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [selectedTeam1, setSelectedTeam1] = useState("");
  const [selectedTeam2, setSelectedTeam2] = useState("");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [venueSide, setVenueSide] = useState<"team1" | "team2" | "">("");
  const [activeAuctionTeamId, setActiveAuctionTeamId] = useState("");
  const [draftByPlayerId, setDraftByPlayerId] = useState<Record<string, StatDraft>>({});
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [completedTeamIds, setCompletedTeamIds] = useState<Set<string>>(new Set());
  const [isEditingExistingMatch, setIsEditingExistingMatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzingScorecards, setAnalyzingScorecards] = useState(false);
  const [scorecardFiles, setScorecardFiles] = useState<UploadedScorecardFiles>({
    inning1Batting: null,
    inning1Bowling: null,
    inning2Batting: null,
    inning2Bowling: null,
  });
  const [message, setMessage] = useState("");

  const previewByAuctionTeam = useMemo(() => {
    return auctionTeams
      .map((team) => ({
        ...team,
        matchPlayers: team.players.filter(
          (player) => player.ipl_team_id === selectedTeam1 || player.ipl_team_id === selectedTeam2,
        ),
      }))
      .filter((team) => team.matchPlayers.length > 0)
      .sort((a, b) => a.team_name.localeCompare(b.team_name));
  }, [auctionTeams, selectedTeam1, selectedTeam2]);

  const activeAuctionTeam = useMemo(
    () => previewByAuctionTeam.find((team) => team.id === activeAuctionTeamId) ?? null,
    [activeAuctionTeamId, previewByAuctionTeam],
  );

  const activePlayers = activeAuctionTeam?.matchPlayers ?? [];
  const requiredTeamCount = previewByAuctionTeam.length;
  const completionPct =
    requiredTeamCount === 0 ? 0 : Math.round((completedTeamIds.size / requiredTeamCount) * 100);
  const allRequiredTeamsCompleted =
    requiredTeamCount > 0 &&
    previewByAuctionTeam.every((team) => completedTeamIds.has(team.id));

  const selectedMatchPlayers = useMemo(() => {
    const byId = new Map<string, (typeof auctionTeams)[number]["players"][number]>();
    for (const team of auctionTeams) {
      for (const player of team.players) {
        if (player.ipl_team_id !== selectedTeam1 && player.ipl_team_id !== selectedTeam2) {
          continue;
        }
        if (!byId.has(player.id)) {
          byId.set(player.id, player);
        }
      }
    }
    return [...byId.values()];
  }, [auctionTeams, selectedTeam1, selectedTeam2]);

  function focusEntryTop() {
    requestAnimationFrame(() => {
      entryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetFlowState() {
    setStep("idle");
    setSelectedTeam1("");
    setSelectedTeam2("");
    setVenueSide("");
    setActiveAuctionTeamId("");
    setDraftByPlayerId({});
    setCurrentMatchId(null);
    setCompletedTeamIds(new Set());
    setIsEditingExistingMatch(false);
    setAnalyzingScorecards(false);
    setScorecardFiles({
      inning1Batting: null,
      inning1Bowling: null,
      inning2Batting: null,
      inning2Bowling: null,
    });
  }

  async function cancelCalculation() {
    if (!supabase) {
      resetFlowState();
      return;
    }

    if (currentMatchId && !isEditingExistingMatch) {
      const ok = window.confirm(
        "Cancel this calculation? Unsaved progress will be lost and the draft match will be deleted.",
      );
      if (!ok) {
        return;
      }
      await supabase.from("matches").delete().eq("id", currentMatchId);
      await onDataChanged();
    } else if (currentMatchId && isEditingExistingMatch) {
      const ok = window.confirm("Cancel editing? Saved stats from this match will remain unchanged.");
      if (!ok) {
        return;
      }
    }

    resetFlowState();
    setMessage("Calculation cancelled.");
  }

  async function startMatchDraft() {
    if (!supabase) {
      setMessage("Supabase is not configured.");
      return;
    }
    if (!selectedTeam1 || !selectedTeam2) {
      setMessage("Select both IPL teams first.");
      return;
    }
    if (selectedTeam1 === selectedTeam2) {
      setMessage("Both IPL teams cannot be same.");
      return;
    }
    if (!venueSide) {
      setMessage("Select which team's home venue the match was played at.");
      return;
    }

    setSaving(true);
    setMessage("");
    const team1 = iplTeams.find((team) => team.id === selectedTeam1);
    const team2 = iplTeams.find((team) => team.id === selectedTeam2);
    const venueValue =
      venueSide === "team1"
        ? `${team1?.short_code ?? "TEAM1"}_HOME`
        : `${team2?.short_code ?? "TEAM2"}_HOME`;

    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        ipl_team_1_id: selectedTeam1,
        ipl_team_2_id: selectedTeam2,
        match_date: matchDate,
        match_label: null,
        venue: venueValue,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !match) {
      setMessage("Failed to create draft match.");
      setSaving(false);
      return;
    }

    const totalsRows = auctionTeams.map((team) => ({
      match_id: match.id,
      auction_team_id: team.id,
      total_points: 0,
      is_completed: false,
    }));

    const { error: totalsError } = await supabase.from("match_auction_team_totals").insert(totalsRows);
    if (totalsError) {
      setMessage("Draft created, but totals initialization failed.");
      setSaving(false);
      return;
    }

    setCurrentMatchId(match.id);
    setIsEditingExistingMatch(false);
    setCompletedTeamIds(new Set());
    setScorecardFiles({
      inning1Batting: null,
      inning1Bowling: null,
      inning2Batting: null,
      inning2Bowling: null,
    });
    setSaving(false);
    setMessage("Draft created. Upload scorecards for auto-prefill, or skip.");
    setStep("uploadScorecards");
    await onDataChanged();
  }

  useEffect(() => {
    if (!editSession) {
      return;
    }
    queueMicrotask(() => {
      setStep("chooseAuctionTeam");
      setSelectedTeam1(editSession.selectedTeam1);
      setSelectedTeam2(editSession.selectedTeam2);
      setMatchDate(editSession.matchDate);
      setVenueSide(editSession.venueSide);
      setCurrentMatchId(editSession.matchId);
      setDraftByPlayerId(editSession.draftByPlayerId);
      setCompletedTeamIds(new Set(editSession.completedTeamIds));
      setActiveAuctionTeamId("");
      setIsEditingExistingMatch(true);
      setMessage("Editing existing match. Select an auction team to update stats.");
      requestAnimationFrame(() => {
        entryTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [editSession]);

  function updateDraft(playerId: string, patch: Partial<StatDraft>) {
    const numericKeys: NumericStatKey[] = [
      "runs",
      "balls",
      "fours",
      "sixes",
      "overs",
      "maidens",
      "runs_conceded",
      "wickets",
      "dot_balls",
      "lbw_bowled_wickets",
      "wides",
      "no_balls",
      "catches",
      "stumpings",
      "runout_direct",
      "runout_assist",
    ];
    setDraftByPlayerId((prev) => ({
      ...prev,
      [playerId]: (() => {
        const merged = {
          ...(prev[playerId] ?? defaultDraft),
          ...patch,
        };
        const hasAnyContribution =
          merged.dismissed_for_duck || numericKeys.some((field) => merged[field] > 0);
        if (hasAnyContribution) {
          merged.played = true;
        }
        return merged;
      })(),
    }));
  }

  function continueToAuctionTeams() {
    if (previewByAuctionTeam[0]) {
      setActiveAuctionTeamId(previewByAuctionTeam[0].id);
    }
    setStep("chooseAuctionTeam");
    setMessage("Proceeding to auction teams. You can edit and save team-wise as usual.");
  }

  function applyExtractedPlayerStats(extractedPlayers: ExtractedPlayerStat[]) {
    const playerIdByNormalizedName = new Map<string, string>();
    for (const player of selectedMatchPlayers) {
      playerIdByNormalizedName.set(normalizeName(player.player_name), player.id);
    }

    setDraftByPlayerId((prev) => {
      const next = { ...prev };

      for (const extracted of extractedPlayers) {
        const key = normalizeName(extracted.player_name ?? "");
        const playerId = playerIdByNormalizedName.get(key);
        if (!playerId) {
          continue;
        }

        const current = next[playerId] ?? defaultDraft;
        const merged: StatDraft = {
          ...current,
          runs: Math.max(0, Number(extracted.batting?.runs ?? current.runs)),
          balls: Math.max(0, Number(extracted.batting?.balls ?? current.balls)),
          fours: Math.max(0, Number(extracted.batting?.fours ?? current.fours)),
          sixes: Math.max(0, Number(extracted.batting?.sixes ?? current.sixes)),
          dismissed_for_duck: Boolean(extracted.batting?.dismissed_for_duck ?? current.dismissed_for_duck),
          overs: Math.max(0, Number(extracted.bowling?.overs ?? current.overs)),
          maidens: Math.max(0, Number(extracted.bowling?.maidens ?? current.maidens)),
          runs_conceded: Math.max(0, Number(extracted.bowling?.runs_conceded ?? current.runs_conceded)),
          wickets: Math.max(0, Number(extracted.bowling?.wickets ?? current.wickets)),
          dot_balls: Math.max(0, Number(extracted.bowling?.dot_balls ?? current.dot_balls)),
          lbw_bowled_wickets: Math.max(
            0,
            Number(extracted.bowling?.lbw_bowled_wickets ?? current.lbw_bowled_wickets),
          ),
          wides: Math.max(0, Number(extracted.bowling?.wides ?? current.wides)),
          no_balls: Math.max(0, Number(extracted.bowling?.no_balls ?? current.no_balls)),
          catches: Math.max(0, Number(extracted.fielding?.catches ?? current.catches)),
          stumpings: Math.max(0, Number(extracted.fielding?.stumpings ?? current.stumpings)),
          runout_direct: Math.max(0, Number(extracted.fielding?.runout_direct ?? current.runout_direct)),
          runout_assist: Math.max(0, Number(extracted.fielding?.runout_assist ?? current.runout_assist)),
          played: current.played,
          is_captain: current.is_captain,
          is_vice_captain: current.is_vice_captain,
        };

        const hasContribution =
          merged.dismissed_for_duck ||
          merged.runs > 0 ||
          merged.balls > 0 ||
          merged.fours > 0 ||
          merged.sixes > 0 ||
          merged.overs > 0 ||
          merged.maidens > 0 ||
          merged.runs_conceded > 0 ||
          merged.wickets > 0 ||
          merged.dot_balls > 0 ||
          merged.lbw_bowled_wickets > 0 ||
          merged.wides > 0 ||
          merged.no_balls > 0 ||
          merged.catches > 0 ||
          merged.stumpings > 0 ||
          merged.runout_direct > 0 ||
          merged.runout_assist > 0;

        merged.played = merged.played || hasContribution;
        next[playerId] = merged;
      }
      return next;
    });
  }

  async function analyzeUploadedScorecards() {
    if (!currentMatchId) {
      setMessage("Create the draft match first.");
      return;
    }
    const requiredFiles = [
      scorecardFiles.inning1Batting,
      scorecardFiles.inning1Bowling,
      scorecardFiles.inning2Batting,
      scorecardFiles.inning2Bowling,
    ];
    if (requiredFiles.some((file) => !file)) {
      setMessage("Upload all 4 screenshots (batting + bowling for both innings) or skip.");
      return;
    }

    setAnalyzingScorecards(true);
    setMessage("Analyzing screenshots with Gemini...");

    try {
      const [inning1Batting, inning1Bowling, inning2Batting, inning2Bowling] = await Promise.all(
        requiredFiles.map((file) => toDataUrl(file as File)),
      );

      const response = await fetch("/api/scorecard/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTeam1,
          selectedTeam2,
          players: selectedMatchPlayers.map((player) => ({
            id: player.id,
            player_name: player.player_name,
            ipl_team_short_code: player.ipl_team.short_code,
          })),
          screenshots: {
            inning1Batting,
            inning1Bowling,
            inning2Batting,
            inning2Bowling,
          },
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to extract scorecard stats.");
      }

      const payload = (await response.json()) as {
        players?: ExtractedPlayerStat[];
        warnings?: string[];
      };
      const extractedPlayers = payload.players ?? [];
      applyExtractedPlayerStats(extractedPlayers);
      continueToAuctionTeams();
      if ((payload.warnings ?? []).length > 0) {
        setMessage(
          `Prefill completed with ${payload.warnings?.length ?? 0} warning(s). Review player rows before saving.`,
        );
      } else {
        setMessage("Prefill completed. Review each auction team and click save.");
      }
    } catch (error) {
      const fallback = "Could not analyze screenshots right now. You can skip and enter stats manually.";
      setMessage(error instanceof Error ? error.message || fallback : fallback);
    } finally {
      setAnalyzingScorecards(false);
    }
  }

  async function saveActiveTeam() {
    if (!supabase || !currentMatchId || !activeAuctionTeam) {
      return;
    }
    setSaving(true);
    setMessage("");

    const rows = activePlayers.map((player) => {
      const draft = draftByPlayerId[player.id] ?? defaultDraft;
      const points = calculatePlayerPoints({
        playerRole: player.player_role,
        runs: draft.runs,
        balls: draft.balls,
        fours: draft.fours,
        sixes: draft.sixes,
        dismissedForDuck: draft.dismissed_for_duck,
        overs: draft.overs,
        maidens: draft.maidens,
        runsConceded: draft.runs_conceded,
        wickets: draft.wickets,
        dotBalls: draft.dot_balls,
        lbwBowledWickets: draft.lbw_bowled_wickets,
        catches: draft.catches,
        stumpings: draft.stumpings,
        runoutDirect: draft.runout_direct,
        runoutAssist: draft.runout_assist,
        playedInMatch: draft.played,
        isCaptain: draft.is_captain,
        isViceCaptain: draft.is_vice_captain,
      });

      return {
        match_id: currentMatchId,
        player_id: player.id,
        runs: draft.runs,
        balls: draft.balls,
        fours: draft.fours,
        sixes: draft.sixes,
        dismissed_for_duck: draft.dismissed_for_duck,
        overs: draft.overs,
        maidens: draft.maidens,
        runs_conceded: draft.runs_conceded,
        wickets: draft.wickets,
        wides: draft.wides,
        no_balls: draft.no_balls,
        catches: draft.catches,
        stumpings: draft.stumpings,
        runout_direct: draft.runout_direct,
        runout_assist: draft.runout_assist,
        is_playing_xi: draft.played,
        is_impact_player: false,
        is_captain: draft.is_captain,
        is_vice_captain: draft.is_vice_captain,
        base_points: points.basePoints,
        multiplier: points.multiplier,
        total_points: points.totalPoints,
        points_breakdown_json: points.breakdown,
      };
    });

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("match_player_stats")
        .upsert(rows, { onConflict: "match_id,player_id" });
      if (upsertError) {
        setMessage("Failed to save player stats for this auction team.");
        setSaving(false);
        return;
      }
    }

    const totalPoints = rows.reduce((sum, row) => sum + row.total_points, 0);
    const { error: totalError } = await supabase.from("match_auction_team_totals").upsert(
      {
        match_id: currentMatchId,
        auction_team_id: activeAuctionTeam.id,
        total_points: totalPoints,
        is_completed: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,auction_team_id" },
    );

    if (totalError) {
      setMessage("Failed to save auction team total.");
      setSaving(false);
      return;
    }

    const updatedCompleted = new Set(completedTeamIds);
    updatedCompleted.add(activeAuctionTeam.id);
    setCompletedTeamIds(updatedCompleted);
    setSaving(false);
    const nextTeam = previewByAuctionTeam.find((team) => !updatedCompleted.has(team.id));
    if (nextTeam) {
      setActiveAuctionTeamId(nextTeam.id);
      setMessage(`Saved ${activeAuctionTeam.team_name}. Moved to ${nextTeam.team_name}.`);
      setStep("enterPlayerStats");
      focusEntryTop();
    } else {
      setMessage("All required auction teams saved. You can now finalize the match.");
      setStep("chooseAuctionTeam");
    }
    await onDataChanged();
  }

  async function finalizeMatch() {
    if (!supabase || !currentMatchId) {
      return;
    }
    if (!allRequiredTeamsCompleted) {
      setMessage("Complete all auction teams first.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("matches")
      .update({ status: "finalized", updated_at: new Date().toISOString() })
      .eq("id", currentMatchId);

    if (error) {
      setMessage("Failed to finalize match.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setMessage("Match finalized and saved.");
    resetFlowState();
    await onDataChanged();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
      <header className="space-y-1">
        <h2 className="text-xl font-bold text-zinc-100">New Match Entry</h2>
        <p className="text-sm text-zinc-400">Follow the step-by-step points workflow for each match.</p>
      </header>

      {step === "idle" ? (
        <div className="rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">Step 1: Start a fresh match points calculation.</p>
          <button
            type="button"
            onClick={() => setStep("chooseTeams")}
            className="mt-3 rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Calculate Points
          </button>
        </div>
      ) : null}

      {step === "chooseTeams" ? (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">Step 2: Choose the two IPL teams playing this match.</p>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-xs text-zinc-300">
              IPL Team 1
              <select
                value={selectedTeam1}
                onChange={(event) => {
                  setSelectedTeam1(event.target.value);
                  setVenueSide("");
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
              >
                <option value="">Select team</option>
                {iplTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.short_code} - {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              IPL Team 2
              <select
                value={selectedTeam2}
                onChange={(event) => {
                  setSelectedTeam2(event.target.value);
                  setVenueSide("");
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
              >
                <option value="">Select team</option>
                {iplTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.short_code} - {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              Match Date
              <input
                type="date"
                value={matchDate}
                onChange={(event) => setMatchDate(event.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
              />
            </label>
            <label className="space-y-1 text-xs text-zinc-300">
              Venue (Home Team)
              <select
                value={venueSide}
                onChange={(event) => setVenueSide(event.target.value as "team1" | "team2" | "")}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
              >
                <option value="">Select home team</option>
                {selectedTeam1 ? (
                  <option value="team1">
                    {(iplTeams.find((team) => team.id === selectedTeam1)?.short_code ?? "Team 1")} home
                  </option>
                ) : null}
                {selectedTeam2 ? (
                  <option value="team2">
                    {(iplTeams.find((team) => team.id === selectedTeam2)?.short_code ?? "Team 2")} home
                  </option>
                ) : null}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={startMatchDraft}
              disabled={saving || !selectedTeam1 || !selectedTeam2 || !venueSide}
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => void cancelCalculation()}
              className="rounded-full border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-300"
            >
              Cancel Calculation
            </button>
          </div>
        </div>
      ) : null}

      {step === "uploadScorecards" ? (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">
            Step 3: Upload scoreboard screenshots for both innings (optional auto-prefill).
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                { key: "inning1Batting", label: "Inning 1 - Batting card" },
                { key: "inning1Bowling", label: "Inning 1 - Bowling card" },
                { key: "inning2Batting", label: "Inning 2 - Batting card" },
                { key: "inning2Bowling", label: "Inning 2 - Bowling card" },
              ] as const
            ).map((item) => (
              <label
                key={item.key}
                className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-3 text-xs text-zinc-300"
              >
                {item.label}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setScorecardFiles((prev) => ({ ...prev, [item.key]: file }));
                  }}
                  className="mt-2 block w-full text-xs text-zinc-300 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                />
                <p className="mt-2 text-[11px] text-zinc-400">
                  {scorecardFiles[item.key]?.name ?? "No file selected"}
                </p>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep("chooseTeams")}
              className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void analyzeUploadedScorecards()}
              disabled={analyzingScorecards || saving}
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzingScorecards ? "Analyzing..." : "Analyze & Prefill"}
            </button>
            <button
              type="button"
              onClick={continueToAuctionTeams}
              disabled={analyzingScorecards}
              className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => void cancelCalculation()}
              className="rounded-full border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-300"
            >
              Cancel Calculation
            </button>
          </div>
        </div>
      ) : null}

      {step === "chooseAuctionTeam" ? (
        <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-950/60 p-4">
          <p className="text-sm text-zinc-300">
            Step 4: Choose your auction team.
          </p>
          {previewByAuctionTeam.length === 0 ? (
            <p className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
              No auction team has players from the selected IPL teams.
            </p>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {previewByAuctionTeam.map((team) => (
              <div key={team.id} className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-100">{team.team_name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveAuctionTeamId(team.id);
                      setStep("enterPlayerStats");
                      focusEntryTop();
                    }}
                    className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Choose Team
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {team.matchPlayers.length} eligible players in selected IPL match
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("chooseTeams")}
              className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-100"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (previewByAuctionTeam[0]) {
                  setActiveAuctionTeamId(previewByAuctionTeam[0].id);
                  setStep("enterPlayerStats");
                  focusEntryTop();
                }
              }}
              disabled={previewByAuctionTeam.length === 0}
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Continue with First Auction Team
            </button>
            <button
              type="button"
              onClick={() => void cancelCalculation()}
              className="rounded-full border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-300"
            >
              Cancel Calculation
            </button>
            {allRequiredTeamsCompleted ? (
              <button
                type="button"
                onClick={finalizeMatch}
                disabled={saving || !currentMatchId}
                className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Finalize Match
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {message ? (
        <p className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
          {message}
        </p>
      ) : null}

      {step === "enterPlayerStats" ? (
        <>
          <div ref={entryTopRef} className="flex items-center justify-between gap-2">
            <p className="text-sm text-zinc-300">
              Step 5: Enter stats player-by-player for{" "}
              <span className="font-semibold">{activeAuctionTeam?.team_name}</span>.
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
                Completed: {completedTeamIds.size}/{requiredTeamCount}
              </span>
              <button
                type="button"
                onClick={() => setStep("chooseAuctionTeam")}
                className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-100"
              >
                Back to Auction Teams
              </button>
              <button
                type="button"
                onClick={() => void cancelCalculation()}
                className="rounded-full border border-rose-500/60 px-4 py-2 text-sm font-semibold text-rose-300"
              >
                Cancel Calculation
              </button>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full bg-emerald-500" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="flex flex-wrap gap-2">
            {previewByAuctionTeam.map((team) => (
              <button
                key={`quick-${team.id}`}
                type="button"
                onClick={() => {
                  setActiveAuctionTeamId(team.id);
                  focusEntryTop();
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeAuctionTeamId === team.id
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {team.team_name} {completedTeamIds.has(team.id) ? "✓" : ""}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {activePlayers.length === 0 ? (
              <p className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
                No players from this auction team are in the selected IPL match.
              </p>
            ) : (
              activePlayers.map((player) => {
                const draft = draftByPlayerId[player.id] ?? defaultDraft;
                const computedStrikeRate =
                  draft.balls > 0 ? ((draft.runs / draft.balls) * 100).toFixed(2) : "0.00";
                const oversBalls = Math.floor(draft.overs) * 6 + Math.round((draft.overs % 1) * 10);
                const computedEconomy =
                  oversBalls > 0 ? ((draft.runs_conceded * 6) / oversBalls).toFixed(2) : "0.00";
                const previewPoints = calculatePlayerPoints({
                  playerRole: player.player_role,
                  runs: draft.runs,
                  balls: draft.balls,
                  fours: draft.fours,
                  sixes: draft.sixes,
                  dismissedForDuck: draft.dismissed_for_duck,
                  overs: draft.overs,
                  maidens: draft.maidens,
                  runsConceded: draft.runs_conceded,
                  wickets: draft.wickets,
                  dotBalls: draft.dot_balls,
                  lbwBowledWickets: draft.lbw_bowled_wickets,
                  catches: draft.catches,
                  stumpings: draft.stumpings,
                  runoutDirect: draft.runout_direct,
                  runoutAssist: draft.runout_assist,
                  playedInMatch: draft.played,
                  isCaptain: draft.is_captain,
                  isViceCaptain: draft.is_vice_captain,
                });
                return (
                  <article key={player.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {player.player_name} <span className="text-zinc-400">({player.ipl_team.short_code})</span>
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-300">
                        <span className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200">
                          Preview: {previewPoints.totalPoints.toFixed(2)} pts
                        </span>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={draft.played}
                            onChange={(event) => updateDraft(player.id, { played: event.target.checked })}
                          />
                          Played (+4)
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={draft.is_captain}
                            onChange={(event) =>
                              updateDraft(player.id, {
                                is_captain: event.target.checked,
                                is_vice_captain: event.target.checked ? false : draft.is_vice_captain,
                              })
                            }
                          />
                          C
                        </label>
                        <label className="inline-flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={draft.is_vice_captain}
                            onChange={(event) =>
                              updateDraft(player.id, {
                                is_vice_captain: event.target.checked,
                                is_captain: event.target.checked ? false : draft.is_captain,
                              })
                            }
                          />
                          VC
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                        <p className="mb-2 text-xs font-semibold text-zinc-300">Batting Stats</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["runs", "balls", "fours", "sixes"] as const).map((field) => (
                            <label key={`${player.id}-${field}`} className="text-[11px] text-zinc-400">
                              {labelFor(field)}
                              <input
                                type="number"
                                min={0}
                                value={draft[field] === 0 ? "" : draft[field]}
                                placeholder={labelFor(field)}
                                onChange={(event) =>
                                  updateDraft(player.id, { [field]: toNumber(event.target.value) })
                                }
                                className="mt-1 h-8 w-full rounded border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100"
                              />
                            </label>
                          ))}
                          <label className="col-span-2 inline-flex items-center gap-2 text-[11px] text-zinc-400">
                            <input
                              type="checkbox"
                              checked={draft.dismissed_for_duck}
                              onChange={(event) =>
                                updateDraft(player.id, { dismissed_for_duck: event.target.checked })
                              }
                            />
                            Duck
                          </label>
                          <p className="col-span-2 rounded bg-zinc-800/70 px-2 py-1 text-[11px] text-zinc-300">
                            Strike Rate (auto): <span className="font-semibold text-zinc-100">{computedStrikeRate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                        <p className="mb-2 text-xs font-semibold text-zinc-300">Bowling Stats</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              "overs",
                              "maidens",
                              "runs_conceded",
                              "wickets",
                              "dot_balls",
                              "lbw_bowled_wickets",
                              "wides",
                              "no_balls",
                            ] as const
                          ).map((field) => (
                            <label key={`${player.id}-${field}`} className="text-[11px] text-zinc-400">
                              {labelFor(field)}
                              <input
                                type="number"
                                min={0}
                                step={field === "overs" ? "0.1" : "1"}
                                value={draft[field] === 0 ? "" : draft[field]}
                                placeholder={labelFor(field)}
                                onChange={(event) =>
                                  updateDraft(player.id, { [field]: toNumber(event.target.value) })
                                }
                                className="mt-1 h-8 w-full rounded border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100"
                              />
                            </label>
                          ))}
                          <p className="col-span-2 rounded bg-zinc-800/70 px-2 py-1 text-[11px] text-zinc-300">
                            Economy (auto): <span className="font-semibold text-zinc-100">{computedEconomy}</span>
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                        <p className="mb-2 text-xs font-semibold text-zinc-300">Fielding Stats</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(["catches", "stumpings", "runout_direct", "runout_assist"] as const).map((field) => (
                            <label key={`${player.id}-${field}`} className="text-[11px] text-zinc-400">
                              {labelFor(field)}
                              <input
                                type="number"
                                min={0}
                                value={draft[field] === 0 ? "" : draft[field]}
                                placeholder={labelFor(field)}
                                onChange={(event) =>
                                  updateDraft(player.id, { [field]: toNumber(event.target.value) })
                                }
                                className="mt-1 h-8 w-full rounded border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-100"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="flex justify-end">
            <div className="flex gap-2 rounded-full border border-zinc-700 bg-zinc-950/95 p-2">
              <button
                type="button"
                onClick={saveActiveTeam}
                disabled={saving || !currentMatchId || !activeAuctionTeam}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save and Next Team
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
