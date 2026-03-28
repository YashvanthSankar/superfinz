"use client";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const NAV = [
  { href: "/dashboard",              label: "Overview" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/calculators",  label: "Calculators" },
  { href: "/dashboard/news",         label: "News" },
  { href: "/dashboard/goals",        label: "Goals" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-52 shrink-0 bg-[#fefce8] border-r border-[#fef9c3] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#fef9c3]">
        <Logo size="md" />
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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                active
                  ? "bg-amber-50 text-amber-700 font-semibold"
                  : "text-[#78350f] hover:text-[#713f12] hover:bg-[#fefce8] font-medium"
              )}
            >
              {active && <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />}
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-[#fef9c3] space-y-1">
        {session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
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
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#b45309] hover:text-red-500 hover:bg-red-50 transition-all font-medium"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
