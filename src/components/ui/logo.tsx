"use client";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const textCls =
    size === "sm" ? "text-sm" :
    size === "lg" ? "text-2xl" :
    "text-base";

  const markCls =
    size === "sm" ? "w-1.5 h-1.5" :
    size === "lg" ? "w-3 h-3" :
    "w-2 h-2";

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`${markCls} bg-amber-500 rounded-[2px] rotate-45 shrink-0`} />
      <span className={`${textCls} font-black tracking-tight`}>
        <span className="text-text">super</span><span className="text-amber-600">finz</span>
      </span>
    </span>
  );
}
