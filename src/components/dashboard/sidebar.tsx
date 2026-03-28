"use client";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",              label: "Overview",      icon: "⚡" },
  { href: "/dashboard/transactions", label: "Transactions",  icon: "💳" },
  { href: "/dashboard/heatmap",      label: "Heatmap",       icon: "📅" },
  { href: "/dashboard/calculators",  label: "Calculators",   icon: "📈" },
  { href: "/dashboard/news",         label: "News",          icon: "📰" },
  { href: "/dashboard/goals",        label: "Goals",         icon: "🎯" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-[#f1f5f9] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#f1f5f9]">
        <span className="text-lg font-black text-[#0f172a]">
          Super<span className="text-indigo-600">Finz</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] font-medium"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-[#f1f5f9] space-y-1">
        {session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-[#e2e8f0]" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0f172a] truncate">{session.user.name}</p>
              <p className="text-[10px] text-[#94a3b8] truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#94a3b8] hover:text-red-500 hover:bg-red-50 transition-all font-medium"
        >
          <span>🚪</span> Sign out
        </button>
      </div>
    </aside>
  );
}
