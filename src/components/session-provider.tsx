"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--paper)",
            color: "var(--ink)",
            border: "2px solid var(--ink)",
            borderRadius: "2px",
            boxShadow: "4px 4px 0 var(--ink)",
            fontWeight: 600,
          },
        }}
      />
    </SessionProvider>
  );
}
