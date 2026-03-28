import type { FantasyInsights } from "@/lib/data/stats";

type FantasyInsightsProps = {
  insights: FantasyInsights;
};

export function FantasyInsightsCard({ insights }: FantasyInsightsProps) {
  return (
    <section className="grid gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">Highest Single-Match Player</p>
        <p className="mt-2 text-sm font-semibold text-zinc-100">{insights.highestSingleMatchPlayer.playerName}</p>
        <p className="text-xs text-zinc-300">{insights.highestSingleMatchPlayer.points.toFixed(2)} pts</p>
      </article>
      <article className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">Most Consistent (50+)</p>
        <p className="mt-2 text-sm font-semibold text-zinc-100">{insights.mostConsistentPlayer.playerName}</p>
        <p className="text-xs text-zinc-300">{insights.mostConsistentPlayer.games50Plus} games</p>
      </article>
      <article className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">Most Explosive (100+)</p>
        <p className="mt-2 text-sm font-semibold text-zinc-100">{insights.mostExplosivePlayer.playerName}</p>
        <p className="text-xs text-zinc-300">{insights.mostExplosivePlayer.games100Plus} games</p>
      </article>
      <article className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-[11px] uppercase tracking-wide text-zinc-400">Top Auction Team</p>
        <p className="mt-2 text-sm font-semibold text-zinc-100">{insights.topAuctionTeam.teamName}</p>
        <p className="text-xs text-zinc-300">{insights.topAuctionTeam.points.toFixed(2)} pts</p>
      </article>
    </section>
  );
}
