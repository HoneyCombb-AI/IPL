import type { Metadata } from "next";
import { getStatsPageData } from "@/lib/data/stats";
import { KpiGrid } from "@/components/stats/kpi-grid";
import { TeamStandings } from "@/components/stats/team-standings";
import { LeaderboardCard } from "@/components/stats/leaderboard-card";
import { FantasyInsightsCard } from "@/components/stats/fantasy-insights";

export const metadata: Metadata = {
  title: "Stats | IPL 2026 Fantasy Auction League",
  description: "Auction team and player fantasy analytics from finalized matches.",
};

export default async function StatsPage() {
  const data = await getStatsPageData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] px-4 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Season Stats Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Auction team rankings and player fantasy stats from finalized matches.
          </p>
        </header>

        {data.usesDemoData ? (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Supabase env or tables are unavailable. Stats page needs saved finalized matches.
          </p>
        ) : null}

        {!data.usesDemoData && data.kpis.length === 0 ? (
          <p className="rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
            No finalized matches yet. Finalize one match to start seeing rankings and stats.
          </p>
        ) : null}

        {data.kpis.length > 0 ? <KpiGrid items={data.kpis} /> : null}

        {data.insights ? <FantasyInsightsCard insights={data.insights} /> : null}

        {data.auctionTeamStandings.length > 0 ? <TeamStandings standings={data.auctionTeamStandings} /> : null}

        {data.playerLeaderboard.length > 0 ? (
          <LeaderboardCard
            title="Top Fantasy Players"
            subtitle="Ranked by cumulative fantasy points."
            rows={data.playerLeaderboard}
            mode="points"
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <LeaderboardCard
            title="Top Batters"
            subtitle="Most runs with strike-rate context."
            rows={data.topBatters}
            mode="batting"
          />
          <LeaderboardCard
            title="Top Bowlers"
            subtitle="Most wickets with economy context."
            rows={data.topBowlers}
            mode="bowling"
          />
          <LeaderboardCard
            title="Top Fielders"
            subtitle="Most catches and field impact."
            rows={data.topFielders}
            mode="fielding"
          />
        </div>
      </div>
    </main>
  );
}
