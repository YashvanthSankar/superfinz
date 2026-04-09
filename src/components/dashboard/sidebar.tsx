"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard, ArrowLeftRight, Calculator,
  Newspaper, Target, LogOut, TrendingUp, BookOpen,
  MoreHorizontal, Flame, Wallet, ChevronLeft, ChevronRight,
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
const BOTTOM_NAV_MORE    = NAV.slice(4);

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [budgetAlert, setBudgetAlert] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

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

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop sidebar — Tailwind classes work fine here ───── */}
      <aside className={cn(
        "hidden lg:flex shrink-0 bg-background border-r border-border flex-col h-screen sticky top-0 transition-all duration-200",
        collapsed ? "w-[60px]" : "w-52"
      )}>
        <div className={cn(
          "flex items-center border-b border-border",
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
                  )} />
                )}
              </a>
            );
          })}
        </nav>

        <div className="p-2 border-t border-border space-y-0.5">
          {session?.user && (
            <a
              href="/dashboard/profile"
              title={collapsed ? session.user.name ?? "Profile" : undefined}
              className={cn(
                "flex items-center rounded-xl transition-all",
                collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-3 py-2.5",
                isActive("/dashboard/profile") ? "bg-amber-50 text-amber-700" : "hover:bg-surface"
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

      {/* ─── Mobile top bar — inline styles (Tailwind vars unreliable on mobile) */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{ background: "#fefce8", borderBottom: "1px solid #fde68a", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <Logo size="md" />
        <div className="flex items-center gap-2">
          {budgetAlert && (
            <a
              href="/dashboard/budgets"
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
              style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Over budget
            </a>
          )}
          <a href="/dashboard/profile">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" style={{ outline: "1px solid #fde68a" }} />
            ) : (
              <div className="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "#fef3c7", color: "#92400e" }}>
                {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </a>
        </div>
      </div>

      {/* ─── Mobile "More" bottom sheet ──────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200"
            style={{ background: "#fefce8", borderTop: "2px solid #fde68a", borderLeft: "1px solid #fde68a", borderRight: "1px solid #fde68a" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "#fde68a" }} />
            </div>

            {/* Nav items — same style as desktop sidebar links */}
            <nav className="px-3 py-3 space-y-0.5">
              {BOTTOM_NAV_MORE.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={active
                      ? { background: "#fef3c7", color: "#92400e", fontWeight: 600 }
                      : { color: "#78350f", fontWeight: 500 }
                    }
                  >
                    <Icon size={15} style={{ color: "#b45309" }} />
                    <span className="flex-1">{label}</span>
                  </a>
                );
              })}
            </nav>

            {/* Profile + sign out */}
            <div className="px-3 pb-6 pt-1 space-y-0.5" style={{ borderTop: "1px solid #fde68a" }}>
              {session?.user && (
                <a
                  href="/dashboard/profile"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={isActive("/dashboard/profile") ? { background: "#fef3c7", color: "#92400e" } : { color: "#78350f" }}
                >
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="w-7 h-7 rounded-full shrink-0" style={{ outline: "1px solid #fde68a" }} />
                  ) : (
                    <div className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0" style={{ background: "#fef3c7", color: "#92400e" }}>
                      {session.user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "#713f12" }}>{session.user.name}</p>
                    <p className="text-[10px] truncate" style={{ color: "#b45309" }}>{session.user.email}</p>
                  </div>
                </a>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{ color: "#dc2626" }}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile bottom nav ───────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          background: "#fefce8",
          borderTop: "1px solid #fde68a",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {BOTTOM_NAV_PRIMARY.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const showBadge = href === "/dashboard/budgets" && budgetAlert && !active;
          return (
            <a
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-all"
              style={{ color: active ? "#92400e" : "#b45309" }}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full" style={{ background: "#b45309" }} />
              )}
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" style={{ border: "2px solid #fefce8" }} />
                )}
              </div>
              <span style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
            </a>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium"
          style={{ color: "#b45309" }}
        >
          <MoreHorizontal size={20} strokeWidth={1.75} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
