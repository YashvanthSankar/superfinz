"use client";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, ArrowLeftRight, Calculator,
  Newspaper, Target, User, LogOut, TrendingUp, BookOpen,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",              label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight  },
  { href: "/dashboard/retirement",   label: "Retirement",   icon: TrendingUp      },
  { href: "/dashboard/goals",        label: "Goals",        icon: Target          },
  { href: "/dashboard/learn",        label: "Learn",        icon: BookOpen        },
  { href: "/dashboard/calculators",  label: "Calculators",  icon: Calculator      },
  { href: "/dashboard/news",         label: "News",         icon: Newspaper       },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-[#fefce8] border-r border-[#e8ddd0] flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#e8ddd0]">
          <Logo size="md" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <a
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-[#78350f] hover:text-[#713f12] hover:bg-amber-50/50 font-medium"
                )}
              >
                <Icon size={15} className={active ? "text-amber-600" : "text-[#b45309]"} />
                {label}
              </a>
            );
          })}
        </nav>

        {/* Profile + sign out */}
        <div className="p-3 border-t border-[#e8ddd0] space-y-0.5">
          {session?.user && (
            <a
              href="/dashboard/profile"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                isActive("/dashboard/profile")
                  ? "bg-amber-50 text-amber-700"
                  : "hover:bg-amber-50/50"
              )}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-[#fde68a] shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#713f12] truncate">{session.user.name}</p>
                <p className="text-[10px] text-[#b45309] truncate">{session.user.email}</p>
              </div>
            </a>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#b45309] hover:text-red-500 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Mobile top bar ──────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#FDFCF6]/95 backdrop-blur border-b border-[#e8ddd0] flex items-center justify-between px-4">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/profile"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 transition-all"
          >
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-[#fde68a]" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </a>
        </div>
      </div>

      {/* ─── Mobile bottom nav ───────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFCF6]/95 backdrop-blur border-t border-[#e8ddd0] flex items-stretch pb-safe">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <a
              key={href}
              href={href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-all",
                active ? "text-amber-700" : "text-[#b45309]"
              )}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 rounded-b-full" />}
              <Icon
                size={19}
                className={cn("transition-all", active ? "text-amber-600" : "")}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className={active ? "font-semibold" : ""}>{label}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
