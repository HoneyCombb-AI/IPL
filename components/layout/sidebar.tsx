"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calculator, Users } from "lucide-react";

const navItems = [
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/points", label: "Points", icon: Calculator },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-800 bg-zinc-950/90 p-3 md:h-screen md:w-64 md:border-b-0 md:border-r md:p-4">
      <div className="mb-4 px-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">IPL 2026</p>
        <h1 className="text-lg font-black text-zinc-100">Fantasy League</h1>
      </div>
      <nav className="flex gap-2 md:flex-col">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-indigo-500/20 text-indigo-300"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
