import type { Metadata } from "next";
import { Users } from "lucide-react";
import { getTeamsPageData } from "@/lib/data/teams";
import { TeamsView } from "@/components/teams/teams-view";

export const metadata: Metadata = {
  title: "Teams | IPL 2026 Fantasy Auction League",
  description: "View all auction teams, players, roles, and IPL team mapping.",
};

export default async function TeamsPage() {
  const { teams, filterOptions, usesDemoData } = await getTeamsPageData();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b,_#020617_55%)] px-4 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-500/20 p-2 text-indigo-300">
              <Users size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                IPL 2026 Fantasy Auction Teams
              </h1>
              <p className="text-sm text-zinc-300">
                Auction teams, owned players, and IPL franchise mapping in one view.
              </p>
            </div>
          </div>
        </header>

        <TeamsView teams={teams} filterOptions={filterOptions} usesDemoData={usesDemoData} />
      </div>
    </main>
  );
}
