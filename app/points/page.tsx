import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import { getPointsPageData } from "@/lib/data/points";
import { PointsDashboard } from "@/components/points/points-dashboard";

export const metadata: Metadata = {
  title: "Points | IPL 2026 Fantasy Auction League",
  description: "Enter match stats, calculate points, and review past matches.",
};

export default async function PointsPage() {
  const { iplTeams, auctionTeams, matches, usesDemoData } = await getPointsPageData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] px-4 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <header className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-500/20 p-2 text-emerald-300">
              <Calculator size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Match Points Workflow</h1>
              <p className="text-sm text-zinc-300">
                Enter per-player stats for each match, compute team totals, and save history.
              </p>
            </div>
          </div>
        </header>

        <PointsDashboard
          iplTeams={iplTeams}
          auctionTeams={auctionTeams}
          initialMatches={matches}
          usesDemoData={usesDemoData}
        />
      </div>
    </main>
  );
}
