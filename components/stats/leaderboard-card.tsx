import type { PlayerStatsSummary } from "@/lib/data/stats";

type LeaderboardCardProps = {
  title: string;
  subtitle: string;
  rows: PlayerStatsSummary[];
  mode: "points" | "batting" | "bowling" | "fielding";
};

export function LeaderboardCard({ title, subtitle, rows, mode }: LeaderboardCardProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-4 sm:p-5">
      <header>
        <h2 className="text-base font-bold text-zinc-100">{title}</h2>
        <p className="text-xs text-zinc-400">{subtitle}</p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="min-w-[780px] w-full text-left text-xs">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Player</th>
              <th className="px-2 py-2">Auction Team</th>
              <th className="px-2 py-2">Total Pts</th>
              <th className="px-2 py-2">Avg</th>
              <th className="px-2 py-2">Best</th>
              {mode === "batting" ? <th className="px-2 py-2">Runs / SR</th> : null}
              {mode === "bowling" ? <th className="px-2 py-2">Wkts / Eco</th> : null}
              {mode === "fielding" ? <th className="px-2 py-2">Catches</th> : null}
              {mode === "points" ? <th className="px-2 py-2">50+ / 100+</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
            {rows.map((row) => (
              <tr key={row.playerId}>
                <td className="px-2 py-2 font-semibold text-zinc-200">#{row.rank}</td>
                <td className="px-2 py-2 text-zinc-100">{row.playerName}</td>
                <td className="px-2 py-2 text-zinc-300">{row.auctionTeamName}</td>
                <td className="px-2 py-2 text-zinc-100">{row.totalPoints.toFixed(2)}</td>
                <td className="px-2 py-2 text-zinc-300">{row.averagePoints.toFixed(2)}</td>
                <td className="px-2 py-2 text-zinc-300">{row.bestPoints.toFixed(2)}</td>
                {mode === "batting" ? (
                  <td className="px-2 py-2 text-zinc-300">
                    {row.totalRuns} / {row.strikeRate.toFixed(2)}
                  </td>
                ) : null}
                {mode === "bowling" ? (
                  <td className="px-2 py-2 text-zinc-300">
                    {row.totalWickets} / {row.economy.toFixed(2)}
                  </td>
                ) : null}
                {mode === "fielding" ? <td className="px-2 py-2 text-zinc-300">{row.totalCatches}</td> : null}
                {mode === "points" ? (
                  <td className="px-2 py-2 text-zinc-300">
                    {row.games50Plus} / {row.games100Plus}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
