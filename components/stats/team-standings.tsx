import type { AuctionTeamStanding } from "@/lib/data/stats";

type TeamStandingsProps = {
  standings: AuctionTeamStanding[];
};

export function TeamStandings({ standings }: TeamStandingsProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-4 sm:p-5">
      <header>
        <h2 className="text-lg font-bold text-zinc-100">Auction Team Rankings</h2>
        <p className="text-xs text-zinc-400">Total points, form, and contribution stats per auction team.</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-[1080px] w-full text-left text-xs">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="px-2 py-2">Rank</th>
              <th className="px-2 py-2">Team</th>
              <th className="px-2 py-2">Owner</th>
              <th className="px-2 py-2">Total Pts</th>
              <th className="px-2 py-2">Matches</th>
              <th className="px-2 py-2">Avg</th>
              <th className="px-2 py-2">Best</th>
              <th className="px-2 py-2">Recent 3 Avg</th>
              <th className="px-2 py-2">Top Player</th>
              <th className="px-2 py-2">Runs</th>
              <th className="px-2 py-2">Wkts</th>
              <th className="px-2 py-2">Catches</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
            {standings.map((team) => (
              <tr key={team.auctionTeamId}>
                <td className="px-2 py-2 font-semibold text-zinc-200">#{team.rank}</td>
                <td className="px-2 py-2 text-zinc-100">{team.auctionTeamName}</td>
                <td className="px-2 py-2 text-zinc-300">{team.ownerName}</td>
                <td className="px-2 py-2 text-zinc-100">{team.totalPoints.toFixed(2)}</td>
                <td className="px-2 py-2 text-zinc-300">{team.matchesCompleted}</td>
                <td className="px-2 py-2 text-zinc-300">{team.averagePoints.toFixed(2)}</td>
                <td className="px-2 py-2 text-zinc-300">{team.bestMatchPoints.toFixed(2)}</td>
                <td className="px-2 py-2 text-zinc-300">{team.recentFormAvg.toFixed(2)}</td>
                <td className="px-2 py-2 text-zinc-300">
                  {team.topPlayerName} ({team.topPlayerPoints.toFixed(2)})
                </td>
                <td className="px-2 py-2 text-zinc-300">{team.totalRuns}</td>
                <td className="px-2 py-2 text-zinc-300">{team.totalWickets}</td>
                <td className="px-2 py-2 text-zinc-300">{team.totalCatches}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
