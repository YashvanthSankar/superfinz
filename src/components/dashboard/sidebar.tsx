"use client";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: "⚡" },
  { href: "/dashboard/transactions", label: "Transactions", icon: "💳" },
  { href: "/dashboard/heatmap", label: "Heatmap", icon: "🗓️" },
  { href: "/dashboard/calculators", label: "Calculators", icon: "📈" },
  { href: "/dashboard/news", label: "News", icon: "📰" },
  { href: "/dashboard/goals", label: "Goals", icon: "🎯" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="w-56 shrink-0 bg-[#111118] border-r border-[#2a2a3a] flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-[#2a2a3a]">
        <span className="text-xl font-black text-white">
          Super<span className="text-[#00ff88]">Finz</span>
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/20"
                  : "text-[#8888aa] hover:text-white hover:bg-[#1a1a24]"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#2a2a3a]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#8888aa] hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
