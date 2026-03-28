import { DEFAULT_TEAM_PALETTE, IPL_TEAM_COLORS } from "@/lib/team-colors";
import { extractPlayerMeta } from "@/lib/player-meta";
import type { Player } from "@/lib/types";

type PlayerCardProps = {
  player: Player;
  auctionTeamName?: string;
};

export function PlayerCard({ player, auctionTeamName }: PlayerCardProps) {
  const teamCode = player.ipl_team?.short_code ?? "";
  const palette = IPL_TEAM_COLORS[teamCode] ?? DEFAULT_TEAM_PALETTE;
  const { displayName, tags } = extractPlayerMeta(player.player_name);

  return (
    <article
      className="rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: `${palette.primary}40`,
        background: `linear-gradient(140deg, ${palette.primary}20, ${palette.secondary}15 55%, ${palette.accent}10 100%)`,
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-white/90">{displayName}</p>
        {tags.map((tag) => (
          <span
            key={`${player.id}-${tag}`}
            className="rounded-full border border-zinc-500/50 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-200"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-zinc-200">{player.player_role}</p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${palette.primary}d9`,
            color: "#F8FAFC",
          }}
        >
          {player.ipl_team?.short_code ?? "Unassigned"}
        </span>
        <span className="truncate text-xs text-zinc-300">
          {player.ipl_team?.name ?? "No IPL team"}
        </span>
      </div>
      {auctionTeamName ? (
        <p className="mt-2 truncate text-xs text-zinc-300">Auction Team: {auctionTeamName}</p>
      ) : null}
    </article>
  );
}
