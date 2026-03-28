import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.onboarded) redirect("/dashboard");
  return <>{children}</>;
}
