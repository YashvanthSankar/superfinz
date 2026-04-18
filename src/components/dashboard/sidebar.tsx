"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/fetcher";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, ArrowLeftRight, Calculator,
  Newspaper, Target, LogOut, TrendingUp, BookOpen,
  MoreHorizontal, Flame, Wallet, ChevronLeft, ChevronRight,
} from "lucide-react";

type BudgetCheck = { at: number; over: boolean };
const BUDGET_TTL_MS = 60_000;
const budgetCache: { current: BudgetCheck | null } = { current: null };

async function fetchBudgetAlert(): Promise<boolean> {
  const now = Date.now();
  if (budgetCache.current && now - budgetCache.current.at < BUDGET_TTL_MS) {
    return budgetCache.current.over;
  }
  try {
    const d = new Date();
    const data = await apiFetch<{ budgets: Array<{ limit: number; spent: number }> }>(
      `/api/budgets?month=${d.getMonth() + 1}&year=${d.getFullYear()}`,
      { timeoutMs: 5_000 }
    );
    const over = (data.budgets ?? []).some((b) => b.limit > 0 && b.spent > b.limit);
    budgetCache.current = { at: now, over };
    return over;
  } catch {
    return budgetCache.current?.over ?? false;
  }
}

const NAV = [
  { href: "/dashboard",              label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/goals",        label: "Goals",        icon: Target },
  { href: "/dashboard/budgets",      label: "Budgets",      icon: Wallet },
  { href: "/dashboard/retirement",   label: "Retirement",   icon: TrendingUp },
  { href: "/dashboard/learn",        label: "Learn",        icon: BookOpen },
  { href: "/dashboard/calculators",  label: "Calculators",  icon: Calculator },
  { href: "/dashboard/news",         label: "News",         icon: Newspaper },
  { href: "/dashboard/heatmap",      label: "Heatmap",      icon: Flame },
];

const BOTTOM_NAV_PRIMARY = NAV.slice(0, 4);
const BOTTOM_NAV_MORE = NAV.slice(4);

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sidebar-collapsed") === "true";
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  const [budgetAlert, setBudgetAlert] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchBudgetAlert().then((over) => {
      if (!cancelled) setBudgetAlert(over);
    });
    return () => { cancelled = true; };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop sidebar ───────────────────────── */}
      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col h-screen sticky top-0 transition-all duration-200",
          "bg-paper border-r-2 border-ink",
          collapsed ? "w-[64px]" : "w-56"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b-2 border-ink",
            collapsed ? "px-3 py-5 justify-center" : "px-5 py-5 justify-between"
          )}
        >
          {!collapsed && <Logo size="md" />}
          <button
            onClick={() =>
              setCollapsed((c) => {
                const next = !c;
                if (typeof window !== "undefined") window.localStorage.setItem("sidebar-collapsed", String(next));
                return next;
              })
            }
            className="w-8 h-8 border-2 border-ink bg-paper flex items-center justify-center text-ink hover:bg-accent hover:text-paper transition-colors shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} strokeWidth={2.5} /> : <ChevronLeft size={14} strokeWidth={2.5} />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center text-xs font-black uppercase tracking-wider relative border-2 transition-colors",
                  collapsed ? "justify-center h-10" : "gap-2.5 px-3 h-10",
                  active
                    ? "bg-ink text-paper border-ink"
                    : "bg-paper text-ink border-transparent hover:border-ink hover:bg-paper-2"
                )}
              >
                <Icon size={15} strokeWidth={2.5} className="shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
                {showBadge && (
                  <span
                    className={cn(
                      "w-2 h-2 bg-bad border border-ink shrink-0",
                      collapsed ? "absolute top-1 right-1" : ""
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t-2 border-ink space-y-1">
          {session?.user && (
            <Link
              href="/dashboard/profile"
              title={collapsed ? session.user.name ?? "Profile" : undefined}
              className={cn(
                "flex items-center border-2 border-transparent transition-colors",
                collapsed ? "justify-center h-12" : "gap-2.5 px-3 h-12",
                isActive("/dashboard/profile")
                  ? "bg-ink text-paper border-ink"
                  : "hover:border-ink hover:bg-paper-2"
              )}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-8 h-8 border-2 border-ink shrink-0" />
              ) : (
                <div className="w-8 h-8 border-2 border-ink bg-accent text-paper text-xs font-black flex items-center justify-center shrink-0">
                  {session.user.name?.[0]?.toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black truncate uppercase tracking-wide">{session.user.name}</p>
                  <p className="text-[10px] opacity-70 truncate">{session.user.email}</p>
                </div>
              )}
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "w-full flex items-center text-xs font-black uppercase tracking-wider border-2 border-transparent transition-colors text-ink-soft",
              collapsed ? "justify-center h-10" : "gap-2.5 px-3 h-10",
              "hover:border-ink hover:bg-bad hover:text-paper"
            )}
          >
            <LogOut size={14} strokeWidth={2.5} />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* ─── Mobile top bar ─────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-paper border-b-2 border-ink">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          {budgetAlert && (
            <Link
              href="/dashboard/budgets"
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 h-8 border-2 border-ink bg-bad text-paper"
            >
              <span className="w-1.5 h-1.5 bg-paper animate-pulse" />
              Over
            </Link>
          )}
          <Link href="/dashboard/profile">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-8 h-8 border-2 border-ink" />
            ) : (
              <div className="w-8 h-8 border-2 border-ink bg-accent text-paper text-xs font-black flex items-center justify-center">
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* ─── Mobile drawer ───────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-ink/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper border-t-2 border-ink">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-ink" />
            </div>

            <nav className="px-3 py-3 space-y-1">
              {BOTTOM_NAV_MORE.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 h-11 text-xs font-black uppercase tracking-wider border-2 transition-colors",
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-paper text-ink border-transparent hover:border-ink"
                    )}
                  >
                    <Icon size={15} strokeWidth={2.5} />
                    <span className="flex-1">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 pt-1 space-y-1 border-t-2 border-ink pb-safe">
              {session?.user && (
                <Link
                  href="/dashboard/profile"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 h-12 border-2 transition-colors",
                    isActive("/dashboard/profile")
                      ? "bg-ink text-paper border-ink"
                      : "bg-paper text-ink border-transparent hover:border-ink"
                  )}
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="w-8 h-8 border-2 border-ink shrink-0" />
                  ) : (
                    <div className="w-8 h-8 border-2 border-ink bg-accent text-paper text-xs font-black flex items-center justify-center shrink-0">
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate uppercase tracking-wide">{session.user.name}</p>
                    <p className="text-[10px] opacity-70 truncate">{session.user.email}</p>
                  </div>
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-3 h-11 text-xs font-black uppercase tracking-wider border-2 border-transparent hover:border-ink hover:bg-bad hover:text-paper text-bad transition-colors"
              >
                <LogOut size={14} strokeWidth={2.5} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile bottom nav ───────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-paper border-t-2 border-ink pb-safe">
        {BOTTOM_NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider transition-colors",
                active ? "bg-ink text-paper" : "text-ink hover:bg-paper-2"
              )}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.75 : 2} />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-bad border-2 border-paper" />
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-ink hover:bg-paper-2 transition-colors"
        >
          <MoreHorizontal size={20} strokeWidth={2} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
