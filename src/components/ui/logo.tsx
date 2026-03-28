import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  sm: { h: 32,  w: 32  },
  md: { h: 44,  w: 44  },
  lg: { h: 72,  w: 72  },
  xl: { h: 60,  w: 60  },
};

export function Logo({ size = "md", className = "" }: LogoProps) {
  const { h, w } = SIZE_MAP[size];
  return (
    <Image
      src="/superfinz.png"
      alt="SuperFinz"
      width={w}
      height={h}
      className={`object-contain ${className}`}
      priority
    />
  );
}
