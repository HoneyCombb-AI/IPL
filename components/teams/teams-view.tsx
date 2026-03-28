"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PlayerCard } from "./player-card";
import { extractPlayerMeta, type PlayerTag } from "@/lib/player-meta";
import type { AuctionTeam, FilterOptions } from "@/lib/types";

type TeamsViewProps = {
  teams: AuctionTeam[];
  filterOptions: FilterOptions;
  usesDemoData: boolean;
};

type ViewMode = "auction" | "ipl";

export function TeamsView({ teams, filterOptions, usesDemoData }: TeamsViewProps) {
  const [query, setQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedIplTeam, setSelectedIplTeam] = useState("all");
  const [selectedAuctionTeam, setSelectedAuctionTeam] = useState("all");
  const [selectedTag, setSelectedTag] = useState<"all" | PlayerTag>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("auction");
  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);

  const filteredTeams = useMemo<AuctionTeam[]>(() => {
    const search = query.trim().toLowerCase();
    return teams
      .map((team) => {
        const auctionTeamMatch = selectedAuctionTeam === "all" || team.id === selectedAuctionTeam;
        if (!auctionTeamMatch) {
          return { ...team, players: [] };
        }

        const players = team.players.filter((player) => {
          const { displayName, tags } = extractPlayerMeta(player.player_name);
          const roleMatch =
            selectedRole === "all" ||
            player.player_role.toLowerCase() === selectedRole.toLowerCase();
          const iplTeamMatch =
            selectedIplTeam === "all" || player.ipl_team?.id === selectedIplTeam;
          const tagMatch = selectedTag === "all" || tags.includes(selectedTag);
          const searchMatch =
            search.length === 0 ||
            player.player_name.toLowerCase().includes(search) ||
            displayName.toLowerCase().includes(search) ||
            team.team_name.toLowerCase().includes(search) ||
            player.ipl_team?.name.toLowerCase().includes(search) ||
            player.ipl_team?.short_code.toLowerCase().includes(search);

          return roleMatch && iplTeamMatch && tagMatch && Boolean(searchMatch);
        });

        return { ...team, players };
      })
      .filter((team) => team.players.length > 0);
  }, [query, selectedRole, selectedIplTeam, selectedAuctionTeam, selectedTag, teams]);

  const groupedByIpl = useMemo(() => {
    const groups = new Map<
      string,
      {
        id: string;
        name: string;
        shortCode: string;
        players: { id: string; player: AuctionTeam["players"][number]; auctionTeamName: string }[];
      }
    >();

    for (const team of filteredTeams) {
      for (const player of team.players) {
        if (!player.ipl_team) {
          continue;
        }
        const key = player.ipl_team.id;
        const existing = groups.get(key) ?? {
          id: player.ipl_team.id,
          name: player.ipl_team.name,
          shortCode: player.ipl_team.short_code,
          players: [],
        };

        existing.players.push({
          id: `${team.id}-${player.id}`,
          player,
          auctionTeamName: team.team_name,
        });
        groups.set(key, existing);
      }
    }

    return [...groups.values()]
      .map((group) => ({
        ...group,
        players: group.players.sort((a, b) => a.player.player_name.localeCompare(b.player.player_name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredTeams]);

  const filteredPlayerCount = filteredTeams.reduce((sum, team) => sum + team.players.length, 0);

  function clearFilters() {
    setQuery("");
    setSelectedRole("all");
    setSelectedIplTeam("all");
    setSelectedAuctionTeam("all");
    setSelectedTag("all");
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Auction Teams</p>
          <p className="mt-2 text-3xl font-black text-zinc-100">{teams.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">IPL Teams</p>
          <p className="mt-2 text-3xl font-black text-zinc-100">{filterOptions.iplTeams.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-400">Showing Players</p>
          <p className="mt-2 text-3xl font-black text-zinc-100">
            {filteredPlayerCount}/{totalPlayers}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("auction")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              viewMode === "auction"
                ? "bg-indigo-500 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            View by Auction Team
          </button>
          <button
            type="button"
            onClick={() => setViewMode("ipl")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              viewMode === "ipl"
                ? "bg-indigo-500 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            View by IPL Team
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <label className="space-y-1 text-xs text-zinc-300">
            Search
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
              <Search size={14} className="text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Player or team..."
                className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
            </div>
          </label>

          <label className="space-y-1 text-xs text-zinc-300">
            Auction Team
            <select
              value={selectedAuctionTeam}
              onChange={(event) => setSelectedAuctionTeam(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
            >
              <option value="all">All auction teams</option>
              {filterOptions.auctionTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-zinc-300">
            Role
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
            >
              <option value="all">All roles</option>
              {filterOptions.roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs text-zinc-300">
            Tags
            <select
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value as "all" | PlayerTag)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
            >
              <option value="all">All tags</option>
              <option value="C">Captain (C)</option>
              <option value="VC">Vice Captain (VC)</option>
              <option value="RTM">RTM</option>
            </select>
          </label>

          <label className="space-y-1 text-xs text-zinc-300">
            IPL Team
            <select
              value={selectedIplTeam}
              onChange={(event) => setSelectedIplTeam(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
            >
              <option value="all">All IPL teams</option>
              {filterOptions.iplTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.shortCode} - {team.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {usesDemoData ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Supabase env is missing or data is empty, so demo data is shown. Add your env and
          run the schema/seed SQL to load real auction teams.
        </p>
      ) : null}

      <section className="space-y-6">
        {filteredPlayerCount === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-400">
            No players match your filters.
          </div>
        ) : viewMode === "auction" ? (
          filteredTeams.map((team) => (
            <article key={team.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">{team.team_name}</h2>
                  <p className="text-sm text-zinc-400">Owner: {team.owner_name}</p>
                </div>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {team.players.length} players
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {team.players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </article>
          ))
        ) : (
          groupedByIpl.map((group) => (
            <article key={group.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">
                    {group.shortCode} - {group.name}
                  </h2>
                  <p className="text-sm text-zinc-400">Players grouped by IPL franchise</p>
                </div>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {group.players.length} players
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.players.map((entry) => (
                  <PlayerCard
                    key={entry.id}
                    player={entry.player}
                    auctionTeamName={entry.auctionTeamName}
                  />
                ))}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
