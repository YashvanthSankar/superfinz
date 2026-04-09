"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, ArrowLeftRight, Calculator,
  Newspaper, Target, LogOut, TrendingUp, BookOpen,
  MoreHorizontal, X, Flame, Wallet,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",              label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight  },
  { href: "/dashboard/goals",        label: "Goals",        icon: Target          },
  { href: "/dashboard/budgets",      label: "Budgets",      icon: Wallet          },
  { href: "/dashboard/retirement",   label: "Retirement",   icon: TrendingUp      },
  { href: "/dashboard/learn",        label: "Learn",        icon: BookOpen        },
  { href: "/dashboard/calculators",  label: "Calculators",  icon: Calculator      },
  { href: "/dashboard/news",         label: "News",         icon: Newspaper       },
  { href: "/dashboard/heatmap",      label: "Heatmap",      icon: Flame           },
];

// Bottom nav shows 4 primary items + More button
const BOTTOM_NAV_PRIMARY = NAV.slice(0, 4);

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const now = new Date();
        const r = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
        const d = await r.json();
        const over = (d.budgets ?? []).some((b: { limit: number; spent: number }) => b.limit > 0 && b.spent > b.limit);
        setBudgetAlert(over);
      } catch { /* ignore */ }
    };
    check();
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex w-52 shrink-0 bg-background border-r border-surface flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface">
          <Logo size="md" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
            return (
              <a
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-muted hover:text-text hover:bg-amber-50/50 font-medium"
                )}
              >
                <Icon size={15} className={active ? "text-amber-600" : "text-accent"} />
                <span className="flex-1">{label}</span>
                {showBadge && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Budget exceeded" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Profile + sign out */}
        <div className="p-3 border-t border-surface space-y-0.5">
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
                <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-border shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text truncate">{session.user.name}</p>
                <p className="text-[10px] text-accent truncate">{session.user.email}</p>
              </div>
            </a>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-accent hover:text-red-500 hover:bg-red-50 transition-all font-medium" 
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Mobile top bar ──────────────────────────────────────── */} 
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#fefce8] border-b border-amber-200 flex items-center justify-between px-4">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/profile"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-amber-50 transition-all"
          >
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-border" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </a>
        </div>
      </div>

      {/* ─── Mobile bottom nav (4 items + More) ────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fefce8] border-t border-amber-200 flex items-stretch pb-safe">
        {BOTTOM_NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <a
              key={href}
              href={href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-all",
                active ? "text-amber-700" : "text-accent"
              )}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 rounded-b-full" />}
              <Icon size={19} className={cn("transition-all", active ? "text-amber-600" : "")} strokeWidth={active ? 2.5 : 1.75} />
              <span className={active ? "font-semibold" : ""}>{label}</span>
            </a>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-accent transition-all"
        >
          <MoreHorizontal size={19} strokeWidth={1.75} />
          <span>More</span>
        </button>
      </nav>

      {/* ─── Mobile "More" drawer ────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/30"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Sheet */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#fefce8] border-t-2 border-amber-400 rounded-t-2xl shadow-2xl pb-safe animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-surface">
              <span className="text-sm font-semibold text-text">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#fef9c3] transition-all">
                <X size={16} className="text-accent" />
              </button>
            </div>

            <div className="px-4 py-3 space-y-0.5">
              {NAV.slice(4).map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                      active ? "bg-amber-50 text-amber-700 font-semibold" : "text-text hover:bg-surface font-medium"
                    )}
                  >
                    <Icon size={17} className={active ? "text-amber-600" : "text-accent"} />
                    <span className="flex-1">{label}</span>
                    {showBadge && (
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Budget exceeded" />
                    )}
                  </a>
                );
              })}

              {/* Profile */}
              {session?.user && (
                <a
                  href="/dashboard/profile"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
                    isActive("/dashboard/profile") ? "bg-amber-50 text-amber-700 font-semibold" : "text-text hover:bg-surface font-medium"
                  )}
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="w-5 h-5 rounded-full ring-1 ring-border shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  Profile
                </a>
              )}

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-accent hover:text-red-500 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

