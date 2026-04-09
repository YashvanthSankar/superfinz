"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, ArrowLeftRight, Calculator,
  Newspaper, Target, LogOut, TrendingUp, BookOpen,
  MoreHorizontal, X, Flame, Wallet, ChevronLeft, ChevronRight, Menu,
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

const BOTTOM_NAV_PRIMARY = NAV.slice(0, 4);

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);
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

  // Close mobile drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop sidebar ─────────────────────────────────────── */}
      <aside className={cn(
        "hidden lg:flex shrink-0 bg-background border-r border-surface flex-col h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-52"
      )}>
        {/* Logo + collapse toggle */}
        <div className={cn(
          "flex items-center border-b border-surface",
          collapsed ? "px-3 py-5 justify-center" : "px-5 py-5 justify-between"
        )}>
          {!collapsed && <Logo size="md" />}
          <button
            onClick={() => setCollapsed((c) => {
              const next = !c;
              localStorage.setItem("sidebar-collapsed", String(next));
              return next;
            })}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-accent hover:text-text hover:bg-surface transition-all shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
            return (
              <a
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center rounded-xl text-sm transition-all relative",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5",
                  active
                    ? "bg-amber-50 text-amber-700 font-semibold"
                    : "text-muted hover:text-text hover:bg-surface font-medium"
                )}
              >
                <Icon size={15} className={cn("shrink-0", active ? "text-amber-600" : "text-accent")} />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
                {showBadge && (
                  <span className={cn(
                    "w-2 h-2 rounded-full bg-red-500 shrink-0",
                    collapsed ? "absolute top-1.5 right-1.5" : ""
                  )} title="Budget exceeded" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Profile + sign out */}
        <div className="p-2 border-t border-surface space-y-0.5">
          {session?.user && (
            <a
              href="/dashboard/profile"
              title={collapsed ? session.user.name ?? "Profile" : undefined}
              className={cn(
                "flex items-center rounded-xl transition-all",
                collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5",
                isActive("/dashboard/profile")
                  ? "bg-amber-50 text-amber-700"
                  : "hover:bg-surface"
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
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-text truncate">{session.user.name}</p>
                  <p className="text-[10px] text-accent truncate">{session.user.email}</p>
                </div>
              )}
            </a>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "w-full flex items-center rounded-xl text-sm text-accent hover:text-red-500 hover:bg-red-50 transition-all font-medium",
              collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-3 py-2"
            )}
          >
            <LogOut size={14} />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* ─── Mobile top bar ──────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-surface flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface transition-all text-accent"
          >
            <Menu size={18} />
          </button>
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-2">
          {budgetAlert && (
            <a href="/dashboard/budgets" className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Budget exceeded
            </a>
          )}
          <a
            href="/dashboard/profile"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-surface transition-all"
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

      {/* ─── Mobile full-screen drawer ───────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-background border-r border-surface flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-surface">
              <Logo size="md" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-accent hover:text-text hover:bg-surface transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                      active ? "bg-amber-50 text-amber-700 font-semibold" : "text-muted hover:text-text hover:bg-surface font-medium"
                    )}
                  >
                    <Icon size={16} className={active ? "text-amber-600" : "text-accent"} />
                    <span className="flex-1">{label}</span>
                    {showBadge && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                  </a>
                );
              })}
            </nav>

            {/* Profile + sign out */}
            <div className="p-3 border-t border-surface space-y-1">
              {session?.user && (
                <a
                  href="/dashboard/profile"
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    isActive("/dashboard/profile") ? "bg-amber-50 text-amber-700" : "hover:bg-surface"
                  )}
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="w-8 h-8 rounded-full ring-1 ring-border shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{session.user.name}</p>
                    <p className="text-xs text-accent font-light truncate">{session.user.email}</p>
                  </div>
                </a>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-accent hover:text-red-500 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile bottom nav (4 items + More) ────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-surface flex items-stretch pb-safe shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
        {BOTTOM_NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
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
              <div className="relative">
                <Icon size={19} className={cn("transition-all", active ? "text-amber-600" : "")} strokeWidth={active ? 2.5 : 1.75} />
                {showBadge && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-background" />}
              </div>
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
    </>
  );
}
