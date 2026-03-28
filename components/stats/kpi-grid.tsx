import type { StatsKpi } from "@/lib/data/stats";

type KpiGridProps = {
  items: StatsKpi[];
};

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <article key={item.label} className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">{item.label}</p>
          <p className="mt-2 text-lg font-black text-zinc-100">{item.value}</p>
          {item.helper ? <p className="mt-1 text-xs text-zinc-400">{item.helper}</p> : null}
        </article>
      ))}
    </div>
  );
}
